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
                if (addPlayer(client.id, object["name"], object["fill"], object["border"]) === true) client.send(JSON.stringify({ "function": "error", "error": "You seem to be already playing" }));
                break;
            case "move":
                if (movePlayer(client.id, object["keys"]) === true) client.send(JSON.stringify({ "function": "error", "error": "You don't appear to be playing" }));
                break;
            default: client.send(JSON.stringify({ "function": "error", "error": "Unknown function recieved from client" })); break;
        }
    });
});
var world = {
    minx: 0,
    miny: 0,
    maxx: 5000,
    maxy: 2000,
    minfoods: 100,
    maxfoods: 200,
    spikes: 20
};
var players = [], foods = [], spikes = [];
function checkAlive() {
    var newplayers = [];
    socket.clients.forEach(function (client) { newplayers[client.id] = players[client.id]; });
    for (var id in players) {
        if (!newplayers[id])
            console.log('Client ' + id + ' disconnected');
    }
    players = newplayers;
}
setInterval(checkAlive, 10000);
function update() {
    var newplayers = [];
    for (var id in players) {
        if (players[id]) {
            if (players[id].y - 4 > world.miny + players[id].mass / 2 * Math.SQRT2) if (players[id].w === true) players[id].y -= 10;
            if (players[id].x - 4 > world.minx + players[id].mass / 2 * Math.SQRT2) if (players[id].a === true) players[id].x -= 10;
            if (players[id].y + 4 < world.maxy - players[id].mass / 2 * Math.SQRT2) if (players[id].s === true) players[id].y += 10;
            if (players[id].x + 4 < world.maxx - players[id].mass / 2 * Math.SQRT2) if (players[id].d === true) players[id].x += 10;
            newplayers.push(players[id]);
        }
    }
    foods.forEach(function (food) {
        food.offset++;
        if (food.offset > 50) food.offset = -50;
    });
    spikes.forEach(function (spike) {
        spike.offset++;
        if (spike.offset > 50) spike.offset = -50;
    });
    socket.clients.forEach(function each(client) {
        client.send(JSON.stringify({ "function": "update", "players": newplayers, "foods": foods, "spikes": spikes, "playerx": players[client.id] ? players[client.id].x : 0, "playery": players[client.id]?players[client.id].y:0}));
    });
} update();
setInterval(update, 30);
function addPlayer(id, name, fill, border) {
    var found = false;
    players.forEach(function (player) {
        if (player.id === id)
            found = true;
    });
    if (found === false)
        players[id] = { name: name, fill: fill, border: border, mass: 100, x: 150, y: 150, w: false, a: false, s: false, d: false };
    else return true;
}
function movePlayer(id, keys) {
    if (players[id]) {
        players[id].w = keys.w;
        players[id].a = keys.a;
        players[id].s = keys.s;
        players[id].d = keys.d;
    }
    else return true;
}
var colours = ["#00bfff", "#00ff00", "#ffff66", "#ff9900", "#9900cc", "#ff0000"];
function spikeCreate() {
    return {
        x: Math.random() * (world.maxx - world.minx) + world.minx,
        y: Math.random() * (world.maxy - world.miny) + world.miny,
        offset: Math.random() * 100 - 50
    };
}
function spikesAdd() {
    var newspike = spikeCreate(), attempts = 0, valid = false;
    while (valid === false && attempts < 5) {
        attempts++;
        valid = true;
        newspike.x = Math.random() * (world.maxx - world.minx) + world.minx;
        newspike.y = Math.random() * (world.maxy - world.miny) + world.miny;
        for (var i in players) if (players.hasOwnProperty(i)) {
            if (Math.hypot(newspike.x - players[i].x, newspike.y - players[i].y) <= players[i].radius + 20) {
                valid = false;
            }
        }
    }
    spikes.push(newspike);
    if (spikes.length < world.spikes)
        spikesAdd();
} spikesAdd();


function foodCreate() {
    return {
        x: Math.random() * (world.maxx - world.minx) + world.minx,
        y: Math.random() * (world.maxy - world.miny) + world.miny,
        colour: colours[Math.floor(Math.random() * (colours.length - 1))],
        offset: Math.random() * 100 - 50
    };
}
function foodAdd() {
    if (foods.length < world.maxfoods) {
        var newpoint = foodCreate(), attempts = 0, valid = false;
        while (valid === false && attempts < 5) {
            attempts++;
            valid = true;
            newpoint.x = Math.random() * (world.maxx - world.minx) + world.minx;
            newpoint.y = Math.random() * (world.maxy - world.miny) + world.miny;
            for (var i in players) if (players.hasOwnProperty(i)) {
                if (Math.hypot(newpoint.x - players[i].x, newpoint.y - players[i].y) <= players[i].radius + 20) {
                    valid = false;
                }
            }
        }
        foods.push(newpoint);
    }
    if (foods.length < world.minfoods)
        foodAdd();
} foodAdd();