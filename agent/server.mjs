import fs from 'fs';
import {Server} from 'net';
import Client from './client';
import WebSocket from 'ws'
import GameServer from './gs'

function connectionHandler(socket) {
    console.log("new connection arrived");
    socket.gs = gameserver.connect();
    let client = new Client(socket);
    client.handshake();
}

const fid = parseInt(process.argv[2]);
const aid = parseInt(process.argv[3]);

const content = fs.readFileSync("../config.json");

global.config = JSON.parse(content);

let farm = global.config["farms"].find((farm) => farm.id === fid);

if (!farm) {
    console.log("farm not found");
    process.exit(1);
}

let agent = farm["agents"].find((agent) => agent.id === aid);

if (!agent) {
    console.log("agent not found");
    process.exit(1);
}

//TODO: gs
let gameserver = new GameServer(global.config["gs"]);


let socketServer = new Server();
socketServer.on('connection', connectionHandler);
socketServer.listen({host: agent.host, port: agent.port});
console.log("agent server listening on " + agent.host + ":" + agent.port);





