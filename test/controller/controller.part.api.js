'use strict';

function testSuite(app) {
    describe('API Controller Unit Testing...', function () {
        var expect = require('chai').expect;
        var request = require('supertest');
        var dao = app.get('dao');
        var user_1;
        var user_2;

        before(function(done){
            dao.user.extendedCreate({email: 'mac.allan@gmail.com'}, onCreateDone);

            function onCreateDone(error, result){
                if(error || !result){
                    throw error || 'No result';
                }else{
                    result.populate('token', onPopulateDone);
                }
            }

            function onPopulateDone(error, result){
                if(error || !result){
                    throw error || 'No result';
                }else{
                    user_1 = result;
                    done();
                }
            }
        });

        before(function(done){
            dao.user.extendedCreate({email: 'tali.sker@gmail.com'}, onCreateDone);

            function onCreateDone(error, result){
                if(error || !result){
                    throw error || 'No result';
                }else{
                    result.populate('token', onPopulateDone);
                }
            }

            function onPopulateDone(error, result){
                if(error || !result){
                    throw error || 'No result';
                }else{
                    user_2 = result;
                    done();
                }
            }
        });

        describe('Testing GET /profile', function () {
            it('user_1 should fetch its own profile.', function (done) {
                request(app)
                    .get('/api/profile')
                    .set('Accept', 'application/json')
                    .send({access_token: user_1.token.value})
                    .expect(200)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.email).to.be.equal(user_1.email);
                        expect(result.body.enabled).to.be.equal(user_1.enabled);
                        expect(new Date(result.body.regDate).getTime()).to.be.equal(user_1.regDate.getTime());
                        expect(result.body.bottles).to.have.length.of(5);
                        result.body.bottles.forEach(function(bottle){
                            expect(bottle.origin).to.be.equal(user_1._id.toString());
                            expect(bottle.holder).to.be.equal(user_1._id.toString());
                            expect(bottle.available).to.be.equal(false);
                            expect(bottle.count).to.be.equal(0);
                        });
                        done();
                    });
            });
        });

        describe('Testing POST /bottle', function () {
            var postData = {};

            it('user_1 should send away a bottle.', function (done) {
                postData.access_token = user_1.token.value;
                postData.bottle = user_1.bottles[2];

                request(app)
                    .post('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(postData)
                    .expect(200)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Ok.");
                        done();
                    });
            });

            it('user_1 should have one bottle less.', function(done){
                dao.user.findById(user_1._id, onUserFound);

                function onUserFound(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.bottles)
                        .to.have.length.of(4)
                        .and.not.to.include(postData.bottle);
                    done();
                }
            });
            
            it('user_1\'s old bottle should have been made available.', function(done){
                dao.bottle.findById(postData.bottle, onBottleFound);

                function onBottleFound(error, result){
                    expect(!error && result).to.be.ok;
                    expect(result.available).to.be.ok;
                    expect(result.holder.toString()).to.be.equal(user_1._id.toString());
                    expect(result.origin.toString()).to.be.equal(user_1._id.toString());
                    expect(result.count).to.be.equal(0);
                    done();
                }
            });

            it('user_1 should not send away the same bottle.', function(done){

                request(app)
                    .post('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(postData)
                    .expect(403)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Unauthorized bottle sending.");
                        done();
                    });
            });

            it('user_1 should not send away a bottle. (Spoofed-up bottle ID)', function(done){
                postData.bottle = "wubba0lubba0dub0dub";

                request(app)
                    .post('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(postData)
                    .expect(404)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Specified resource not found.");
                        done();
                    });
            });

            it('user_1 should not send away a bottle. (Missing parameters)', function(done){
                delete postData.bottle;

                request(app)
                    .post('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(postData)
                    .expect(400)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Request missing parameters.");
                        done();
                    });
            });
        });

        describe('Testing GET /bottle', function () {
            var getData;

            it('user_1 should not get a bottle. (Availability)', function(done){
                getData = {};
                getData.access_token = user_1.token.value;

                request(app)
                    .get('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(getData)
                    .expect(503)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("No bottles available at this moment.");
                        done();
                    });
            });

            it('user_2 should not get a bottle. (Full quota)', function(done){
                getData = {};
                getData.access_token = user_2.token.value;

                request(app)
                    .get('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(getData)
                    .expect(403)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Resource request denied.");
                        done();
                    });
            });

            it('user_2 should get a bottle. (After removing one bottle)', function(done){
                user_2.bottles.pop();
                user_2.save(onSaveDone);

                function onSaveDone(error, result){
                    expect(!error && result).to.be.ok;

                    request(app)
                        .get('/api/bottle')
                        .set('Accept', 'application/json')
                        .send(getData)
                        .expect(200)
                        .end(function (error, result) {
                            expect(!error && result).to.be.ok;
                            expect(result.available).not.to.be.ok;
                            expect(result.body.holder).to.be.equal(user_2._id.toString());
                            expect(result.body.origin).to.be.equal(user_1._id.toString());
                            done();
                        });

                }
            });
        });

        describe('Testing POST /bottle (with content)', function () {
            var postData;

            it('user_2 should send away a bottle with content.', function(done){
                postData = {};
                postData.access_token = user_2.token.value;
                postData.bottle = user_2.bottles[2];
                postData.content = "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal."

                request(app)
                    .post('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(postData)
                    .expect(200)
                    .end(function(error, result){
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal("Ok.");
                        done();
                    });
            });
        });

        describe('Testing GET /message/:id', function () {
            var getData;

            before(function(done){
                getData = {};
                getData.access_token = user_1.token.value;

                request(app)
                    .get('/api/bottle')
                    .set('Accept', 'application/json')
                    .send(getData)
                    .expect(200)
                    .end(function(error, result){
                        if(error || !result){
                            throw error || 'No result';
                        }else{
                            done();
                        }
                    });
            });

            before(function(done){
                dao.user.findById(user_1._id).populate(['bottles','token']).exec(onPopulateDone);

                function onPopulateDone(error, result){
                    if(error || !result){
                        throw error || 'No result';
                    }else{
                        user_1 = result;
                        done();
                    }
                }
            });

            it('user_1 should fetch the top message of a received bottle.', function(done){
                var expectedContent = "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.";
                expect(user_1.bottles[4].top).to.be.ok;
                getData = {};
                getData.access_token = user_1.token.value;
                request(app)
                    .get('/api/message/' + user_1.bottles[4].top.toString())
                    .set('Accept', 'application/json')
                    .send(getData)
                    .expect(200)
                    .end(function(error, result){
                        expect(!error && result).to.be.ok;
                        expect(result.body.content).to.be.equal(expectedContent);
                        expect(result.body.composer).to.be.equal(user_2._id.toString());
                        done()
                    });
            });
        });
    });
}

module.exports = testSuite;