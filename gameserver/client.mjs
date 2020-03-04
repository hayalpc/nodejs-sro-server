import Packet from '../common/packet'
import Opcode from '../common/opcode'
// import Lib from 'lib'

const STATE_CONNECTED = 0;
const STATE_HANDSHAKE_SEND = 1;

export default class Client {
    constructor(socket) {
        this.socket = socket;
        this.host = socket.remoteAddress;
        this.user = null;

        this.remaining = null;
        //this.security = new Security(true, true, true);
        this.state = STATE_CONNECTED;
        this.socket.on('message', function(message) {
            console.log(message);
        });
        this.socket.on("data",this.dataHandler.bind(this));
        this.socket.on('error', Client.errorHandler);
        this.socket.on('close', Client.closeHandler);
        this.remaining = null;
    }

    handshake() {
        // this.send("s.a");
        // this.send(Buffer.from("s.a"));
        // const packet = Lib.connection();
        // this.send(packet);

        // this.state = STATE_HANDSHAKE_SEND;
    }

    bufferFromBufferString(bufferStr) {
        return Buffer.from(
            bufferStr
                .split(' ') // create an array splitting it by space
                .slice(1) // remove Buffer word from an array
                .reduce((acc, val) =>
                    acc.concat(parseInt(val, 16)), [])  // convert all strings of numbers to hex numbers
        )
    }


    dataHandler(message) {
        console.log(message);

        // let offset = 0;
        // console.log(message.toString('ascii', offset, message.length));
        // while (offset < message.length) {
        //     const length = 6 + (message.readUInt32LE(offset) & 0x7fff);
        //     const packetData = message.slice(offset, offset + length);
        //
        //
        //     console.debug("Recieved: ", packetData);
        //     offset += length;
        // }
        return;
        /*
        if (this.remaining) {
            message = Buffer.concat([this.remaining, message]);

            this.remaining = null;
        }

        let offset = 0;

        while (offset < message.length) {
            const length = 6 + (message.readUInt32LE(offset) & 0x7fff);
            const packetData = message.slice(offset, offset + length);

            console.debug("Recieved: ", packetData);

            try {
                const packet = Packet.parse(this.security, packetData);

                if(packet) {
                    this.dispatch(packet);
                }
            } catch (e) {
                console.error(e)
            }

            offset += length;
        }

        this.remaining = message.slice(offset);
        */
    }

    static closeHandler() {
    }

    static errorHandler(err) {
    }

    dispatch(packet) {

    }

    send(packet) {
        console.debug("Sending: ", packet);

        this.socket.write(packet);
    }
}
