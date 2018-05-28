let MongoClient = require("mongodb");
let prompt = require("prompt");
let dbString = process.env.DBSTRING.replace(/"/g, "");

function gmConsole(string, colour){
    console.log(`${colour}${string}\x1b[0m`);
}

gmConsole("\n===============\nGrammarer Reset\n===============\n", "\x1b[31m");

prompt.start();

prompt.get([{
    name: "confirmation",
    description: "Type 'yes' to confirm database reset - all data from 'grammarer-db' will be erased, and this cannot be undone"
}], (err, res)=>{
    if(err) throw err;
    if(res.confirmation==="yes"){
        MongoClient.connect(dbString, (err, client)=>{
            if(err) throw err;
            let dbo = client.db("grammarer-db");
            dbo.collection("lists").drop();
            dbo.collection("cohorts").drop();
            gmConsole("\nDatabase will be reset momentarily.", "\x1b[33m");
            gmConsole("Ignore any minor errors below, end the script once the database is clear (about 10 seconds).", "\x1b[31m");
        });
    }else{
        gmConsole("\nCancelled.", "\x1b[33m");
    }
});