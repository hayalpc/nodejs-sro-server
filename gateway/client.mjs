import Packet from '../common/packet'
import Opcode from '../common/opcode'
import Security from './security'

const STATE_CONNECTED = 0;
const STATE_HANDSHAKE_SEND = 1;

export default class Client {
    constructor(socket) {
        this.socket = socket;
        this.host = socket.remoteAddress;
        this.user = null;

        this.remaining = null;
        //this.security = new Security(true, true, true);
        this.security = new Security(false, false, false);
        this.state = STATE_CONNECTED;

        this.socket.on('data', this.dataHandler.bind(this));
        this.socket.on('error', Client.errorHandler);
        this.socket.on('close', Client.closeHandler);
        this.remaining = null;
    }

    handshake() {
        const packet = Packet.handshake(this.security);
        this.send(packet);

        this.state = STATE_HANDSHAKE_SEND;
    }

    dataHandler(message) {
        message.toString("utf8");
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
    }

    static closeHandler() {
    }

    static errorHandler(err) {
    }

    dispatch(packet) {
        if (packet.opcode === Opcode.IDENTITY) {
            this.send(Packet.identity("GatewayServer"));
        } else if (packet.opcode === Opcode.PING) {
            // todo do nothing
        } else if (packet.opcode === Opcode.HANDSHAKE) {
        } else if (packet.opcode === Opcode.PATCH_REQ) {
            this.send(Packet.seed1());
            this.send(Packet.seed2([]));
            this.send(Packet.patchResp([0x01]));
        } else if (packet.opcode === Opcode.SERVERLIST_REQ) {
            //"SRO_EicGame_Turkey [F]", [{id: 1, name: "Mira", currentUsers: 10, maxUsers: 100, state: 1}]
            this.send(Packet.serverList(config["farms"]));
        } else if (packet.opcode === Opcode.LAUNCHER_REQ) {
            this.send(Packet.launcher([{subject: "foo", article: "bar", date: new Date()}]));
        } else if (packet.opcode === Opcode.HANDSHAKE_ACCEPT) {
            // todo do nothing
        } else if (packet.opcode === Opcode.LOGIN_REQ) {
            this.send(Packet.login(0x12345678, "127.0.0.1", 15884));
        }
    }

    send(packet) {
        console.debug("Sending: ", packet);

        this.socket.write(packet);
    }
}
