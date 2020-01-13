console.log("External.js ran")

var socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", function(event) {
	socket.send("Template is connected to the server");
})

// Listen for messages
socket.addEventListener('message', function (event) {
	console.log('Message from server ', event.data);
	// location.reload(true);
});

socket.addEventListener('close', function (event) {
	console.log('Message closing  ', event.data);
	location.reload(true);
});