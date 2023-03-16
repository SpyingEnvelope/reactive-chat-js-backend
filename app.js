var createError = require('http-errors');
var express = require('express');
var indexRouter = require('./routes/index');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config()

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Body Parser for post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use('/', indexRouter);

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

const listener = app.listen(process.env.PORT || 8000, () => {
  console.log("Server is listening on port " + listener.address().port);
});

module.exports = app;
