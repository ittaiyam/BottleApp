'use strict';

/**
 * Creates a router component with all paths that do not require authentication.
 * @param dao The data access object instance.
 * @returns {*} The router component.
 */
function openController(dao) {
    var express = require('express');
    var router = express.Router();

    router.get('/coffee', onCoffee);

    /**
     * Serves as test and easter egg.
     * @param req
     * @param res
     */
    function onCoffee(req, res) {
        res.status(418).json({msg: 'I\'m a teapot.'});
    }

    return router;
}

module.exports = openController;