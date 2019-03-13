const express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const bluebird = require('bluebird');
const config = require('../config');
const oauthMiddlewares = require('../oauth/oauthServerMiddlewares');
const database = require('../oauth/database');
database.connect(config.databaseConnection+config.database);
// INITIALSE OAUTH SERVER - create client if not exists
    database.OAuthClient.findOne({clientId: config.clientId, clientSecret:config.clientSecret}).then(function(client) {
        if (client!= null) {
            // OK
        } else {
            let client = new database.OAuthClient({clientId: config.clientId, clientSecret:config.clientSecret});
            client.save().then(function(r) {
            });
        }
    }).catch(function(e) {
        console.log(e);
    });
global.Promise = bluebird;


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.all('/token', oauthMiddlewares.token);
router.all('/authorize', oauthMiddlewares.authorize);

//router.post('/authorize', oauthMiddlewares.authorize);
//router.get('/secure', oauthMiddlewares.authenticate, (req, res) => {
//res.json({ message: 'Secure data' });
//});


router.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});


module.exports = router
//curl  -X POST http://localhost:5000/clients
