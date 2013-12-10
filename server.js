
/**
* Module dependencies.
*/

var express = require('express')
  , routes = require('./routes')
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
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
},
  function (identifier, profile, done) {
      console.log('ident: ' + identifier);
      //get saved in req.user and can be accessed by req.user.identifier
      return done(null, { identifier: identifier });
  }
));



app.get('/', function (req, res) {
    res.render('index', { title: 'Home' })
});
app.get('/test/db', routes.testdb);
app.get('/mygallery', routes.usergallery);
app.get('/gallery', routes.showall);
//:filter can be accessed with the req.param()
app.get('/:filter', routes.filter);

app.post('/upload', routes.upload);
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
      console.log("isauthenticated: " + req.isAuthenticated());
      res.redirect('/mygallery');
  });

app.get('/auth/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});




http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
