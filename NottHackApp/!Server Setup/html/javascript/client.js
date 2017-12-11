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
        camera = { x: 0, y: 0 },
        players = [], spikes = [], foods = [],
        me = { mass: 100 };
	
    function drawFood(food) {
		food.offset++;
		if (food.offset > 50) food.offset = -50;
        context.beginPath();
        context.arc(food.x - camera.x, food.y - camera.y, food.mass + (1 - Math.abs(food.offset) / 50)*2, 0, 2 * Math.PI, false);
        context.closePath();
        context.fillStyle = food.fill;
        context.fill();
        context.lineWidth = food.mass/2;
        context.strokeStyle = food.border;
        context.stroke();
    }
    function sineCircleXYatAngle(cx, cy, radius, amplitude, angle, sineCount) {
        var x = cx + (radius + amplitude * Math.sin(sineCount * angle)) * Math.cos(angle);
        var y = cy + (radius + amplitude * Math.sin(sineCount * angle)) * Math.sin(angle);
        return { x: x, y: y };
    }
    function drawSpike(spike) {
		spike.offset++;
		if (spike.offset > 50) spike.offset = -50;
        context.fillStyle = '#00ff00';
        context.lineWidth = spike.mass / 15;
        context.strokeStyle = '#00df00';
        context.beginPath();
        for (var i = 0; i < 360; i++) {
            var angle = i * Math.PI / 180;
            var pt = sineCircleXYatAngle(spike.x - camera.x, spike.y - camera.y, spike.mass,  spike.mass/15 + (1 - Math.abs(spike.offset) / 10), angle + (1 - Math.abs(spike.offset) / 1000), 50);
            context.lineTo(pt.x, pt.y);
        }
        context.closePath();
        context.fill();
        context.stroke();
    }
    function drawPlayer(player) {
        context.beginPath();
        context.arc(player.x - camera.x, player.y - camera.y, player.mass, 0, 2 * Math.PI, false);
        context.fillStyle = player.fill;
        context.fill();
        context.lineWidth = 10;
        context.strokeStyle = player.border;
        context.stroke();
        
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = player.mass/5 + "px Sans-serif";

        context.lineWidth = 5;
        context.strokeStyle = '#111';
        context.strokeText(player.name, player.x - camera.x, player.y - camera.y);

        context.fillStyle = 'white';
        context.fillText(player.name, player.x - camera.x, player.y - camera.y);

        context.font = player.mass/10 + "px Sans-serif";
        context.strokeText(player.mass, player.x - camera.x, player.y - camera.y - player.mass / 5);
        context.fillText(player.mass, player.x - camera.x, player.y - camera.y - player.mass / 5);
    }
    var zoom = 1;
	var grid = new Image();
    function createGrid() {
		var data = '<svg width="5000px" height="2000px" xmlns="http://www.w3.org/2000/svg"> \
			<defs> \
				<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"> \
					<path d="M 50 0 L 0 0 0 50" fill="none" stroke="#eee" stroke-width="1.5" /> \
				</pattern>\
			</defs> \
			<rect width="100%" height="100%" fill="url(#grid)" /> \
		</svg>';
		var DOMURL = window.URL || window.webkitURL || window;
		var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
		var url = DOMURL.createObjectURL(svg);
		grid.src = url;
		console.log(grid);
    }createGrid();
    function objects(data) {
        spikes = data["spikes"];
        foods = data["foods"];
    }
    function updateSpikes(data) {
        spikes = data["spikes"];
    }
    function updateFood(data) {
        foods = data["foods"];
    }
    function update(data) {
        players = data["players"];
        me.mass = data["playermass"]; 

        $('#players').text(players.length + (players.length !== 1 ? ' Players ' : ' Player ') + 'In-game');

        zoom = me.mass * 2 / (parseInt(canvas.style.width, 10) / 5);
        canvas.width = parseInt(canvas.style.width, 10) * zoom;
        canvas.height = parseInt(canvas.style.height, 10) * zoom;
        camera.x = data["playerx"] - canvas.width / 2;
        camera.y = data["playery"] - canvas.height / 2;

		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(grid, -camera.x, -camera.y);
		
        foods.forEach(function (food) { drawFood(food); });
        players.forEach(function (player) { drawPlayer(player); });
        spikes.forEach(function (spike) { drawSpike(spike); });
    }
    function error(description) {
        console.log("ERROR: " + description);
        $('#error').text("ERROR: " + description);
        $('#error').css('visibility', 'visible');
    }
    ws = new WebSocket("ws://139.59.182.80:8080/");
    ws.onerror = function (evt) { error(evt.data); };
    ws.onmessage = function (message) {
        var data;
        try {
            data = JSON.parse(message.data);
        } catch (e) {
            error("Invalid JSON recieved from server. Raw data: " + message.data);
            return;
        }
        switch (data["function"]) {
            case "update": update(data); break;
            case "objects": objects(data); break;
            case "updateSpikes": updateSpikes(data); break;
            case "updateFood": updateFood(data); break;
            case "error": error(data["error"]); break;
            default: error("Unknown function recieved from server: " + data["function"]); break;
        }
    };
    function draw() {
        if (ws.readyState !== ws.CLOSED) {
            context.drawImage(canvas, 0, 0);
            requestAnimFrame(draw);
        } else { error(" Connection closed"); }
    } draw();
    $('form').submit(function (e) {
        e.preventDefault();
        ws.send(JSON.stringify({
            "function": "play",
            "name": $('#name').val(),
            "fill": $('#colour').val()
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