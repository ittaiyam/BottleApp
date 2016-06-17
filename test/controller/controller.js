'use strict';

process.env.MONGO_DB = 'controllerTestDB';
var dao = require('../../model/dao');
var instance = require('../../server');
var server = instance.server;
var app = instance.app;

before(function (done) {
    app.get('dao').connection.once('open', function () {
        dao.connection.db.dropDatabase(done);
    });
});

describe('Controller unit testing...', function () {
    require('./controller.part.open')(app);
    require('./controller.part.auth')(app);
    require('./controller.part.api')(app);
});

after(function (done) {
    dao.connection.db.dropDatabase(function () {
        dao.connection.close(function () {
            server.close(done);
        });
    });
});