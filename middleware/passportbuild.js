'use strict';

/**
 * Responsible for creating the passport object with all strategies.
 * @param dao The data access object instance.
 * @returns {exports} Returns the manipulated passport object.
 */
function buildPassport(dao) {
    var passport = require('passport');
    var passportBearer = require('passport-http-bearer');
    var passportGoogle = require('passport-google-oauth').OAuth2Strategy;
    var googleCredObject = JSON.parse(fs.readFileSync('./certificates/googleCredentials.json', 'utf8'));

    // Creating strategy instances.
    var passportBearercStrategy = new passportBearer.Strategy({}, verifyToken);
    var googleStrategy = new passportGoogle.Strategy(googleCredObject, verifyGoogleCredentials);

    // Injecting the strategies to the passport object.
    passport.use(passportBearercStrategy);
    passport.use(googleStrategy);

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        dao.user.findById(id).exec(done);
    });

    /**
     * Bearer (Token) strategy verification function.
     * @param token
     * @param done Callback.
     */
    function verifyToken(token, done) {
        dao.token.findOne({value: token}).populate('user').exec(onPopulateDone);

        function onPopulateDone(error, populatedToken){
            var user = (populatedToken !== null) ? populatedToken.user : false;
            done(error, user);
        }
    }

    function verifyGoogleCredentials(token, tokenSecret, profile, done){
        process.nextTick(function() {
            dao.user.findOne({email: profile.emails[0].value}).exec(onFound);
        });

        function onFound(error, result){
            if(error || result){
                done(error, result);
            }else{
                var data = {
                    email: profile.emails[0].value
                };
                var v_sendBackTokenValue = true;
                dao.user.extendedCreate(data, done, !v_sendBackTokenValue);
            }
        }
    }

    return passport;
}

module.exports = buildPassport;