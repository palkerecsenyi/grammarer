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

    app.get("/d/cohorts", (req,res)=>{
        dbo.collection("cohorts").find({}).toArray((err, data)=>{
            if(err) throw err;
            for(let i in data){
                data[i].users = [];
            }
            res.json(data);
        });
    });

    app.get("/d/auth", function(req,res){
        if(req.session.authed){
            res.json({success:true,error:null});
        }else{
            dbo.collection("cohorts").findOne({name:req.query.cohort},function(err,cohort){
                if(err) throw err;

                let user = cohort.users.find((e)=>{
                    return e.code === req.query.code;
                });

                if(user!==null&&user!==undefined){
                    req.session.authed = true;
                    req.session.authcode = req.query.code;
                    req.session.authrole = user.role;
                    req.session.authprefix = user.prefix || null;
                    req.session.authcohort = {
                        name: cohort.name,
                        owner: user.owner
                    };

                    res.json({
                        success:true,
                        error:null
                    });

                    dbo.collection("cohorts").updateOne({
                        name: cohort.name,
                        "users.code": user.code
                        },{
                        $set: {
                            "users.$.lastAccess": Date.now()
                        }
                    },function(err){
                        if(err) throw err;
                    });
                }else{
                    req.session.authed = false;
                    res.json({
                        success:false,
                        error:"Code not found - it may be in a different cohort"
                    });
                }
            });
        }
    });

    app.get("/d/session", function(req,res){
        if(req.session.authed){
            let json = {
                authenticated: true,
                code: req.session.authcode,
                cohort: req.session.authcohort,
                adminRole: null
            };
            json.admin = (req.session.authrole==="admin" || req.session.authrole==="teacher");
            if(json.admin){
                json.adminRole = req.session.authrole
            }
            res.json(json);
        }else{
            res.json({
                authenticated: false,
                code: null,
                admin: false,
                adminRole: null
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

            if(req.session.authrole==="admin"){
                dbo.collection("cohorts").find({}).toArray((err,data)=>{
                    if(err) throw err;
                    let result = [];
                    for(let i in data){
                        for(let b in data[i].users){
                            data[i].users[b].cohort = data[i].name;
                            result.push(data[i].users[b]);
                        }
                    }
                    respond(result);
                });
            }else{
                dbo.collection("cohorts").findOne({name:req.session.authcohort.name}, (err,data)=>{
                    if(err) throw err;
                    let result = [];
                    for(let i in data.users){
                        data.users[i].cohort = req.session.authcohort.name;
                        if(data.users[i].role!=="admin"){
                            result.push(data.users[i]);
                        }
                    }
                    respond(result);
                });
            }
            function respond(json){
                res.json({
                    success: true,
                    error: null,
                    cohort: req.session.authcohort.name,
                    data: json
                });
            }
        }else{
            res.json({
                success:false,
                error:"User not signed in or is not admin",
                cohort: null,
                data:null
            });
        }
    });

    app.get("/d/adminaddcode", (req,res)=>{
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")){

            let Role;
            let TargetCohort;
            if(req.session.authrole==="teacher"){
                Role = "student";
                TargetCohort = req.session.authcohort.name;
            }else{
                Role = req.query.role || "student";
                TargetCohort = req.query.cohort || req.session.authcohort.name
            }

            dbo.collection("cohorts").findOne({name: TargetCohort}, function(err, cohort){
                if(err) throw err;
                let content = cohort.users.find((e)=>{
                    return e.code === req.query.code;
                });
                if(content===undefined||content===null){
                    dbo.collection("cohorts").update({name:TargetCohort},{
                        $push:{
                            users:{
                                code: req.query.code,
                                deploy: req.query.deploy,
                                card: (req.query.card==="true"),
                                role: Role,
                                owner: false,
                                lastAccess: 0
                            }
                        }
                    });
                    res.json({
                        success: true,
                        error: null,
                        code: req.query.code
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

    app.get("/d/adminaddcohort", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin"){
            dbo.collection("cohorts").find({}).toArray((err,data)=>{
                if(err) throw err;
                let finder = data.find((e)=>{
                    return e.name === req.query.name
                });
                if(finder===null||finder===undefined){
                    dbo.collection("cohorts").insertOne({
                        name: req.query.name,
                        users: []
                    }, (err)=>{
                        if(err) throw err;
                        res.json({
                            success: true,
                            error: null
                        });
                    })
                }
            });
        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.get("/d/admindelcode", (req,res)=>{
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")) {
            let code = req.query.code;
            let TargetCohort;
            if (req.session.authrole === "teacher") {
                TargetCohort = req.session.authcohort.name
            }else{
                TargetCohort = req.query.cohort;
            }

            dbo.collection("cohorts").updateOne({name:TargetCohort}, {
                $pull:{
                    users:{
                        code: code
                    }
                }
            }, function (err) {
                if (err) throw err;
                res.json({
                    success: true,
                    error: null
                });
            });
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
