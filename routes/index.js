var fs = require('fs');
var redis = require('redis');
var url = require('url');
var redisURL = url.parse('redis://rediscloud:O2OHt0F7MDYS4vYW@pub-redis-18098.us-east-1-2.3.ec2.garantiadata.com:18098');
var client = redis.createClient(redisURL.port, redisURL.hostname, { no_ready_check: true });
client.auth(redisURL.auth.split(":")[1]);

/*
* GET home page.
*/

exports.index = function (req, res) {
    res.render('index', { title: 'Upload new Image' });
};

exports.filter = function (req, res) {
    //if ajax request
    if (req.xhr) {
        console.log('this is ajax');
        //split string to array
        var keywords = req.param('filter').split(" ");
        var imagePath = "./public/uploads";
        var filenames = [];
        //here we have a typical asynchronous function. callback hell!
        function addPic(callback) {
            client.sunion(keywords, function (err, result) {
                filenames = result;
                console.log("To Client: " + filenames);
                callback();
            });
        }
        addPic(sendresult);
        //send filenames, must be in a function because of callback
        function sendresult() {
            res.json(filenames);
        }
    }
    else {
        res.render('gallery', { title: req.param('filter') });
    }
};


// upload new files to tag directory
exports.upload = function (req, res) {
    var imagePath = "./public/uploads";

    if (req.files.image.name != '') {
        //if only one tag will be submitted, we get a string...we do need an array
        if (typeof req.body.tags === 'string') {
            req.body.tags = [req.body.tags];
        }
        console.log("All Input-Tags: " + req.body.tags);
        //to redis with the tags
        for (tag in req.body.tags) {
            client.sadd(req.body.tags[tag], req.files.image.name);
            console.log(req.files.image.name + " added to " + req.body.tags[tag]);
        }
        //if uploads does not exist, create it
        if (!fs.existsSync(imagePath)) {
            fs.mkdirSync(imagePath);
        }
        //write file to server and redirect to uploaded files
        fs.readFile(req.files.image.path, function (err, data) {
            var file = imagePath + "/" + req.files.image.name;
            fs.writeFile(file, data, function (err) {
                res.redirect("/" + req.body.tags.toString().replace(',',' '));
            });
        });
        console.log("uploaded file " + req.files.image.name);
    }
};