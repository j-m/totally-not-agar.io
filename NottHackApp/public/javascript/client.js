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
    var canvas = document.getElementsByTagName("canvas")[0],
        context = canvas.getContext('2d'),
        camera = { x: 0, y: 0 },
        players = [];
    function drawPlayer(player) {
        context.beginPath();
        context.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, 2 * Math.PI, false);
        context.fillStyle = player.fill;
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = player.border;
        context.stroke();
        
        var textheight = player.radius - 18;
        if (textheight < 18) textheight = 18;
        if (textheight > 32) textheight = 32;

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = textheight + "px Sans-serif";

        context.lineWidth = 5;
        context.strokeStyle = '#000';
        context.strokeText(player.name, player.x - camera.x, player.y - camera.y);

        context.fillStyle = 'white';
        context.fillText(player.name, player.x - camera.x, player.y - camera.y);

        context.font = textheight / 2 + "px Sans-serif";
        context.strokeText(Math.ceil(player.radius), player.x - camera.x, player.y - camera.y - textheight);
        context.fillText(Math.ceil(player.radius), player.x - camera.x, player.y - camera.y - textheight);
    }
    (function draw() {
        requestAnimFrame(draw);
        context.clearRect(0, 0, canvas.width, canvas.height);
        players.forEach(function (player) { drawPlayer(player) });
    })();
    function update(data) {
        players = data["players"];
        $('#players').text(players.length + ((players.length != 1) ? ' Players ':' Player ') + 'In-game');
    }
    function error(description) { console.log("ERROR: " + description); }
    ws = new WebSocket("ws://localhost:8080/");
    ws.onerror = function (evt) { error(evt.data) }
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
    }
    $('form').submit(function (e) {
        e.preventDefault();
        console.log("Joining game");
        ws.send(JSON.stringify({
            "function": "play",
            "name": $('#name').val(),
            "fill": $('#colour').val(),
            "border": calculateBorder($('#colour').val())
        }));
        $('form').hide();
        return false;
    });
});