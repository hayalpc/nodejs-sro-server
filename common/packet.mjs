import Opcode from './opcode'

export default class Packet {
    // 0x2001 - IDENTITY
    static identity(identity) {
        let payloadSize = 2 + identity.length + 1;
        let packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);

        buffer.writeUInt16LE(payloadSize, 0);
        buffer.writeUInt16LE(Opcode.IDENTITY, 2);
        buffer.writeUInt8(0, 4);
        buffer.writeUInt8(0, 5);

        buffer.writeUInt16LE(identity.length, 6);
        buffer.write(identity, 8, 'ascii');
        buffer.writeUInt8(0, 8 + identity.length);

        return buffer;
    }

    // 0x2005 - SEED1
    static seed1() {
        const payload = Buffer.from([0x01, 0x00, 0x01, 0x47, 0x01, 0x05, 0x00, 0x00, 0x00, 0x02]);

        return this.massive(Opcode.SEED1, payload);
    }

    // 0x5000 - HANDSHAKE
    static handshake(security) {
        const blowfish = security.flags & 0x02;
        const security_bytes = security.flags & 0x04;
        const handshake = security.flags & 0x08;

        let index = 0;
        let length = 1 + (blowfish && 8) + (security_bytes && 8) + (handshake && 20);
        let buffer = Buffer.alloc(6 + length);

        index = buffer.writeUInt16LE(length, index);
        index = buffer.writeUInt16LE(Opcode.HANDSHAKE, index);
        index = buffer.writeUInt8(0, index);
        index = buffer.writeUInt8(0, index);

        index = buffer.writeUInt8(security.flags, index);

        if (blowfish) {
            index += security.key.copy(buffer, index);
        }

        if (security_bytes) {
            index = buffer.writeUInt32BE(security.seed_count, index);
            index = buffer.writeUInt32BE(security.crc_seed, index);
        }

        if (handshake) {
            index += security.key2.copy(buffer, index);
            index = buffer.writeUInt32BE(security.g, index);
            index = buffer.writeUInt32BE(security.p, index);
            buffer.writeUInt32BE(security.a, index);
        }

        return buffer;
    }

    // 0x6005 - SEED2
    static seed2() {
        const payload = Buffer.from([0x03, 0x00, 0x02, 0x00, 0x02]);

        return this.massive(Opcode.SEED2, payload);
    }

    // 0xA100 - PATCH_RESP
    static patchResp(data) {
        const payload = Buffer.from(data);

        return this.massive(Opcode.PATCH_RESP, payload);
    }

    // 0xA101 - SERVERLIST_RESP
    static serverList(farms) {
        let payloadSize = 2;

        payloadSize = farms.reduce((size, farm) => size += 4 + farm.name.length, payloadSize);

        farms.forEach((farm) => {
            payloadSize = farm.agents.reduce((size, agent) => size += 11 + agent.name.length, payloadSize);
        });

        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.SERVERLIST_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        farms.forEach((farm) => {
            offset = buffer.writeUInt8(1, offset);
            offset = buffer.writeUInt8(farm.id, offset);
            offset = buffer.writeUInt16LE(farm.name.length, offset);
            offset += buffer.write(farm.name, offset, 'ascii');
        });

        offset = buffer.writeUInt8(0, offset);

        farms.forEach((farm) => {
            farm["agents"].forEach((agent) => {
                offset = buffer.writeUInt8(1, offset);
                offset = buffer.writeUInt16LE(agent.id, offset);
                offset = buffer.writeUInt16LE(agent.name.length, offset);
                offset += buffer.write(agent.name, offset, 'ascii');
                offset = buffer.writeUInt16LE(agent.currentUsers, offset);
                offset = buffer.writeUInt16LE(agent.maxUsers, offset);
                offset = buffer.writeUInt8(agent.state, offset);
                offset = buffer.writeUInt8(farm.id, offset);
            });
        });

        buffer.writeUInt8(0, offset);

        return buffer;
    }

    // 0xA104 - LAUNCHER_RESP
    static launcher(notifications) {
        let payloadSize = notifications.reduce((size, notification) => size += 20 + notification.subject.length + notification.article.length, 1);
        const payload = Buffer.allocUnsafe(payloadSize);
        let offset = 0;

        offset = payload.writeUInt8(notifications.length, offset);

        notifications.forEach((notification) => {
            offset = payload.writeUInt16LE(notification.subject.length, offset);
            offset += payload.write(notification.subject, offset, 'ascii');
            offset = payload.writeUInt16LE(notification.article.length, offset);
            offset += payload.write(notification.article, offset, 'ascii');
            offset = payload.writeUInt16LE(notification.date.getFullYear(), offset);
            offset = payload.writeUInt16LE(notification.date.getMonth(), offset);
            offset = payload.writeUInt16LE(notification.date.getDay(), offset);
            offset = payload.writeUInt16LE(notification.date.getHours(), offset);
            offset = payload.writeUInt16LE(notification.date.getMinutes(), offset);
            offset = payload.writeUInt16LE(notification.date.getSeconds(), offset);
            offset = payload.writeUInt32LE(notification.date.getMilliseconds(), offset);
        });

        return this.massive(Opcode.LAUNCHER_RESP, payload);
    }

    // 0xA102 - LOGIN_RESP
    static login(token, ip, port) {
        const payloadSize = 9 + ip.length;
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.LOGIN_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(1, offset);
        offset = buffer.writeUInt32LE(token, offset);
        offset = buffer.writeUInt16LE(ip.length, offset);
        offset += buffer.write(ip, offset, 'ascii');
        offset = buffer.writeUInt16LE(port, offset);

        return buffer;
    }

    // 0xA102 - LOGIN_RESP
    static connection() {
        const payloadSize = 1;
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.CONNECTION_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(1, offset);

        return buffer;
    }

    static characterEnterWorld(){

    }
    // 0xb007 - CHARACTER_SCREEN_RESP
    static characterScreen(characters) {
        let payloadSize = characters.reduce((size, c) => size += 36 + c.name.length + c.refItems.length * 5 + c.avatarItems.length * 5 +  (c.isDeleting ? 4 : 0) + (c.isGuildRenameRequired ? c.curGuildName.length : 0), 3);
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.CHARACTER_SCREEN_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(2, offset);
        offset = buffer.writeUInt8(1, offset);

        offset = buffer.writeUInt8(characters.length, offset);

        characters.forEach((character) => {
            offset = buffer.writeUInt32LE(character.refObjID, offset);
            offset = buffer.writeUInt16LE(character.name.length, offset);
            offset += buffer.write(character.name, offset, 'ascii');
            offset = buffer.writeUInt8(character.scale, offset);
            offset = buffer.writeUInt8(character.curLevel, offset);
            offset = buffer.writeUInt32LE(character.expOffset.low, offset);
            offset = buffer.writeUInt32LE(character.expOffset.high, offset);
            offset = buffer.writeUInt16LE(character.strength, offset);
            offset = buffer.writeUInt16LE(character.intelligence, offset);
            offset = buffer.writeUInt16LE(character.statPoint, offset);
            offset = buffer.writeUInt32LE(character.curHP, offset);
            offset = buffer.writeUInt32LE(character.curMP, offset);

            offset = buffer.writeUInt8(character.isDeleting, offset);

            if(character.isDeleting) {
                offset = buffer.writeUInt32LE(character.deleteTime, offset);
            }

            offset = buffer.writeUInt8(character.guildMemberClass, offset);
            offset = buffer.writeUInt8(character.isGuildRenameRequired, offset);

            if(character.isGuildRenameRequired) {
                offset = buffer.writeUInt16LE(character.curGuildName.length, offset);
                offset += buffer.write(character.curGuildName, offset, 'ascii');
            }

            offset = buffer.writeUInt8(character.academyMemberClass, offset);

            offset = buffer.writeUInt8(character.refItems.length, offset);
            character.refItems.forEach((ri) => {
                offset = buffer.writeUInt32LE(ri.refItemID, offset);
                offset = buffer.writeUInt8(ri.plus, offset);
            });

            offset = buffer.writeUInt8(character.avatarItems.length, offset);
            character.avatarItems.forEach((ai) => {
                offset = buffer.writeUInt32LE(ai.refItemID, offset);
                offset = buffer.writeUInt8(ai.plus, offset);
            });
        });

        return buffer;
    }

    static loadStart() {
        let packetSize = 6;

        let buffer = Buffer.alloc(packetSize);

        buffer.writeUInt16LE(0, 0);
        buffer.writeUInt16LE(Opcode.CHARACTER_LOAD_START, 2);
        buffer.writeUInt8(0, 4);
        buffer.writeUInt8(0, 5);

        return buffer;
    }

    static loadEnd() {
        let packetSize = 6;

        let buffer = Buffer.alloc(packetSize);

        buffer.writeUInt16LE(0, 0);
        buffer.writeUInt16LE(Opcode.CHARACTER_LOAD_END, 2);
        buffer.writeUInt8(0, 4);
        buffer.writeUInt8(0, 5);

        return buffer;
    }

    static loadData() {
        let payload = Buffer.from([0xd3, 0xb4, 0xe8, 0x09, 0x73, 0x07, 0x00, 0x00, 0x22, 0x6e, 0x6e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x5e, 0xdb, 0x2f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc7, 0x07, 0x00, 0x00, 0xc7, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00, 0x84, 0x11, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x11, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0xcc, 0x11, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x38, 0x12, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x14, 0x12, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x5c, 0x12, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0xb0, 0x0f, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x47, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x64, 0x10, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x35, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x94, 0x16, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x00, 0xb8, 0x16, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x70, 0x16, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x70, 0x16, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x43, 0x1d, 0x00, 0x00, 0x01, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x18, 0x17, 0x00, 0x00, 0xe8, 0x03, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x19, 0x17, 0x00, 0x00, 0xe8, 0x03, 0x10, 0x00, 0x00, 0x00, 0x00, 0xe9, 0x72, 0x00, 0x00, 0xe2, 0x03, 0x11, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x5e, 0x00, 0x00, 0x05, 0x00, 0x12, 0x00, 0x00, 0x00, 0x00, 0xd3, 0x0e, 0x00, 0x00, 0x28, 0x00, 0x13, 0x00, 0x00, 0x00, 0x00, 0xb9, 0x0e, 0x00, 0x00, 0x1c, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0xaa, 0x8f, 0x00, 0x00, 0x05, 0x00, 0x15, 0x00, 0x00, 0x00, 0x00, 0x7f, 0x5f, 0x00, 0x00, 0x05, 0x00, 0x16, 0x00, 0x00, 0x00, 0x00, 0x55, 0x5f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x17, 0x00, 0x00, 0x00, 0x00, 0x56, 0x5f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x3b, 0x00, 0x00, 0x00, 0x01, 0x00, 0x1b, 0x00, 0x00, 0x00, 0x00, 0xed, 0x1a, 0x00, 0x00, 0x32, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x35, 0x24, 0x00, 0x00, 0x01, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x00, 0x34, 0x24, 0x00, 0x00, 0x01, 0x00, 0x1f, 0x00, 0x00, 0x00, 0x00, 0x35, 0x24, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x34, 0x24, 0x00, 0x00, 0x01, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x22, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x23, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x24, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x25, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x26, 0x00, 0x00, 0x00, 0x00, 0x23, 0x5b, 0x00, 0x00, 0x01, 0x27, 0x00, 0x00, 0x00, 0x00, 0x35, 0x24, 0x00, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x5c, 0x60, 0x00, 0x00, 0x05, 0x00, 0x05, 0x00, 0x00, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01, 0x02, 0x01, 0x00, 0x00, 0x00, 0x01, 0x03, 0x01, 0x00, 0x00, 0x00, 0x01, 0x11, 0x01, 0x00, 0x00, 0x00, 0x01, 0x12, 0x01, 0x00, 0x00, 0x00, 0x01, 0x13, 0x01, 0x00, 0x00, 0x00, 0x01, 0x14, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x02, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01, 0x8d, 0x01, 0x00, 0x00, 0x10, 0x00, 0x18, 0x08, 0x01, 0x01, 0x01, 0x16, 0x00, 0x53, 0x4e, 0x5f, 0x43, 0x4f, 0x4e, 0x5f, 0x51, 0x45, 0x56, 0x5f, 0x41, 0x4c, 0x4c, 0x5f, 0x42, 0x41, 0x53, 0x49, 0x43, 0x5f, 0x30, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0xbf, 0x01, 0x00, 0x6c, 0x6a, 0xd2, 0x34, 0x03, 0x44, 0x00, 0x00, 0x34, 0x43, 0xb6, 0xfd, 0x9e, 0x44, 0x22, 0xcd, 0x00, 0x01, 0x00, 0x22, 0xcd, 0x00, 0x00, 0x00, 0x00, 0xcd, 0xcc, 0x8c, 0x41, 0x00, 0x00, 0x5c, 0x42, 0x00, 0x00, 0xc8, 0x42, 0x00, 0x08, 0x00, 0x45, 0x76, 0x65, 0x6e, 0x74, 0x42, 0x6f, 0x74, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x57, 0x00, 0xe0, 0x05, 0x00, 0x00, 0x00, 0x00, 0xc1, 0x00, 0x00, 0x00, 0x01, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
        let payloadSize = payload.length;
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.CHARACTER_LOAD_DATA, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        payload.copy(buffer, offset);

        return buffer;
    }

    // 0xb001 - CHARACTER_SCREEN_RESP
    static characterSelect() {
        let payloadSize = 1;
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.CHARACTER_SELECT_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(1, offset);

        return buffer;
    }

    static movement(){
        let payloadSize = 1;
        const packetSize = 6 + payloadSize;

        let buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(payloadSize, offset);
        offset = buffer.writeUInt16LE(Opcode.GAMEOBJECT_MOVEMENT_RESP, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(1, offset);

        return buffer;
    }

    static massive(opcode, payload) {
        const payloadSize = payload.length;
        const packetSize = 18 + payloadSize;

        const buffer = Buffer.alloc(packetSize);
        let offset = 0;

        offset = buffer.writeUInt16LE(5, offset);
        offset = buffer.writeUInt16LE(0x600D, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(1, offset);
        offset = buffer.writeUInt16LE(1, offset);
        offset = buffer.writeUInt16LE(opcode, offset);

        offset = buffer.writeUInt16LE(payloadSize + 1, offset);
        offset = buffer.writeUInt16LE(0x600D, offset);
        offset = buffer.writeUInt8(0, offset);
        offset = buffer.writeUInt8(0, offset);

        offset = buffer.writeUInt8(0, offset);
        payload.copy(buffer, offset);

        return buffer;
    }

    static parse(security, data) {
        let offset = 0;

        function readByte() {
            return data.readUInt8(offset++);
        }

        function readUShort() {
            offset += 2;

            return data.readUInt16LE(offset - 2);
        }

        function readUInt() {
            offset += 4;

            return data.readUInt32LE(offset - 4);
        }

        function readString() {
            const length = readUShort();
            const string = data.toString('ascii', offset, offset + length);

            offset += length;

            return string;
        }

        function getBuffer(length) {
            const buffer = data.slice(offset, offset + length);
            offset += length;

            return buffer;
        }

        let payloadSize = readUShort();
        let encrypted = payloadSize & 0x8000;
        let packetSize = 6 + payloadSize & 0x7fff;

        if (data.length !== packetSize) {
            // todo daha açıklayıcı bir mesaj
            throw "Invalid length";
        }

        if (encrypted) {
            // todo security.blowfish false ise, security.flags dogru değilse
            data = security.blowfish.decrypt(data.slice(2));
            offset = 0;
        }

        let opcode = readUShort();
        let count = readByte();
        let crc = readByte();

        if (opcode === Opcode.IDENTITY) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                identity: readString()
            };
        } else if (opcode === Opcode.PING) {
            return {
                opcode: opcode,
                count: count,
                crc: crc
            };
        } else if (opcode === Opcode.HANDSHAKE) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                B: getBuffer(4),
                clientKey: getBuffer(8)
            };
        } else if (opcode === Opcode.PATCH_REQ) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                locale: readByte(),
                identity: readString(),
                version: readUInt()
            };
        } else if (opcode === Opcode.LOGIN_REQ) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                locale: readByte(),
                id: readString(),
                password: readString(),
                server: readUShort()
            };
        } else if ([Opcode.HANDSHAKE_ACCEPT, Opcode.LAUNCHER_REQ, Opcode.PING, Opcode.SERVERLIST_REQ].includes(opcode)) {
            return {
                opcode: opcode,
                count: count,
                crc: crc
            };
        } else if ([0x1420, 0x6106].includes(opcode)) {
            return null;
        } else if (opcode === Opcode.CONNECTION_REQ) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                session: readUInt(),
                id: readString(),
                password: readString()
            };
        } else if (opcode === Opcode.CHARACTER_SCREEN_REQ) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                action: readByte()
            };
        } else if (opcode === Opcode.CHARACTER_SELECT_REQ) {
            return {
                opcode: opcode,
                count: count,
                crc: crc,
                dummy: readByte() // todo
            };
        } else {
            throw "Unknown opcode: 0x" + opcode.toString(16);
        }
    }
}
