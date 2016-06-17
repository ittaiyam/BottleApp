'use strict';

function testSuite(app) {
    describe('Open Controller Unit Testing...', function () {
        var expect = require('chai').expect;
        var request = require('supertest');
        describe('Testing GET /coffee', function () {
            it('should get a tea pot.', function (done) {
                request(app)
                    .get('/coffee')
                    .set('Accept', 'application/json')
                    .expect(418)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.body.msg).to.be.equal('I\'m a teapot.');
                        done();
                    });
            });
        });
    });
}

module.exports = testSuite;