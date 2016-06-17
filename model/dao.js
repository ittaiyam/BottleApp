'use strict';

/**
 * The data access object instance building function.
 * @returns {{}} The DAO instance.
 */
function daoBuild(){
    var mongoose = require('mongoose');
    var winston = require('winston');

    mongoose.connect('mongodb://localhost/' + process.env.MONGO_DB);
    var logger = new winston.Logger();
    logger.add(winston.transports.File, {filename: 'dao.log'})/*.remove(winston.transports.Console)*/;

    var instance = {
        logger: logger,
        getObjectId: getObjectId
    };
    require('./user')(instance);
    require('./token')(instance);
    require('./bottle')(instance);
    require('./message')(instance);
    require('./activity')(instance);

    instance.connection = mongoose.connection;
    instance.connection.on('error', console.error.bind(console, 'connection error:'));
    instance.connection.once('open', console.log.bind(console, 'Connected to mongo database "' + process.env.MONGO_DB+'".'));

    function getObjectId(stringRep){
        return (stringRep == null) ? null : mongoose.Types.ObjectId(stringRep);
    }

    return instance;
}

module.exports = daoBuild();