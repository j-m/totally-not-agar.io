window.requestAnimFrame = function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback ) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
}();
$(document).ready(function () {
    var canvas = $("canvas")[0], context = canvas.getContext('2d'),
        camera = { x: 0, y: 0, zoom: 25 },
        players = [], spikes = [], foods = [];
    function drawFood(food) {
        context.beginPath();
        context.arc(food.x - camera.x, food.y - camera.y, camera.zoom / 2 + (1 - Math.abs(food.offset) / 50)*2, 0, 2 * Math.PI, false);
        context.closePath();
        context.fillStyle = food.colour;
        context.fill();
        context.lineWidth = camera.zoom / 5;
        context.strokeStyle = calculateBorder(food.colour);
        context.stroke();
    }

    function sineCircleXYatAngle(cx, cy, radius, amplitude, angle, sineCount) {
        var x = cx + (radius + amplitude * Math.sin(sineCount * angle)) * Math.cos(angle);
        var y = cy + (radius + amplitude * Math.sin(sineCount * angle)) * Math.sin(angle);
        return { x: x, y: y };
    }
    function drawSpike(spike) {
        context.fillStyle = '#00ff00';
        context.lineWidth = camera.zoom/4;
        context.strokeStyle = calculateBorder('#00ff00');
        context.beginPath();
        for (var i = 0; i < 360; i++) {
            var angle = i * Math.PI / 180;
            var pt = sineCircleXYatAngle(spike.x - camera.x, spike.y - camera.y, camera.zoom * 4, camera.zoom / 4 + (1 - Math.abs(spike.offset) / 10), angle + (1 - Math.abs(spike.offset) / 1000), 50);
            context.lineTo(pt.x, pt.y);
        }
        context.closePath();
        context.fill();
        context.stroke();
    }

    function drawPlayer(player) {
        context.beginPath();
        context.arc(player.x - camera.x, player.y - camera.y, player.mass/2, 0, 2 * Math.PI, false);
        context.fillStyle = player.fill;
        context.fill();
        context.lineWidth = 10;
        context.strokeStyle = player.border;
        context.stroke();
        
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = 30 + "px Sans-serif";

        context.lineWidth = 5;
        context.strokeStyle = '#111';
        context.strokeText(player.name, player.x - camera.x, player.y - camera.y);

        context.fillStyle = 'white';
        context.fillText(player.name, player.x - camera.x, player.y - camera.y);

        context.font = 18 + "px Sans-serif";
        context.strokeText(player.mass, player.x - camera.x, player.y - camera.y - 30);
        context.fillText(player.mass, player.x - camera.x, player.y - camera.y - 30);
    }
    function grid() {
        context.lineWidth = 1;
        context.strokeStyle = '#EEE';
        for (x = 0; x <= canvas.width+1; x += camera.zoom) {
            context.moveTo(x - camera.x % camera.zoom, 0);
            context.lineTo(x - camera.x % camera.zoom, canvas.height);
            for (y = 0; y <= canvas.height+1; y += camera.zoom) {
                context.moveTo(0, y - camera.y % camera.zoom);
                context.lineTo(canvas.width, y - camera.y % camera.zoom);
            }
        }
        context.stroke();
    }
    function update(data) {
        players = data["players"];
        spikes = data["spikes"];
        foods = data["foods"];

        camera.x = data["playerx"] - canvas.width / 2;
        camera.y = data["playery"] - canvas.height / 2;

        $('#players').text(players.length + (players.length !== 1 ? ' Players ' : ' Player ') + 'In-game');
    }
    function error(description) {
        console.log("ERROR: " + description);
        $('#error').text("ERROR: " + description);
        $('#error').css('visibility', 'visible');
    }
    ws = new WebSocket("ws://localhost:8080/");
    ws.onerror = function (evt) { error(evt.data); };
    ws.onmessage = function (message) {
        var object;
        try {
            object = JSON.parse(message.data);
        } catch (e) {
            error("Invalid JSON recieved from server. Raw data: " + message.data);
            return;
        }
        switch (object["function"]) {
            case "update": update(object); break;
            case "error": error(object["error"]); break;
            default: error("Unknown function recieved from server: " + object["function"]); break;
        }
    };
    function draw() {
        if (ws.readyState !== ws.CLOSED) {
            requestAnimFrame(draw);
            context.clearRect(0, 0, canvas.width, canvas.height);
            grid();
            foods.forEach(function (food) { drawFood(food); });
            players.forEach(function (player) { drawPlayer(player); });
            spikes.forEach(function (spike) { drawSpike(spike); });
        } else { error(" Connection closed"); }
    } draw();
    $('form').submit(function (e) {
        e.preventDefault();
        ws.send(JSON.stringify({
            "function": "play",
            "name": $('#name').val(),
            "fill": $('#colour').val(),
            "border": calculateBorder($('#colour').val())
        }));
        $('form').hide();
        $("canvas").attr("tabindex", "0");
        $("canvas").focus();
        return false;
    });
    var keys = { w: false, a: false, s: false, d: false };
    $("canvas").keydown(function (e) {
        var key = e.which;
        if (key === 65) keys.a = true;
        else if (key === 87) keys.w = true;
        else if (key === 68) keys.d = true;
        else if (key === 83) keys.s = true;
        ws.send(JSON.stringify({ "function": "move", "keys":keys }));
    });

    $("canvas").keyup(function (e) {
        var key = e.which;
        if (key === 65) keys.a = false;
        else if (key === 87) keys.w = false;
        else if (key === 68) keys.d = false;
        else if (key === 83) keys.s = false;
        ws.send(JSON.stringify({ "function": "move", "keys": keys }));
    });
});