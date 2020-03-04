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
        socket.gs
    }

    handshake() {
        const packet = Packet.handshake(this.security);
        this.send(packet);

        this.state = STATE_HANDSHAKE_SEND;
    }

    dataHandler(message) {
        if (this.remaining) {
            message = Buffer.concat([this.remaining, message]);

            this.remaining = null;
        }

        let offset = 0;

        while (offset < message.length) {
            const length = 6 + (message.readUInt32LE(offset) & 0x7fff);
            const packetData = message.slice(offset, offset + length);

            console.debug("Recieved: 0x" + packetData.readUInt32LE(2).toString(16) + " " + Client.arrayToHexString(packetData));

            try {
                const packet = Packet.parse(this.security, packetData);

                if (packet) {
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
            this.send(Packet.identity("AgentServer"));
        } else if (packet.opcode === Opcode.PING) {
            // todo do nothing
        } else if (packet.opcode === Opcode.HANDSHAKE) {
            console.log(packet);
        } else if (packet.opcode === Opcode.PATCH_REQ) {
            this.send(Packet.seed1());
            this.send(Packet.seed2([]));
            this.send(Packet.patchResp([0x01]));
        } else if (packet.opcode === Opcode.SERVERLIST_REQ) {
            this.send(Packet.serverList(config["farms"]));
        } else if (packet.opcode === Opcode.LAUNCHER_REQ) {
            this.send(Packet.launcher([{subject: "foo", article: "bar", date: new Date()}]));
        } else if (packet.opcode === Opcode.HANDSHAKE_ACCEPT) {
            // todo do nothing
        } else if (packet.opcode === Opcode.LOGIN_REQ) {
            this.send(Packet.login(0x12345678, "127.0.0.1", 15884));
        } else if (packet.opcode === Opcode.CHARACTER_ENTERWORLD) {
            this.send(Packet.characterEnterWorld());
        } else if (packet.opcode === Opcode.CONNECTION_REQ) {
            this.send(Packet.connection());
        } else if (packet.opcode === Opcode.CHARACTER_SCREEN_REQ) {
            if (packet.action === 2) {

                this.send(Packet.characterScreen([{
                    id: 1,
                    refObjID: 0x773,
                    name: "EventBot",
                    scale: 0x22,
                    curLevel: 0x6e,
                    expOffset: {high: 0, low: 0},
                    strength: 0x17,
                    intelligence: 0x17,
                    statPoint: 0x9,
                    curHP: 0x7c7,
                    curMP: 0x7c7,
                    isDeleting: 0,
                    deleteTime: 0,
                    guildMemberClass: 0,
                    isGuildRenameRequired: 0,
                    curGuildName: null,
                    academyMemberClass: 0,
                    refItems: [
                        {refItemID: 0x1184, plus: 7},
                        {refItemID: 0x11f0, plus: 7},
                        {refItemID: 0x11cc, plus: 7},
                        {refItemID: 0x1238, plus: 7},
                        {refItemID: 0x1214, plus: 7},
                        {refItemID: 0x125c, plus: 7},
                        {refItemID: 0xfb0, plus: 7},
                        {refItemID: 0x1064, plus: 7},
                    ],
                    avatarItems: []
                }]));
            }
        } else if (packet.opcode === Opcode.CHARACTER_SELECT_REQ) {
            //TODO: which user selected

            this.send(Packet.characterSelect());
            this.send(Packet.loadStart());
            this.send(Packet.loadData());
            this.send(Packet.loadEnd());
        } else if (packet.opcode === Opcode.GAMEOBJECT_MOVEMENT_REQ) {

            this.send(Packet.movement())

        }
    }

    send(packet) {
        console.debug("Sending: 0x" + packet.readUInt32LE(2).toString(16) + " " + Client.arrayToHexString(packet));
        if(packet !== undefined) {
            this.socket.write(packet);
        }else{
            console.debug("Packet is wrong");
        }
    }

    static arrayToHexString(data) {
        return "[" + [...data].map((v) => v < 16 ? ("0" + v.toString(16)) : (v.toString(16))).join(",") + "]";
    }
}
