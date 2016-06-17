'use strict';

/**
 * Creates the token schema, and append the model to the DAO instance.
 * @param dao The data access object instance.
 */
function appendModel(dao) {
    var mongoose = require('mongoose');

    var tokenSchema = new mongoose.Schema({
        value: {type: String, unique: true},
        user: {type: mongoose.Schema.Types.ObjectId, unique: true,  ref: 'User'}/*,
        expiresAt: {type: Date, expires: 60*60*24*356, default: Date.now}*/
    });

    dao.token =  mongoose.model('Token',tokenSchema);
}

module.exports = appendModel;