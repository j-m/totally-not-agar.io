$(document).ready(function () {
    websocket = new WebSocket("ws://localhost:8080/");
    $('form').submit(function () {
        name = $('#name').val() ? $('#name').val() : 'Anonymous';
        $('#name-div').hide();
        $('#welcome').text('Hello ' + name);
        websocket.send(JSON.stringify({
            name: name,
            message: $('#message').val()
        }));
        $('#message').focus();
        $('#message').val('');
        return false;
    });

    websocket.onmessage = function (evt) {
        $('#messages').append($('<li>').html(evt.data));
    };

    websocket.onerror = function (evt) {
        $('#messages').append($('<li>').text('<span style="color: red;">ERROR:</span> ' + evt.data));
    };

    //$('form').submit(function (e) {
    //    e.preventDefault();
    //    var name = $('#name').val(), colour = $('#colour').val();
    //    console.log("Joining");
    //  //  socket.emit('spawn', name, colour);
    //    $('form').hide();
    //});
});