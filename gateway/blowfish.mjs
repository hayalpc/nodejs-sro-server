import crypto from 'crypto'

export default class Blowfish {
    constructor(key) {
        this.cipher = crypto.createCipheriv('bf-ecb', key, null);
        this.decipher = crypto.createDecipheriv('bf-ecb', key, null);

        this.cipher.setAutoPadding(false);
        this.decipher.setAutoPadding(false);
    }

    encrypt(buffer) {
        return Buffer.concat([this.cipher.update(Blowfish.pad(buffer)),this.cipher.final()]);
    }

    decrypt(buffer) {
        return Buffer.concat([this.decipher.update(buffer) , this.decipher.final()]);
    }

    static pad(buffer) {
        let length = buffer.length;

        if(length % 8) {
            return Buffer.concat([buffer], length + 8 - length % 8);
        } else {
            return buffer;
        }
    }
}