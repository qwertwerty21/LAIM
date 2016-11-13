var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var routes = require('./routes/index');
var users = require('./routes/users');
var mongoURL = 'mongodb://sunnylaim:laim@ds151917.mlab.com:51917/laimchatlogdb';

var app = express();

socketConnections = {};
//TO DO DELETE SOCKET USERS MOVE IT ALL TO SOCKET CONNECTIONS
socketUsers = [];
//call socket.io to the app
app.io = require('socket.io')();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

mongoose.connect(mongoURL, function(err){
  if(err){
    console.log(err);
  }
  else{
    console.log('Connected to mongodb!')
  }
});
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

var chatSchema = mongoose.Schema({
    socketId: String,
    username: String,
    msg: String,
    textBGColor: String,
    timeCreated: {type: Date, default: Date.now } 
});

var ChatModel = mongoose.model('message', chatSchema);

app.io.on('connection', function(socket){  

  socketConnections[socket.id] = {
    "socketInfo": socket,
    "username": null,
    "textBgColor": 'transparent'
  };
  console.log('sock ' + socket.id + 'socketinfo' + socketConnections[socket.id].socketInfo);
  console.log('a user connected. total users: ', Object.keys(socketConnections).length);
  //GET DATA IN MONGODB TO LOAD OLD MSGS
  ChatModel.find({}, function(err, docs){
    if(err){
      throw err;
    }
    console.log(docs);
    socket.emit('load old msgs', docs);
  });
  //DISCONNECT
  socket.on('disconnect', function(data){
    app.io.emit('buddy departs', socketConnections[socket.id]['username']);
    
    if(socketUsers.indexOf(socketConnections[socket.id]['username']) !== -1){
      socketUsers.splice(socketUsers.indexOf(socketConnections[socket.id]['username']), 1);
    }
    
    delete socketConnections[socket.id];
    updateUserNames();
    
    console.log(' a user disconnected. total users %s', Object.keys(socketConnections).length);
  });
  //SET USERNAME
  socket.on('new username', function(data, callback){
    console.log(socketConnections[socket.id]);
    callback(true);
    socketConnections[socket.id]['username']= data;
    console.log('usename is ' + socketConnections[socket.id].username);
    socketUsers.push(data);
    
    app.io.emit('buddy arrives', socketConnections[socket.id].username);
    updateUserNames();
  });
  //USER IS TYPING 
  socket.on('user typing', function(data){
    app.io.emit('update typing status', socketConnections[socket.id].username);
  });
  //NOONE IS TYPING
  socket.on('noone typing', function(){
    app.io.emit('update typing status');
  });
  //TEXT COLOR BG CHANGE
  socket.on('text bg color change', function(data){
    socketConnections[socket.id].textBgColor = data.bgColor;
    console.log('ooyoyoyo' +socketConnections[socket.id].textBgColor);
  });

  //SEND MESSAGE
  socket.on('send message', function(data){
    var newMsg = new ChatModel({
      socketId: socket.id,
      username: socketConnections[socket.id].username, 
      msg: data.msg,
      textBGColor: socketConnections[socket.id].textBgColor
    });
    console.log('new messgajsdfs ' + newMsg)
    newMsg.save(function(err, mes){
      if(err) return handleError(err);
    });
    app.io.emit('new message', {
      username: socketConnections[socket.id].username, 
      msg: data.msg,
      textBGColor: socketConnections[socket.id].textBgColor
    } );
    
  });
  
  function updateUserNames(){
    console.log('socketsuers' + socketUsers)
    app.io.emit('get users', socketUsers);
  }
});

module.exports = app;


