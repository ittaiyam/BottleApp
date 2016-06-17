'use strict';

/**
 * Creates a router component with all API related paths (that passed token authentication).
 * @param dao The data access object instance.
 * @returns {*} The router component.
 */
function apiController(dao) {
    var express = require('express');
    var async = require('async');
    var router = express.Router();

    router.get('/profile', onGetProfile);               /// Handles request for ones own profile details.
    //router.post('/profile', onUpdateProfile);           /// Handles request for updating ones own  profile details.

    router.get('/bottle', onGetBottle);                 /// Handles request for assignment of a free bottle.
    router.post('/bottle', onSendBottle);               /// Handles request for sending off a held bottle.

    router.get('/message/:id', onGetMessage);           /// Handles request for viewing a specific message.

    /**
     * Handles request for ones own profile details.
     * Will populate the user bottles field and send the populated user document in response.
     * @param req
     * @param res
     */
    function onGetProfile(req, res) {
        req.user.populate('bottles', onPopulateDone);

        function onPopulateDone(error, populatedUser) {
            if (error || !populatedUser) {
                dao.logger.log('error', 'User profile retrieval failure : ' + error);
                res.status(500).json({msg: 'Profile retrieval failed.'});
            } else {
                var user = populatedUser.toObject();
                delete user.token;
                res.json(user);
            }
        }
    }

    /**
     * Handles request for assignment of a free bottle.
     * Will look for the first bottle that is available and also was not just held by the user.
     * If found, will send the bottle document in response.
     * @param req
     * @param res
     */
    function onGetBottle(req, res) {
        if (req.user.bottles.length >= 5) {
            res.status(403).json({msg: 'Resource request denied.'});
        } else {
            var _userId = req.user._id;
            dao.bottle.findOneAndUpdate({available: true, holder: {$ne: _userId}}, {
                available: false,
                holder: _userId
            }, {new: true}).exec(onUpdateDone);
        }

        function onUpdateDone(error, updatedBottle) {
            if (error || !updatedBottle) {
                res.status(503).json({msg: 'No bottles available at this moment.'});
            } else {
                var _bottleId = dao.getObjectId(updatedBottle._id);
                req.user.update({$push: {bottles: _bottleId}}, onUserUpdateDone);
            }

            function onUserUpdateDone(error, affected) {
                if (error || !affected) {
                    dao.logger.log('error', 'User save failure : ' + error);
                    res.status(500).json({msg: 'User save failure.'});
                } else {
                    dao.activity.extendedCreate({
                        user: req.user._id,
                        type: 'fetch',
                        details: {bottleId: updatedBottle._id},
                        geo: req.body.geo ? req.body.geo.split(',') : null
                    });
                    res.json(updatedBottle);
                }
            }
        }
    }

    /**
     * Handles request for sending off a held bottle.
     * Will check if request contains content of a new message.
     * If so, will create and set the new message as bottle top, and link the new and previous messages together.
     * Finally, will set the bottle as available and pull it off the user bottles.
     * If all goes well, will send "Ok." in response.
     * @param req
     * @param res
     */
    function onSendBottle(req, res) {
        if (!req.body.bottle) {
            res.status(400).json({msg: 'Request missing parameters.'});
        } else {
            dao.bottle.findById(req.body.bottle).populate('top').populate('holder').exec(onFindBottleDone);
        }

        function onFindBottleDone(error, foundBottle) {
            if (error || !foundBottle) {
                res.status(404).json({msg: 'Specified resource not found.'});
            } else if (!foundBottle.holder || foundBottle.holder._id.toString() !== req.user._id.toString() || foundBottle.available) {
                res.status(403).json({msg: 'Unauthorized bottle sending.'});
            } else {
                var saves = [];
                var newMessage = null;
                var oldMessage = foundBottle.top;
                var holder = foundBottle.holder;
                var updates = {
                    available: true
                };

                holder.bottles.remove(foundBottle._id);
                saves.push(holder);
                if (req.body.content) {
                    newMessage = new dao.message();
                    newMessage.composer = req.user._id;
                    newMessage.bottle = foundBottle._id;
                    newMessage.content = req.body.content;
                    newMessage.prev = foundBottle.top ? foundBottle.top._id : null;
                    saves.push(newMessage);

                    updates.top = newMessage._id;
                    updates.count = foundBottle.count + 1;
                    if (oldMessage) {
                        oldMessage.next = newMessage._id;
                        saves.push(oldMessage);
                    }
                }
                async.forEach(saves, function (doc, next) {
                    doc.save(next);
                }, onAllSavesDone);
            }

            function onAllSavesDone(error) {
                if (error) {
                    res.status(500).json({msg: 'user/messages saving failed.'});
                } else {
                    foundBottle.update(updates, {new: true}).exec(onBottleUpdateDone);
                }
            }

            function onBottleUpdateDone(error, result) {
                if (error || !result) {
                    res.status(500).json({msg: 'Bottle update failed.'});
                } else {
                    res.json({msg: "Ok."});
                }
            }
        }
    }

    /**
     * Handles request for viewing a specific message.
     * Will verify user authorization for viewing requested message.
     * If authorized, will send the message document in response.
     * @param req
     * @param res
     */
    function onGetMessage(req, res) {
        dao.message.findById(req.params.id).exec(onFindDone);

        function onFindDone(error, foundMessage) {
            if (error || !foundMessage) {
                res.status(404).json({msg: 'Requested resource not found.'});
            } else {
                if (req.user.bottles.indexOf(foundMessage.bottle) === -1) {
                    res.status(400).json({msg: 'Resource request denied.'});
                } else {
                    res.json(foundMessage);
                }
            }
        }
    }

    function onUnImplemented(req, res) {
        res.status(500).json("Under construction.");
    }

    return router;
}

module.exports = apiController;
