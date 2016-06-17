'use strict';

/**
 * Creates a router component with all paths that passed username/password authentication.
 * @param dao The data access object instance.
 * @returns {*} The router component.
 */
function authController(dao, passport) {
    var express = require('express');
    var router = express.Router();

    router.get('/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] }));
    router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), onLogin);

    /**
     * Handles login procedure.
     * @param req
     * @param res
     */
    function onLogin(req, res) {
        var user = req.user;
        if (user.token) {
            dao.token.findOne({_id: user.token}).exec(onFindDone);
        } else {
            user.generateToken(onTokenGenerated);
        }

        function onFindDone(error, foundToken) {
            if (error || !foundToken) {
                user.generateToken(onTokenGenerated);
            } else {
                sendResponse(foundToken);
            }
        }

        /**
         * Handles result of token generation action on a user.
         * @param error
         * @param generatedToken
         */
        function onTokenGenerated(error, generatedToken) {
            if (error || !generatedToken) {
                res.status(500).json({msg: 'A token could not be generated/retrieved.'});
            } else {
                sendResponse(generatedToken);
            }
        }

        function sendResponse(token) {
            dao.activity.extendedCreate({
                user: req.user._id,
                type: 'login',
                geo: req.body.geo ? req.body.geo.split(',') : null
            },function(){});
            res.json({access_token: token.value});
        }
    }

    return router;
}

module.exports = authController;