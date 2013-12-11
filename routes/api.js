exports.upload = function (req, res) {
    console.log("isauthenticated: " + req.isAuthenticated());
    res.render('index', { title: 'PicsUniverse Album' });
};