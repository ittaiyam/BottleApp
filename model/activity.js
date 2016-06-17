'use strict';

function appendModel(dao){
    var mongoose = require('mongoose');

    var activitySchema = new mongoose.Schema({
        user: {type: mongoose.Schema.ObjectId, ref: 'User'},
        type: {type: String, enum:['login','send','fetch'], required: true},
        details: {type: mongoose.Schema.Types.Mixed},
        created: {type: Date, set: Date.now},
        geo: {type:[Number], index:'2d'}
    });

    activitySchema.statics.extendedCreate = extendedCreate;

    dao.activity = mongoose.model('Activity', activitySchema);

    function extendedCreate(data, done){
        dao.activity.create(data, onCreateDone);

        function onCreateDone(error, activity){
            if(error || !activity){
                dao.logger.log('warn', 'Activity save failure for data ' +JSON.stringify(data)+ ' with error : ' + error);
            }
            done && done(error, activity);
        }
    }
}

module.exports = appendModel;