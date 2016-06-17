'use strict';

/**
 * Appending routes to application.
 * @param app The application object.
 * @param passport The middleware passport object.
 */
function routes(app, passport) {
    var dao = app.get('dao');

    /// Appending routes that require google Oauth authentication.
    var authController = require('./controller/authcontroller')(dao, passport);    
    app.use('/auth', authController);

    /// Appending API routes that require token authentication.
    var apiController = require('./controller/apicontroller')(dao);
    app.use('/api', passport.authenticate('bearer', {session: false}), apiController);

    /// Appending routes that do not require authentication.
    var openController = require('./controller/opencontroller')(dao);
    app.use('/', openController);
}

module.exports = routes;