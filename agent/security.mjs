import crypto from 'crypto'
import Blowfish from './blowfish'

export default class Security {
    constructor(blowfish, security_bytes, handshake) {
        this.flags = (!!blowfish << 1 | !!security_bytes << 2 | !!handshake << 3) || 0x01;

        if (blowfish) {
            this.key = crypto.randomBytes(8);
            this.blowfish = new Blowfish(this.key);
        }

        if(security_bytes) {
            this.seed_count = crypto.randomBytes(1).readUInt8(0);
            this.crc_seed = crypto.randomBytes(1).readUInt8(0);
        }

        if (handshake) {
            this.key2 = crypto.randomBytes(8);
            this.blowfish2 = new Blowfish(this.key2);
            this.x = crypto.randomBytes(4).readUInt32LE(0) & 0x7FFFFFFF;
            this.g = crypto.randomBytes(4).readUInt32LE(0) & 0x7FFFFFFF;
            this.p = crypto.randomBytes(4).readUInt32LE(0) & 0x7FFFFFFF;
            this.a = Security.g_pow_x_mod_p(this.g, this.x, this.p);
        }
    }

    static g_pow_x_mod_p(g, x, p) {
        let result = 1;
        let mult = g;

        if (x === 0) {
            return 1;
        }

        while (x !== 0) {
            if ((x & 1) !== 0) {
                result = (mult * result) % p;
            }

            x = x >> 1;

            mult = (mult * mult) % p;
        }

        return result;
    }

}
