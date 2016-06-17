'use strict';

/**
 * Creates the user schema, and append the model to the DAO instance.
 * @param dao The data access object instance.
 */
function appendModel(dao) {
    var mongoose = require('mongoose');
    var bcrypt = require('bcrypt');
    var randtoken = require('rand-token');
    var async = require('async');

    var userSchema = new mongoose.Schema({
        email: {type: String, unique: true},
        token: {type: mongoose.Schema.ObjectId, ref: 'Token', default: null},
        regDate: {type: Date, default: Date.now},
        enabled: {type: Boolean, default: true},
        bottles: [{type: mongoose.Schema.ObjectId, ref: 'Bottle'}]
    });

    //userSchema.path('email').validate(validateEmail, 'Bad email.');

    userSchema.statics.extendedCreate = extendedCreate;
    userSchema.methods.generateToken = generateToken;

    dao.user = mongoose.model('User', userSchema);

    function extendedCreate(data, done, sendBackTokenValue) {
        var token = new dao.token();
        token.value = randtoken.generate(32);
        var index;
        var user = new dao.user();
        user.email = data.email;
        user.token = token._id;
        user.bottles = [];
        token.user = user._id;
        var bottles = [];
        for (index = 0; index < 5; index++) {
            var bottle = new dao.bottle();
            bottle.origin = user._id;
            bottle.holder = user._id;
            user.bottles.push(bottle._id);
            bottles.push(bottle);
        }
        user.save(onSaveDone);

        function onSaveDone(error, savedUser) {
            if (error || !savedUser) {
                done(error, savedUser);
            } else {
                async.forEach(bottles, function (bottle, next) {
                    bottle.save(next)
                }, onBottlesInserted)
            }

            function onBottlesInserted(error) {
                if (error) {
                    dao.bottle.collection.remove(savedUser.bottles);
                    savedUser.remove();
                    done(error, null);
                } else {
                    token.save(onTokenSaved);
                }
            }

            function onTokenSaved(error, result) {
                if (error || !savedUser) {
                    done(error, result);
                } else {
                    done(null, sendBackTokenValue ? result.value : savedUser);
                }
            }
        }
    }

    /**
     * Generate a new token value for this user.
     * @param done Callback.
     */
    function generateToken(done) {
        var self = this;
        dao.token.findOneAndUpdate({user: this._id}, {value: randtoken.generate(32)}, {
            upsert: true,
            new: true
        }, onUpdateDone);

        function onUpdateDone(error, generatedToken) {
            if (error || !generatedToken) {
                done(error, generatedToken);
            } else {
                self.token = generatedToken._id;
                self.save(onSaveDone);
            }

            function onSaveDone(error, result) {
                if (error || !result) {
                    done(error, result);
                } else {
                    done(null, generatedToken);
                }
            }
        }
    }
}

module.exports = appendModel;