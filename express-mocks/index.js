const OktaJwtVerifier = require('@okta/jwt-verifier');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const { send } = require('process');
const app = express();
app.use(cors());
const port = 3000;

const OKTA_URL = 'https://dev-92274704.okta.com/oauth2/default';
const EXPECTED_AUD = 'api://default';
const oktaJwtVerifier = new OktaJwtVerifier({ issuer: OKTA_URL });

const sendResponseFromFile = (filename, res) => {
    const filePath = `./express-mocks/${filename}`;
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
            res.set('Content-Type', 'application/json');
            res.send(data);
        }
    });
}

const isValidAuthToken = async (req) => {
    return new Promise((resolve, reject) => {
        const headers = req.headers;
        const authHeader = headers && headers.authorization ? headers.authorization : null;
        const jwt = authHeader ? authHeader.split(" ")[1] : null;
        if (jwt) {
            console.log('JWT', jwt)
            oktaJwtVerifier.verifyAccessToken(jwt, EXPECTED_AUD)
                .then(jwt => {
                    console.log(jwt.claims);
                    console.log('JWT IS VALID');
                    resolve(true);
                })
                .catch(err => {
                    console.error('JWT is invalid')
                    resolve(false);
                });
        } else {
            console.error('Missing Authentication Info');
            resolve(false);
        }
    });
}

app.get('/users', async function(req, res) {
    const isValid = await isValidAuthToken(req);
    if (isValid) {
        sendResponseFromFile('users.json', res);
    } else {
        res.status(401);
        res.set('Content-Type', 'application/json');
        res.send({ error: 'Could not authenticate the request' });
    }
});

app.listen(port, () => console.log(`Listening at http://localhost:${port}`))
