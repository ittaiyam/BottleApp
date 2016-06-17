'use strict';

function testSuite(app) {
    describe('Authentication Controller Unit Testing...', function () {
        var expect = require('chai').expect;
        var request = require('supertest');
        describe('Testing GET /google', function () {
            it('should initiate a redirect.', function (done) {
                request(app)
                    .get('/auth/google')
                    .set('Accept', 'application/json')
                    .expect(302)
                    .end(function (error, result) {
                        expect(!error && result).to.be.ok;
                        expect(result.header.location).to.contain('https://accounts.google.com/o/oauth2/v2/auth');
                        done();
                    });
            });
        });
    });
}

module.exports = testSuite;