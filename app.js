var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

socketConnections = [];
socketUsers = [];
//call socket.io to the app
app.io = require('socket.io')();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.io.on('connection', function(socket){  

  socketConnections.push(socket);
  console.log('a user connected. total users: %s', socketConnections.length);
  //DISCONNECT
  socket.on('disconnect', function(data){
    app.io.emit('buddy departs', socket.username);
    
    if(socketUsers.indexOf(socket.username) !== -1){
      socketUsers.splice(socketUsers.indexOf(socket.username), 1);
    }
    
    socketConnections.splice( socketConnections.indexOf(socket), 1 )
    updateUserNames();
    
    console.log(' a user disconnected. total users %s', socketConnections.length);
  });
  //SET USERNAME
  socket.on('new username', function(data, callback){
    callback(true);
    socket.username = data;
    socketUsers.push(socket.username);
    app.io.emit('buddy arrives', socket.username);
    updateUserNames();
  });
  //USER IS TYPING 
  socket.on('user typing', function(data){
    app.io.emit('update typing status', socket.username);
  });
  //NOONE IS TYPING
  socket.on('noone typing', function(){
    app.io.emit('update typing status');
  });

  //SEND MESSAGE
  socket.on('send message', function(data){
    app.io.emit('new message', {username: socket.username, msg: data.msg} );
  });
  
  function updateUserNames(){
    app.io.emit('get users', socketUsers);
  }
});

module.exports = app;

