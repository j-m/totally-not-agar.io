'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/error.html');
});
app.set('port', process.env.PORT || 8080);

var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(app.get('port'));

io.sockets.on('connection', function (client) {
    console.log("New socket: ", client.id);
    client.on('disconnect', function () {
        console.log("Player left: ", client.id);
        if (players[client.id]) delete players[client.id];
    });
    client.on('join', function (name, colour) {
        console.log("Player joined: ", client.id);
    });
});