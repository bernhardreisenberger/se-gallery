var fs = require('fs');
var url = require('url');
var easyimg = require('easyimage');
var dbconfig = {
    host: 'localhost',
    database: 'se-gallery',
    user: 'se-galleryUkd2o',
    password: '}z{tjB)]t;x2'
};
var mysql = require('mysql');

exports.bytag = function (req, res) {
    //split string to array
    var keywords = req.param('tag').split(" ");
    console.log("keywords: " + keywords);

    handleDisconnect();
    function addPic(callback) {
        //to derive all image_ids from each tag, we use a recursive function with callback
        getIDByTagFromDB(keywords, [], function (ids) {
            console.log('derived ids: ' + ids);
            //for each image_id get the image_name recursively
            getNamesFromDB(ids, [], callback)
        });
    }

    //send filenames, must be in a function because of callback
    function sendresult(err, filenames) {
        res.json(removeDuplicates(filenames));
    }

    addPic(sendresult);
};

exports.byuser = function (req, res) {
    handleDisconnect();
    function addPic(callback) {
        //async query
        connection.query('select image_id from imagetaguser where user_id like (' +
                ' select user_id from user where token like ?);', [req.param('user')], function (err, rows, fields) {
                    var ids = [];
                    //save all ids from user to array ids
                    for (i in rows) {
                        ids.push(rows[i].image_id);
                    }
                    console.log(ids);
                    //for each image_id get the image_name recursively
                    getNamesFromDB(ids, [], callback);
                });
    }

    function sendresult(err, filenames) {
        res.json(removeDuplicates(filenames));
    }

    addPic(sendresult);
    if (!req.isAuthenticated()) {
        res.redirect('/auth/google');
    }
};

// show all thumbnails in the gallery
exports.gallery = function (req, res) {
    var filenames = {};
    //to database
    handleDisconnect();
    function showall(callback) {
        //query tag_names for filters
        connection.query('select tag_name from tag;', function (err, rows, fields) {
            console.log(rows);
            //save all names from tag to array names
            var tag_names = [];
            for (i in rows) {
                //fill array for recursive function
                tag_names.push(rows[i].tag_name);
                //set tag_names as properties of Object filenames
                filenames[rows[i].tag_name] = true;
            }
            //fill object filenames with image_names
            getNamesByTagFromDB(tag_names, filenames, callback);
        });
    }

    //send filenames, must be in a function because of callback
    function sendresult() {
        console.log("data: " + JSON.stringify(filenames));
        res.json(filenames);
    }
    showall(sendresult);
};

// upload new files to tag directory
exports.upload = function (req, res) {
    var imagePath = "./public/uploads";
    var thumbPath = "./public/thumbnails";

    if (req.files.images.length != 0) {
        //if only one file is uploaded change to array
        if (req.files.images.name != undefined) {
            req.files.images = [req.files.images];
        }
        //if only one tag will be submitted, we get a string...we do need an array
        if (typeof req.body.tags === 'string') {
            req.body.tags = [req.body.tags];
        }

        //if not logged in, userid will be set to guest
        if (req.user == undefined) {
            req.user = {};
            req.user.id = 'guest';
        }

        //to database
        handleDisconnect();
        for (tag in req.body.tags) {
            req.files.images.forEach(function (image) {
                //check for type image
                if (image.type.indexOf("image/") === 0) {
                    //image
                    connection.query('insert into image (image_name)' +
                    ' values (?);', [image.name], function (err, rows, fields) {
                        if (err) { console.log(fields, rows, err) };
                    });
                    //tag
                    connection.query('insert into tag (tag_name)' +
                    ' values (?);', [req.body.tags[tag]], function (err, rows, fields) {
                        if (err) { console.log(fields, rows, err) };
                    });
                    //user
                    connection.query('insert into user (token)' +
                    ' values (?);', [req.user.id], function (err, rows, fields) {
                        if (err) { console.log(fields, rows, err) };
                    });
                    //imagetaguser
                    connection.query('insert into imagetaguser (image_id,tag_id,user_id)' +
                    ' select image.image_id, tag.tag_id, user.user_id from image,tag,user' +
                    ' where image.image_name like ? and tag.tag_name like ?' +
                    ' and user.token like ?;', [image.name, req.body.tags[tag], req.user.id], function (err, rows, fields) {
                        if (err) { console.log(fields, rows, err) };
                    });


                    console.log(image.name + " added to " + req.body.tags[tag]);
                }
            });
        }
        connection.end();

        //if uploads does not exist, create it
        if (!fs.existsSync(imagePath)) {
            fs.mkdirSync(imagePath);
        }
        //if thumbnails does not exist, create it
        if (!fs.existsSync(thumbPath)) {
            fs.mkdirSync(thumbPath);
        }
        req.files.images.forEach(function (file) {
            //check for type image
            if (file.type.indexOf("image/") === 0) {
                var target_file = imagePath + "/" + file.name;
                var thumb_file = thumbPath + "/" + file.name;
                //move file to uploads folder
                fs.rename(file.path, target_file, function (err) {
                    if (err) throw err;
                    // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                    fs.unlink(file.path, function () {
                        if (err) throw err;
                    });
                    //easyimg produces error 'file not supported' if imagemagick does not exist
                    //better error handling
                    easyimg.info(target_file, function (err, stdout, stderr) {
                        if (err) throw err + ' Imagemagick probably not installed correctly';
                        easyimg.thumbnail(
                        {
                            src: target_file, dst: thumb_file,
                            width: 200, height: 200,
                            x: 0, y: 0
                        }, function (err, image) {
                            if (err) throw err;
                            console.log('Thumbnail created');
                            console.log(image);
                        });
                    });
                });
            }
        });
    }
};

//used to get all tags and filenames into one object
function getNamesByTagFromDB(keywords, filenames, cb) {
    var keyword = keywords.shift();
    if (!keyword) {
        cb(filenames);
    }
    else {
        connection.query('select image_id from imagetaguser where tag_id like (' +
                ' select tag_id from tag where tag_name like ?);', [keyword], function (err, rows, fields) {
                    var image_ids = [];
                    for (i in rows) {
                        image_ids.push(rows[i].image_id);
                    }
                    getNamesFromDB(image_ids, [], function (err, result) {
                        filenames[keyword] = result;
                        console.log("inner res: " + filenames[keyword]);
                        getNamesByTagFromDB(keywords, filenames, cb);
                    });
                });
    }
}

function getIDByTagFromDB(keywords, image_ids, cb) {
    var keyword = keywords.shift();
    if (!keyword) {
        console.log("sofar return: " + image_ids);
        cb(image_ids);
    }
    else {
        connection.query('select image_id from imagetaguser where tag_id like (' +
                ' select tag_id from tag where tag_name like ?);', [keyword], function (err, rows, fields) {
                    for (i in rows) {
                        //connection.query('select image_name from image where image_id like "' + rows[i].image_id + '";', function (err, rows, fields) {
                        image_ids.push(rows[i].image_id);
                    }
                    getIDByTagFromDB(keywords, image_ids, cb);
                });
    }
}

function getNamesFromDB(ids, image_names, cb) {
    var id = ids.shift();
    if (!id)
        cb(null, image_names);
    else {
        connection.query('select image_name from image where image_id like ?;', [id], function (err, rows, fields) {
            image_names.push(rows[0].image_name);
            getNamesFromDB(ids, image_names, cb);
        });
    }
}

function removeDuplicates(myArray) {
    return myArray.filter(function (elem, pos) {
        return myArray.indexOf(elem) == pos;
    });
}


//needed to establish the connection
function handleDisconnect() {
    connection = mysql.createConnection(dbconfig); // Recreate the connection, since the old one cannot be reused.
    connection.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}