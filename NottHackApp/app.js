'use strict';
var debug = require('debug'),
    logger = require('morgan'),
    uuid = require('uuid4'),
    WebSocketServer = require('ws').Server,
    socket = new WebSocketServer({ port: 8080 }),
    world = {
        minx: 0,
        miny: 0,
        maxx: 5000,
        maxy: 2000,
        foods: 150,
        spikes: 20
    },
    colours = ["#00bfff", "#00ff00", "#ffff66", "#ff9900", "#9900cc", "#ff0000"],
    players = [], foods = [], spikes = [], borders = [];
function send(client, data) {
    try { client.send(data); } catch (e) { console.log("Failed to send data to a client"); }
}
socket.on('connection', function (client) {
    client.id = uuid();
    console.log('Client '+client.id+' connected');
    client.on('message', function (message){
        var object;
        try {
            object = JSON.parse(message);
        } catch (e) {
            send(client, JSON.stringify({ "function": "error", "error": "Invalid JSON recieved from client. Raw data: " + message }));
            return;
        }
        switch (object["function"]) {
            case "play":
                if (!addPlayer(client.id, object["name"], object["fill"])) send(client, JSON.stringify({ "function": "error", "error": "You seem to be playing already" }));
                else send(client, JSON.stringify({ "function": "objects", "foods": foods, "spikes": spikes }));
                break;
            case "move":
                if (!players[client.id]) send(client, JSON.stringify({ "function": "error", "error": "You don't appear to be playing" }));
                else players[client.id].keys = object["keys"];
                break;
            default: send(client, JSON.stringify({ "function": "error", "error": "Unknown function recieved from client" })); break;
        }
    });
});
function checkAlive() {
    var newplayers = [];
    socket.clients.forEach(function (client) { newplayers[client.id] = players[client.id]; });
    for (var id in players)
        if (!newplayers[id])
            console.log('Client ' + id + ' disconnected');
    players = newplayers;
}
function update() {
    var newplayers = [];
    for (var id in players)
        if (players[id]) {
            var speed = 10 - 1 / players[id].mass;
            if (players[id].y - speed > world.miny) if (players[id].keys.w === true) players[id].y -= speed;
            if (players[id].x - speed > world.minx) if (players[id].keys.a === true) players[id].x -= speed;
            if (players[id].y + speed < world.maxy) if (players[id].keys.s === true) players[id].y += speed;
            if (players[id].x + speed < world.maxx) if (players[id].keys.d === true) players[id].x += speed;
            newplayers.push(players[id]);

            for (var index = foods.length - 1; index >= 0; index--) {
                if (Math.hypot(players[id].x - foods[index].x, players[id].y - foods[index].y) <= players[id].mass + foods[index].mass) {
                    foods.splice(index, 1);
                    players[id].mass += 1;
                    console.log("Food removed");
                }
            }
        }
    if (foods.length < world.foods) addFood();
    socket.clients.forEach(function each(client) {
        send(client, JSON.stringify({ "function": "update", "players": newplayers, "playerx": players[client.id] ? players[client.id].x : 0, "playery": players[client.id] ? players[client.id].y : 0, "playermass": players[client.id] ? players[client.id].mass : 0}));
    });
} 
function calculateBorder(colour) {
    var c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
    var r = parseInt(c[1], 16) - 32 > 0 ? parseInt(c[1], 16) - 32 : 0;
    var g = parseInt(c[2], 16) - 32 > 0 ? parseInt(c[2], 16) - 32 : 0;
    var b = parseInt(c[3], 16) - 32 > 0 ? parseInt(c[3], 16) - 32 : 0;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function randomPosition(enforce) {
    var x = Math.random() * (world.maxx - world.minx) + world.minx,
        y = Math.random() * (world.maxy - world.miny) + world.miny,
        valid = false;
    while (enforce && !valid) {
        valid = true;
        for (var i in players)
            if (players[i])
                if (Math.hypot(x - players[i].x, y - players[i].y) <= players[i].radius + 20)
                    valid = false;
    }
    return { x, y };
}
function addPlayer(id, name, fill) {
    for (var i in players)
        if (i === id)
            return false;
    var position = randomPosition(true);
    players[id] = { name: name, fill: fill, border: calculateBorder(fill), mass: 150, x: position.x, y: position.y, keys: { w: false, a: false, s: false, d: false } };
    return true;
}
function addSpike() {
    var position = randomPosition(false);
    if (position != false)
        spikes.push({
            x: position.x,
            y: position.y,
            offset: Math.random() * 100 - 50,
            mass: 150
        });
    socket.clients.forEach(function each(client) {
        send(client, JSON.stringify({ "function": "updateSpikes", "spikes": spikes }));
    });
} 
function addFood() {
    var position = randomPosition(false);
    if (position != false)
        foods.push({
            x: position.x,
            y: position.y,
            offset: Math.random() * 100 - 50,
            mass: 10,
            fill: colours[foods.length % 6],
            border: borders[foods.length % 6]
        });
    socket.clients.forEach(function each(client) {
        send(client, JSON.stringify({ "function": "updateFood", "foods": foods }));
    });
}
for (var i in colours) borders[i] = calculateBorder(colours[i]); 
while (spikes.length < world.spikes) addSpike();
while (foods.length < world.foods) addFood();
setInterval(checkAlive, 5000);
setInterval(update, 30);
update();