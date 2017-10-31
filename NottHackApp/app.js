'use strict';
var debug = require('debug'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express(),
    express = require('express'),
    app = express(),
    http = require('http').Server(app),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 8080
    });

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
app.get('/', function (req, res) {res.sendFile(__dirname + '/index.html');});
app.get('*', function (req, res) {res.sendFile(__dirname + '/public/error.html');});
app.set('port', process.env.PORT || 8080);

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};

wss.on('connection', function (ws) {
    ws.on('message', function (msg) {
        var data = JSON.parse(msg);
        if (data.message) wss.broadcast('<strong>' + data.name + '</strong>: ' + data.message);
    });
});

http.listen(process.env.PORT, function () {});
