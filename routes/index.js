var fs = require('fs');
var redis = require('redis');
var url = require('url');
var easyimg = require('easyimage');
var redisURL = url.parse('redis://rediscloud:O2OHt0F7MDYS4vYW@pub-redis-18098.us-east-1-2.3.ec2.garantiadata.com:18098');
var client = redis.createClient(redisURL.port, redisURL.hostname, { no_ready_check: true });
client.auth(redisURL.auth.split(":")[1]);
var sqlconnect = require('../server');


/*
* GET home page.
*/

exports.index = function (req, res) {
    res.render('index', { title: 'PicsUniverse Album' });
};

exports.testdb = function (req, res) {
    sqlconnect.connection.connect(function (err) {
        !err ? console.log("connection established") : console.log(err);
    });
    res.redirect('/');
};

exports.filter = function (req, res) {
    //if ajax request
    if (req.xhr) {
        console.log('this is ajax');
        //split string to array
        var keywords = req.param('filter').split(" ");
        var filenames = [];
        //here we have a typical asynchronous function. callback hell!
        function addPic(callback) {
            client.sunion(keywords, function (err, result) {
                filenames = result;
                console.log("To Client: " + filenames);
                callback();
            });
        }

        //send filenames, must be in a function because of callback
        function sendresult() {
            res.json(filenames);
        }

        addPic(sendresult);
    }
    else {
        res.render('gallery', { title: 'Gallery' });
    }
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
        console.log("All Input-Tags: " + req.body.tags);
        //to redis with the tags
        for (tag in req.body.tags) {
            req.files.images.forEach(function (image) {
                //check for type image
                if (image.type.indexOf("image/") === 0) {
                    client.sadd(req.body.tags[tag], image.name);
                    console.log(image.name + " added to " + req.body.tags[tag]);
                }
            });
            //save all tags as value to key "tags"
            client.sadd('tags', req.body.tags[tag]);
        }
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
        res.redirect("/" + req.body.tags.toString().replace(',', ' '));
    }
    else {
        res.redirect('back');
    }
};

// show all thumbnails in the gallery
exports.showall = function (req, res) {
    var filenames = {};
    function showall(callback) {
        client.smembers('tags', function (err, tags) {
            tags.forEach(function (tag) {
                client.sunion(tag, function (err, result) {
                    filenames[tag] = result;
                    console.log("To Client with all: " + tag + ": " + filenames[tag]);
                    //check if all tags are in object filenames
                    if (Object.keys(filenames).length == tags.length) {
                        callback();
                    }
                });
            });
        });
    }

    //send filenames, must be in a function because of callback
    function sendresult() {
        console.log("data: " + JSON.stringify(filenames));
        //render with completegallery.jade and provide locals title and data
        res.render('completegallery', { title: 'Gallery', data: JSON.stringify(filenames) });
    }
    showall(sendresult);
};