'use strict';

/**
 * Creates the message schema, and append the model to the DAO instance.
 * @param dao The data access object instance.
 */
function appendModel(dao) {
    var mongoose = require('mongoose');

    var userSchema = new mongoose.Schema({
        composer: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
        bottle: {type: mongoose.Schema.ObjectId, ref: 'Bottle', required: true},
        content: {type: String, required: true},
        createdDate: {type: Date, default: Date.now},
        prev: {type: mongoose.Schema.ObjectId, ref: 'Message', default: null},
        next: {type: mongoose.Schema.ObjectId, ref: 'Message', default: null}
    });

    dao.message = mongoose.model('Message', userSchema);
}

module.exports = appendModel;