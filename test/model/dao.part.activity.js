'use strict';

function testSuite(dao) {
    describe('Activity model unit testing', function(){
        var expect = require('chai').expect;
        var activityData = {
            type: 'login',
            details: {value: 'Some details...'},
            geo: [32.014547, 34.786033]
        };
        var userData = {
            email: 'taitai@gmail.com'
        };
        var user;

        before(function(done){
            dao.user.findOne(userData, onFindDone);

            function onFindDone(error, result){
                if(error || !result){
                    throw error || 'No user found for test!';
                }else{
                    user = result;
                    activityData.user = user._id;
                    done();
                }
            }
        });

        describe('Testing: Extended Create...', function(){

            it('should create a new activity.', function(done){
                dao.activity.extendedCreate(activityData, onCreateDone);

                function onCreateDone(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.user).to.equal(activityData.user);
                    expect(result.type).to.equal(activityData.type);
                    expect(result.details).to.deep.equal(activityData.details);
                    //expect(result.geo).to.eql(activityData.geo);
                    done();
                }
            });
        });
    });
}

module.exports = testSuite;