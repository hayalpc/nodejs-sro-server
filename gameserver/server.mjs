/*
import fs from 'fs';
import {Server} from 'net';
import Client from './client';

function connectionHandler(socket) {
    console.log("new connection arrived");

    let client = new Client(socket);
    client.handshake();
}

const content = fs.readFileSync("../config.json");
let config0 = JSON.parse(content);
global.config = config0["gs"];

let socketServer = new Server();

socketServer.on('connection', connectionHandler);
socketServer.listen({host: config["host"], port: config["port"]});

console.log("game server listening on " + config["host"] + ":" + config["port"]);
*/

import http from 'http';
import io from 'socket.io';

// Create server & socket
var server = http.createServer(function (req, res) {
    // Send HTML headers and message
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<h1>Aw, snap! 404</h1>');
});
server.listen(1337);
const listen = io.listen(server);

// Add a connect listener
listen.sockets.on('connection', function (socket) {
    console.log('Client connected.');

    // Disconnect listener
    socket.on('disconnect', function () {
        console.log('Client disconnected.');

    });
});
