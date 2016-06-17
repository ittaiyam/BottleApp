'use strict';

/**
 * Prepares and starts the application server.
 * @returns {}
 */
function start() {
    process.env.MONGO_DB = process.env.MONGO_DB || 'bottledb';

    var app = require('express')();
    var http = require('http'); //var https = require('https');
    //var fs = require('fs');
    var bodyParser = require('body-parser');
    var multer = require("multer");
    var dao = require('./model/dao');
    var passport = require('./middleware/passportbuild')(dao);

    app.use(handleAccess);                              // Handles HTTP access control.
    app.use(bodyParser.json());                         // For parsing application/json
    app.use(bodyParser.urlencoded({extended: true}));   // For parsing application/x-www-form-urlencoded
    app.use(passport.initialize());                     // Required in express-based applications to initialize Passport.
    app.set('dao', dao);                                // Loads the dao object into the app object.

    require('./routes')(app, passport);                 // Loads the routes into the app object. (requires passport)

    /**
     * These are the HTTPS options.
     * @type {{key: *, cert: *}}
     */
    /*var options = {
     key: fs.readFileSync('../certs/server.key'),
     cert: fs.readFileSync('../certs/server.crt')
     };*/

    // Creating and starting server
    var server = http.createServer(app); // var server = https.createServer(options, app);
    server.listen(8080);

    return {
        server: server,
        app: app
    };

    /**
     * Handle HTTP access control (CORS).
     * @param req
     * @param res
     * @param next
     */
    function handleAccess(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if ('OPTIONS' == req.method) {
            res.status(200).json({msg: 'Ok.'});
        } else {
            next();
        }
    }

}

module.exports = start();