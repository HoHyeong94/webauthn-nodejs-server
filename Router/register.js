import express from 'express';
import { Fido2Lib } from "fido2-lib";
// import { nanoid } from 'nanoid';
import { session } from '../Data/index.js';
// import { encode } from 'cbor-x';
import { WebUUID } from 'web-uuid';

const router = express.Router();

export const fido2 = new Fido2Lib({
    rpId: "http://localhost:8080",
    rpName: "WebAuthn Demo",
    authenticatorUserVerification: 'preferred', // setting a value prevents warning in chrome
})

router.post('/', (req, res, next) => {
    session.loggedIn = false;
    next();
}, async (req, res) => {
    console.log(req.body);

    const options = await fido2.attestationOptions()

    options.user = {
        id: new WebUUID(),
        name: req.body.name,
        displayName: req.body.name,
    };
    session.userId = options.user.id
    session.userHandle = options.user.name
    session.challenge = options.challenge

    console.log(options)
    options.challenge = Buffer.from(options.challenge).toJSON();
    options.user.id = Buffer.from(options.user.id).toJSON();
    options.rp.id = "localhost"

    // delete options["rp"];

    res.status(200).json(options);
    // res.send(JSON.stringify(encode(options)));
});

router.get('/', async (req, res) => {
    
});

export default router;