const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes');
const google_auth = require('./config/keys');

const app = express();

// ------------------------------------------------------------------------------
// Mongoose Setup
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
mongoose.connect('mongodb://localhost/cyc',{ useNewUrlParser: true });
const db = mongoose.connection;
const Schema = mongoose.Schema;
const user_schema = new Schema ({
    _id: String,
    token: String,
    refresh: String,
    displayName: String,
    email: String,
    picture: String, // in url form
    current_in: String,
    last_in: String
});
user_schema.plugin(findOrCreate);
const Users = db.model('users', user_schema);

// ------------------------------------------------------------------------------


const server           = require( 'http' ).createServer( app )
    , passport         = require( 'passport' )
    , util             = require( 'util' )
    , bodyParser       = require( 'body-parser' )
    , session          = require( 'express-session' )
    , RedisStore       = require( 'connect-redis' )( session )
    , GoogleStrategy   = require( 'passport-google-oauth2' ).Strategy;

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
const GOOGLE_CLIENT_ID      = google_auth.GOOGLE_AUTH.CLIENT_ID
    , GOOGLE_CLIENT_SECRET  = google_auth.GOOGLE_AUTH.CLIENT_SECRET;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
      clientID:     GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback   : true
    },
    function(request, accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {

          const today = new Date();
          const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
          const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
          const dateTime = date+' '+time;


          // First time user will have had no prior login
          let last = "Right Now!";

          Users.findById({_id: profile.id})
              .select("current_in")
              .then(function(user,err) {
                 if (!err && user) {
                     last = user.current_in;
                     console.log("success date " + user.current_in);
                 }
                 else {
                      console.log("db error " + err + " on user " + user);
                 }
              })
              .then(()=> {
          Users.findOneAndUpdate({_id: profile.id},{
              _id: profile.id,
              token: accessToken,
              refresh: refreshToken,
              displayName: profile.displayName,
              email: profile.email,
              picture: profile.picture, // in url form
              last_in: last,
              current_in: dateTime
          },{upsert:true,new:true}, function (err, user) {
              return done(err, user);
          })})

      });
    }
));

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use( express.static(__dirname + '/public'));
app.use( cookieParser());
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
  extended: true
}));
app.use( session({
  secret: 'cookie_secret',
  name:   'kaas',
  store:  new RedisStore({
    host: '127.0.0.1',
    port: 6379
  }),
  proxy:  true,
  resave: true,
  saveUninitialized: true
}));
app.use( passport.initialize());
app.use( passport.session());

// If i leave this uncommented it will say port 3000 already in use. Why? Who's to know.
//server.listen( 3000 );



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// TODO: figure out what this does and if I can actually safely delete it or not
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
