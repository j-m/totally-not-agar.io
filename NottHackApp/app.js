'use strict';
var debug = require('debug'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    uuid = require('uuid4'),
    express = require('express'),
    app = express(),
    http = require('http').Server(app),
    WebSocketServer = require('ws').Server,
    socket = new WebSocketServer({ port: 8080 });

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
http.listen(app.get('port'));

socket.broadcast = function broadcast(data) {
    socket.clients.forEach(function each(client) {
        client.send(data);
    });
};

socket.on('connection', function (client) {
    client.id = uuid();
    console.log('Client '+client.id+' joined');
    client.on('message', function (message){
        var object;
        try {
            object = JSON.parse(message);
        } catch (e) {
            client.send(JSON.stringify({ "function": "error", "error": "Invalid JSON recieved from client. Raw data: " + message }));
            return;
        }
        switch (object["function"]) {
            case "play":
                var err = addPlayer(client.id, object["name"], object["fill"], object["border"]);
                if (err == true) client.send(JSON.stringify({ "function": "error", "error": "You seem to be already playing" }));
                break;
            default: client.send(JSON.stringify({ "function": "error", "error": "Unknown function recieved from client" })); break;
        }
    });

});

var players = [];
function addPlayer(id, name, fill, border) {
    var found = false;
    players.forEach(function (player) {
        if (player.id == id)
            found = true;
    })
    if (found == false)
        players.push( { id: id, name: name, fill: fill, border: border, radius: 50, x: 150, y:150 });
    else return true;
}
function update() {
    socket.broadcast(JSON.stringify({ "function": "update", players }));
};
function init() {
    if (typeof game_loop != "undefined") clearInterval(game_loop);
    var game_loop = setInterval(update, 30);
}init();