import express from "express";
import { session, users } from "../Data/index.js";
import { fido2 } from "./register.js";

const router = express.Router();

function JSONTocred(x) {
  if (x?.type === "Buffer") return Buffer.from(x).buffer;
  if (x !== null && typeof x === "object") {
    const obj = {};
    for (let i in x) {
      obj[i] = JSONTocred(x[i]);
    }
    return obj;
  }

  return x;
}

router.post("/", async (req, res) => {
  console.log(req.body);
  const data = req.body;

  const _data = JSONTocred(data);

  if (!session.userHandle) res.sendStatus(501);

  if (data.response.attestationObject != null) {
    // register
    console.log("aaaaaaaaaaaaaaaaaaaaa");
    console.log(data);
    const reg = await fido2.attestationResult(data, {
      challenge: session.challenge,
      origin: "http://localhost:8080",
      factor: "either",
    });
    console.log("bbbbbbbbbbbbbbbbbbbbb");
    if (!reg.authnrData) res.sendStatus(501);
    console.log(reg);

    const user = {
      id: session.userId,
      name: session.userHandle,
      displayName: session.userHandle,
      authenticators: [Object.fromEntries(reg.authnrData)],
    };

    users.set(user.name, user);
    session.loggedIn = true;
    delete session.userId;
    delete session.challenge;

    res.sendStatus(200);
  } else if (_data.response.authenticatorData != null) {
    // login
    const user = users.get(session.userHandle);
    if (!user || !_data.rawId) res.sendStatus(501);

    const auth = user.authenticators.find(
      (x) => x.credId && compareBufferSources(x.credId, _data.rawId)
    );
    if (!auth) res.sendStatus(501);

    // Some devices don't provide a user handle, but required by fido-lib, so we just patch it...
    _data.response.userHandle ||=
      "buffer" in user.id ? user.id.buffer : user.id;

    const reg = await fido2.assertionResult(_data, {
      allowCredentials: getAllowCredentials(user),
      challenge: session.challenge,
      origin: location.origin,
      factor: "either",
      publicKey: auth.credentialPublicKeyPem,
      prevCounter: auth.counter,
      userHandle: user.id,
    });
    if (!reg.authnrData) res.sendStatus(501);
    console.log(reg);

    auth.counter = reg.authnrData.get("counter");

    users.set(session.userHandle, user);
    session.loggedIn = true;

    res.sendStatus(200);
  }
});

export default router;
