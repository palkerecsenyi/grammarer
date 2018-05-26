let expect = require("chai").expect;
let request = require("request");

describe("User authentication provider",function(){
    describe("Frontend auth query",function(){
        it("returns status 200", done => {
            request("http://localhost/d/auth?code=admin", (err, res) => {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
        it("returns success", done => {
            request("http://localhost/d/auth?code=admin", (err, res, body) => {
                body = JSON.parse(body);
                expect(body.success).to.equal(true);
                done();
            })
        });
    });
    describe("Signout query", function(){
        it("returns success", done => {
            request("http://localhost/d/signout", (err,res,body) => {
                body = JSON.parse(body);
                expect(body.success).to.equal(true);
                done();
            });
        });
    });
});