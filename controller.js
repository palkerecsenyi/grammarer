let express = require("express");
let app = express();
let session = require('express-session');
let cookieParser = require("cookie-parser");
let MongoClient = require("mongodb");
let MongoString = process.env.DBSTRING.replace(/"/g,"");

function gmConsole(string, colour){
    console.log(`${colour}${string}\x1b[0m`);
}

MongoClient.connect(MongoString, function(err,client){
    if(err) throw err;
    var dbo = client.db("grammarer-db");

    app.use(cookieParser());
    app.use(session({
        secret:"6(9MCBKU4R9\"n`qkFTjFJWS[Y/",
        resave: false,
        saveUninitialized: true
    }));
    app.use(express.static('frontend'));

    let port = process.env.PORT || 80;

    gmConsole("\n=====================\nGrammarer Application\n=====================\n", "\x1b[31m");
    gmConsole("Grammarer is ready - access it at localhost:"+port, "\x1b[33m");

    app.get("/", function(req,res){
        res.sendFile(__dirname+"/frontend/index.html");
    });

    app.get("/d/auth", function(req,res){
        if(req.session.authed){
            res.json({success:true,error:null});
        }else{
            dbo.collection("users").findOne({code:req.query.code},function(err,user){
                if(err) throw err;
                if(user!==null&&user!==undefined){
                    req.session.authed = true;
                    req.session.authcode = req.query.code;
                    req.session.authrole = user.role;
                    req.session.authprefix = user.prefix || null;
                    res.json({
                        success:true,
                        error:null
                    });
                    dbo.collection("users").updateOne({code:req.query.code},{$set:{lastAccess:Date.now()}},function(err){
                        if(err) throw err;
                    })
                }else{
                    req.session.authed = false;
                    res.json({
                        success:false,
                        error:"Code not found"
                    });
                }
            });
        }
    });

    app.get("/d/session", function(req,res){
        if(req.session.authed){
            let json = {
                authenticated: true,
                code: req.session.authcode
            };
            json.admin = (req.session.authrole==="admin" || req.session.authrole==="teacher");
            res.json(json);
        }else{
            res.json({
                authenticated: false,
                code: null,
                admin: false
            });
        }
    });

    app.get("/d/signout", function(req,res){
        req.session.destroy();
        res.json({
            success:true
        });
    });

    app.get("/d/lists", function(req,res){
        dbo.collection("lists").find({}).toArray(function(err,lists){
            if(err) throw err;
            if(lists.length===0){
                console.log("list length bad: "+JSON.stringify(lists));
            }
            const average = arr => arr.reduce((sume, el) => sume + el, 0) / arr.length;
            for(var i in lists){
                lists[i].table = null;
                var results = lists[i].results;
                results = results.filter(function(a){
                    return a.code === req.session.authcode;
                });
                var scores = [];
                for(var b in results){
                    scores.push(results[b].percent);
                }
                lists[i].progress = average(scores);
                if(lists[i].progress==null||lists[i].progress==undefined){
                    lists[i].progress = 0;
                }
                lists[i].results = null;
                lists[i].progress = Math.round(lists[i].progress);
            }
            res.json(lists);
        });
    });

    app.get("/d/listdata",function(req,res){
        dbo.collection("lists").findOne({identifier:req.query.list},function(err,list){
            if(err) throw err;
            list.results = [];
            res.json(list);
        });
    });

    app.get("/d/listsave",function(req,res){
        if(req.session.authed){
            var answers = [parseInt(req.query.c),parseInt(req.query.i)];
            var percent = (answers[0]/(answers[0]+answers[1]))*100;
            dbo.collection("lists").updateOne({identifier:req.query.list},{$push: {
                    results:{
                        code:req.session.authcode,
                        correct:answers[0],
                        incorrect:answers[1],
                        percent:Math.round(percent),
                        timestamp:Date.now()
                    }
                }},function(err){
                if(err) throw err;
                res.json({
                    success:true
                });
            });
        }else{
            res.json({
                success:false,
                error:"Must be signed in."
            });
        }
    });

    app.get("/d/listclear",function(req,res){
        if(req.session.authed){
            dbo.collection("lists").updateOne({identifier:req.query.list},{$pull:{results:{code:req.session.authcode}}},function(err){
                if(err) throw err;
                res.json({
                    success: true
                });
            })
        }else{
            res.json({
                success:false,
                error:"Must be signed in."
            });
        }
    });

    app.get("/d/listhistory", function(req,res){
        if(req.session.authed){
            dbo.collection("lists").findOne({identifier:req.query.list},function(err,list){
                if(err) throw err;
                var results = list.results.filter(function(i){
                    return i.code === req.session.authcode;
                });
                var response = {};
                response.type = "Line";
                response.data = {
                    cols: [
                        {
                            id:"time",
                            label:"Time",
                            type:"datetime"
                        },
                        {
                            id:"score",
                            label:"Average percentage",
                            type:"number"
                        }
                    ],
                    rows: []
                };
                response.options = {};
                for(var i in results){
                    if(i>0){
                        var previous = results[i-1].percent;
                        var average = (results[i].percent + previous) / 2;
                    }else{
                        var average = results[i].percent;
                    }
                    response.data.rows.push({
                        c:[
                            {
                                v: results[i].timestamp
                            },
                            {
                                v: average
                            }
                        ]
                    });
                    results[i].percent = average;
                }
                res.json(response);
            });
        }else{
            res.json({
                success: false,
                error: "Must be signed in."
            });
        }
    });

    app.get("/d/admincodes", (req,res) => {
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")){
            let comparer;
            comparer = req.session.authprefix ? new RegExp("(" + req.session.authprefix + ")", "g") : new RegExp("[\s\S]*", "g");

            dbo.collection("users").find({code:{$regex: comparer}}).toArray((err,data)=>{
                res.json({
                    success:true,
                    error:null,
                    prefix: req.session.authprefix || "anything",
                    data:data
                });
            });
        }else{
            res.json({
                success:false,
                error:"User not signed in or is not admin",
                prefix: null,
                data:null
            });
        }
    });

    app.get("/d/adminaddcode", (req,res)=>{
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")){
            const prefix = req.session.authprefix || "";
            const PrefixedCode = `${prefix}-${req.query.code}`;
            dbo.collection("users").findOne({code: PrefixedCode}, function(err, content){
                if(err) throw err;
                if(content===undefined||content===null){
                    dbo.collection("users").insertOne({
                        code: `${prefix}-${req.query.code}`,
                        deploy: req.query.deploy,
                        card: (req.query.card==="true"),
                        role: "student",
                        lastAccess: 0
                    });
                    res.json({
                        success: true,
                        error: null,
                        code: PrefixedCode
                    });
                }else{
                    res.json({
                        success: false,
                        error: "Code already registered"
                    });
                }
            });

        }else{
            res.json({
                success:false,
                error:"User not signed in or is not admin",
            });
        }
    });

    app.get("/d/admindelcode", (req,res)=>{
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")){
            let code = req.query.code;
            if(req.session.authrole==="teacher"){
                if(!code.startsWith(req.session.authprefix+"-")){
                    res.json({
                        success: false,
                        error: "Code does not start with required prefix (" + req.session.authprefix + ")"
                    });
                }else{
                    doDelete();
                }
            }else{
                doDelete();
            }
            function doDelete(){
                dbo.collection("users").deleteOne({code: code}, function(err){
                    if(err) throw err;
                    res.json({
                        success:true,
                        error: null
                    });
                });
            }
        }
    });

    app.get("/i/addlist", (req,res) => {
        if(req.session.authed&&req.session.authrole==="admin"){
            dbo.collection("lists").insertOne(JSON.parse(req.query.json), (err, response) => {
                if(err) throw err;
                res.send(response);
            });
        }else{
            res.send("Not authorised");
        }
    });

    app.listen(port);

});
