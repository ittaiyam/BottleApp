'use strict';

/**
 * Creates the bottle schema, and append the model to the DAO instance.
 * @param dao The data access object instance.
 */
function appendModel(dao) {
    var mongoose = require('mongoose');

    var userSchema = new mongoose.Schema({
        top: {type: mongoose.Schema.ObjectId, ref: 'Message', default: null},
        count: {type: Number, default: 0},
        available: {type: Boolean, default: false},
        holder: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
        origin: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
        createdDate: {type: Date, default: Date.now}
    });

    dao.bottle = mongoose.model('Bottle', userSchema);
}

module.exports = appendModel;