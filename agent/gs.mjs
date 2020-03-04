// import WebSocket from "ws";
import io from 'socket.io-client';

export default class Client {

    constructor(config) {
        this.config = config;
    }
    connect() {
        //const url = 'ws://' + this.config["host"] + ':' + this.config["port"];

        // var connection = new WebSocket('ws://127.0.0.1:1337');
        //
        // connection.onopen = this.onOpen;
        // connection.onerror = this.onError;
        // connection.onclose = this.onClose;
        //
        // connection.onmessage = function (message) {
        //     try {
        //         var json = JSON.parse(message.data);
        //     } catch (e) {
        //         console.log('This doesn\'t look like a valid JSON: ', message.data);
        //     }
        // };

        var socket = io.connect('http://127.0.0.1:1337', {reconnect: true});
        socket.on('connect', function(socket) {
            console.log('Connected!');
        });
    }


   /* connect() {
        const url = 'ws://' + this.config["host"] + ':' + this.config["port"];
        this.socket = new WebSocket(url);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }*/

    onOpen(event){
        this.sendMessage();
        console.log("OnOpen Event");
    }

    onClose(event) {
        console.log("OnClose Event. Reconnectiong...");
        this.connect();
    }

    onError(event) {
        console.log("OnError Event");
    }

    sendMessage() {
        this.socket.send("s.a");
    }

    onMessage(event) {
        console.log(event.data);
    }

}