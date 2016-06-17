'use strict';

process.env.MONGO_DB = 'daoTestDB';
var dao = require('../../model/dao');

before(function (done) {
    dao.connection.once('open', function(){
        dao.connection.db.dropDatabase(done);
    });
});

describe('Data Access Object Unit Testing...', function(){
    require('./dao.part.user.js')(dao);
    require('./dao.part.activity.js')(dao);
});

after(function (done) {
    dao.connection.db.dropDatabase(function(){
        dao.connection.close(done);
    });
});