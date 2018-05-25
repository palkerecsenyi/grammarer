let expect = require("chai").expect;
let MongoClient = require("mongodb");

describe("Mongo connection", () => {
    it("doesn't give an error", done => {
        MongoClient.connect("mongodb+srv://admin:crIHh9V9greXCzss@grammarer-slp5s.mongodb.net", (err,client) => {
            expect(err).to.equal(null);
            client.close();
            done();
        });
    });
    it("can query lists", done => {
        MongoClient.connect("mongodb+srv://admin:crIHh9V9greXCzss@grammarer-slp5s.mongodb.net", (err,client) => {
           let dbo = client.db("grammarer-db");
           dbo.collection("lists").findOne({identifier:"g_def"},(err,list)=>{
               expect(err).to.equal(null);
               expect(list.title).to.equal("Definite Article");
               client.close();
               done();
           });
        });
    });
});