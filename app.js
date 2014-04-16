
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var swig = require('swig');

var app = express();

// Swig Setup
app.set('view engine', 'swig');
app.set('view cache', false);
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
swig.setDefaults({ cache: false });


// all environments
app.set('port', process.env.PORT || 8000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static('public'));
app.use(app.router);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/omari', function(req, res) {
  io.sockets.emit("drum_hit");
})
// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html');
// });

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  socket.on('drum_hit', function(data) {
    socket.broadcast.emit('drum_played',{"source_serv":data});
  });
});
// Socket io

// app.listen(80);
