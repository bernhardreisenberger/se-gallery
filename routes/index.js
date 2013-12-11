var api = require('./api');
/*
* GET home page.
*/

exports.index = function (req, res) {
    console.log("isauthenticated: " + req.isAuthenticated());
    res.render('index', { title: 'PicsUniverse Album' });
};

exports.bytag = function (req, res) {
    //if ajax request
    if (req.xhr) {
        api.bytag(req, res);
    }
    else {
        res.render('gallery', { title: 'Gallery' });
    }
};

exports.byuser = function (req, res) {
    if (req.xhr) {
        api.byuser(req, res);
    }
    else if (req.isAuthenticated()) {
        res.render('mygallery', { title: 'My Gallery' });
    }
    else {
        res.redirect('/auth/google');
    }
};

// show all thumbnails in the gallery
exports.gallery = function (req, res) {
    if (req.xhr) {
        api.gallery(req, res);
    }
    else { res.render('completegallery', { title: 'Gallery' }); }
};

// upload new files to tag directory
exports.upload = function (req, res) {
    if (req.files.images.length != 0) {
        api.upload(req, res);
        res.redirect("/t/" + req.body.tags.toString().replace(',', ' '));
    }
    else {
        res.redirect('back');
    }
};