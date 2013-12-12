
/**
* Module dependencies.
*/

var express = require('express')
  , routes = require('./routes')
  , api = require('./routes/api')
  , http = require('http')
  , path = require('path')
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
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'keyboard cat' }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost/auth/google/return',
    realm: 'http://localhost/'
},
  function (identifier, profile, done) {
      //substring important part of the identifier
      //get saved in req.user and can be accessed by req.user.identifier
      return done(null, { id: identifier.substring(identifier.indexOf('=') + 1) });
  }
));

app.get('/test/db', api.createdb);

//website routes
app.get('/', function (req, res) {
    res.render('index', { title: 'Home' })
});
app.post('/upload', routes.upload);
app.get('/u', function (req, res) {
    res.redirect('/auth/google');
});
app.get('/u/:user', routes.byuser);
app.get('/t/:tag', routes.bytag);
app.get('/gallery', routes.gallery);
//:filter can be accessed with the req.param()


//api routes
app.post('/api/upload', api.upload);
app.get('/api/u/:user', api.byuser);
app.get('/api/t/:tag', api.bytag);
app.get('/api/gallery', api.gallery);
app.get('/api/login', function (req, res) {
    res.redirect('/auth/google');
});
app.get('/api/logout', function (req, res) {
    res.redirect('/auth/logout');
});

//authentification routes
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
//redirect to personal site
  function (req, res) {
      res.redirect('/u/' + req.user.id);
  });
app.get('/auth/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
