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
/*
* GET home page.
*/

exports.index = function (req, res) {
    console.log("isauthenticated: " + req.isAuthenticated());
    res.render('index', { title: 'PicsUniverse Album' });
};

exports.testdb = function (req, res) {

    //connection.connect(function (err) {
    //    !err ? console.log("connection established") : console.log(err);
    //});

    handleDisconnect();
    connection.query('create table if not exists image (' +
        'image_id int not null auto_increment primary key,' +
        'image_name varchar(255) not null unique);', function (err, rows, fields) {
            //if (err) throw err;
        });
    connection.query('create table if not exists tag (' +
        'tag_id int not null auto_increment primary key,' +
        'tag_name varchar(30) not null unique);', function (err, rows, fields) {
            //if (err) throw err;
        });
    connection.query('create table if not exists user (' +
        'user_id int not null auto_increment primary key,' +
        'token varchar(255) not null unique);', function (err, rows, fields) {
            //if (err) throw err;
        });
    connection.query('create table if not exists imagetaguser (' +
        'image_id int not null,' +
        'tag_id int not null,' +
        'user_id int not null,' +
        'primary key (image_id, tag_id, user_id),' +
        'foreign key (image_id) references image(image_id),' +
        'foreign key (tag_id) references tag(tag_id),' +
        'foreign key (user_id) references user(user_id));', function (err, rows, fields) {
            //if (err) throw err;
        });
    connection.end();
    res.redirect('/');
};

exports.bytag = function (req, res) {
    //if ajax request
    if (req.xhr) {
        console.log('this is ajax');
        //split string to array
        var keywords = req.param('tag').split(" ");
        var filenames = [];
        console.log("keywords: " + keywords);

        handleDisconnect();
        function addPic(callback) {
            var ids = [];
            for (i in keywords) {
                console.log(keywords[i]);
                connection.query('select image_id from imagetaguser where tag_id like (' +
                ' select tag_id from tag where tag_name like "' + keywords[i] + '");', function (err, rows, fields) {
                    for (i in rows) {
                        //connection.query('select image_name from image where image_id like "' + rows[i].image_id + '";', function (err, rows, fields) {
                        ids.push(rows[i].image_id);
                    }
                });
                console.log('inloop '+ids);
            }
            console.log(ids);
            //getNamesFromDB(ids, [], callback);
        }
        //here we have a typical asynchronous function. callback hell!
        //function addPic(callback) {
        //    client.sunion(keywords, function (err, result) {
        //        filenames = result;
        //        console.log("To Client: " + filenames);
        //        callback();
        //    });
        //}

        ////send filenames, must be in a function because of callback
        function sendresult(err, filenames) {
            res.json(filenames);
        }

        addPic(sendresult);
    }
    else {
        res.render('gallery', { title: 'Gallery' });
    }
};

exports.byuser = function (req, res) {
    if (req.xhr) {
        console.log('this is ajax');
        var filenames = {};
        handleDisconnect();
        function addPic(callback) {
            connection.query('select image_id from imagetaguser where user_id like (' +
                ' select user_id from user where token like "' + req.param('user') + '");', function (err, rows, fields) {
                    var ids = [];
                    for (i in rows) {
                        ids.push(rows[i].image_id);
                    }
                    console.log(ids);
                    getNamesFromDB(ids, [], callback);
                });
        }

        function sendresult(err, filenames) {
            res.json(filenames);
        }

        addPic(sendresult);
    }
    else if (req.isAuthenticated()) {
        res.render('mygallery', { title: 'My Gallery' });
    }
    else {
        res.redirect('/auth/google');
    }
};

function getNamesFromDB(ids, sofar, cb) {
    var id = ids.shift();
    if (!id)
        cb(null, sofar);
    else {
        connection.query('select image_name from image where image_id like "' + id + '";', function (err, rows, fields) {
            sofar.push(rows[0].image_name);
            getNamesFromDB(ids, sofar, cb);
        });
    }
}


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
        res.redirect("/t/" + req.body.tags.toString().replace(',', ' '));
    }
    else {
        res.redirect('back');
    }
};



// show all thumbnails in the gallery
exports.gallery = function (req, res) {
    //console.log("USER: " + req.user.identifier);
    console.log("isauthenticated: " + req.isAuthenticated());
    var filenames = {};
    //to database
    handleDisconnect();
    function showall(callback) {
        connection.query('select tag_id from tag;', function (err, rows, fields) {
            console.log(rows);

            callback();
        });
        //client.smembers('tags', function (err, tags) {
        //    tags.forEach(function (tag) {
        //        client.sunion(tag, function (err, result) {
        //            filenames[tag] = result;
        //            console.log("To Client with all: " + tag + ": " + filenames[tag]);
        //            //check if all tags are in object filenames
        //            if (Object.keys(filenames).length == tags.length) {
        //                callback();
        //            }
        //        });
        //    });
        //});
    }

    //send filenames, must be in a function because of callback
    function sendresult() {
        console.log("data: " + JSON.stringify(filenames));
        //render with completegallery.jade and provide locals title and data
        res.render('completegallery', { title: 'Gallery', data: JSON.stringify(filenames) });
    }
    showall(sendresult);
};


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