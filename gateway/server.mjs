import fs from 'fs';
import {Server} from 'net';
import Client from './client';

function connectionHandler(socket) {
    console.log("new connection arrived");

    let client = new Client(socket);
    client.handshake();
}

const content = fs.readFileSync("../config.json");
global.config = JSON.parse(content);

let socketServer = new Server();

socketServer.on('connection', connectionHandler);
socketServer.listen({host: config["host"], port: config["port"]});

console.log("agent server listening on " + config["host"] + ":" + config["port"]);