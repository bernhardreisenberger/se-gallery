
/**
* Module dependencies.
*/

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy;

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
},
  function (identifier, profile, done) {
      console.log('ident: ' + identifier);
      //User.findOrCreate({ openId: identifier }, function (err, user) {
      //    done(err, user);
      //});
      profile.identifier = identifier;
      return done(null, profile);
  }
));

exports.connection = mysql.createConnection({
    host: 'localhost',
    user: 'se-galleryUkd2o',
    password: '}z{tjB)]t;x2'
});

app.get('/', function (req, res) {
    res.render('index', { title: 'Home' })
});
app.get('/test/db', routes.testdb);
app.get('/gallery', routes.showall);
//:filter can be accessed with the req.param()
app.get('/:filter', routes.filter);

app.post('/upload', routes.upload);
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
      res.redirect('/');
  });

app.get('/auth/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});




http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
