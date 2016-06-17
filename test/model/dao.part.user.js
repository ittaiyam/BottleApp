'use strict';

function testSuite(dao) {
    describe('User model unit testing', function(){
        var expect = require('chai').expect;
        var userData = {
            email: 'taitai@gmail.com'
        };
        var user;

        describe('Testing: Extended Create...', function(){
            it('should create a new user.', function(done){
                dao.user.extendedCreate(userData, onCreateDone, false);

                function onCreateDone(error, result){
                    expect(!error && result).to.be.ok;
                    result.populate('token', onPopulateDone);
                    user = result;
                }

                function onPopulateDone(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.email).to.equal(userData.email);
                    expect(result.enabled).to.equal(true);
                    expect(result.token).to.be.ok;
                    expect(result.regDate).to.be.ok;

                    dao.bottle.find({_id: {$in: result.bottles}}, onBottlesFound);
                }

                function onBottlesFound(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.length).to.be.equal(user.bottles.length);
                    done();
                }
            });
        });

        describe('Testing: Generate Token...', function(){
            it('should generate a new token.', function(done){
                var oldTokenValue = user.token.value;
                var newTokenValue;
                user.generateToken(onGenerateTokenDone);

                function onGenerateTokenDone(error, result){
                    expect(!error && result).to.be.ok;
                    newTokenValue = result.value;
                    user.populate('token', onPopulateDone);
                }

                function onPopulateDone(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.token.value).to.not.be.equal(oldTokenValue);
                    expect(result.token.value).to.be.equal(newTokenValue);
                    done();
                }
            });
        });
    });
}

module.exports = testSuite;