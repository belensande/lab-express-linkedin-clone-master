const express      = require('express');
const path         = require('path');
const favicon      = require('serve-favicon');
const logger       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const authController = require("./routes/authController");
const profilesController = require("./routes/profilesController");
const usersController = require("./routes/usersController");
const relationsController = require("./routes/relationsController");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const app = express();

mongoose.connect('mongodb://localhost:27017/linkedIn-dev', { useMongoClient: true });

app.use(session({
	secret: "basic-auth-secret",
	cookie: { maxAge: 300000 },
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: 24 * 60 * 60 // 1 day
	})
}));

app.use(function (req, res, next) {
	res.locals.logged = req.session.currentUser ? true : false;
	res.locals.dir = req.originalUrl;
	if (req.session.currentUser) {
		res.locals.user = req.session.currentUser;
	}
	next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set("layout", "main-layout");
app.locals.title = "LinkedIn";

app.use('/', authController);
app.use('/profiles', profilesController);
app.use('/users', usersController);
app.use('/relations', relationsController);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
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
