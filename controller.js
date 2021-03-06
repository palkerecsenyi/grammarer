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
                data[i].userCount = data[i].users.length;
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
        dbo.collection("cohorts").findOne({name:req.session.authcohort.name},(err,cohort)=>{
            if(err) throw err;
            dbo.collection("lists").find({identifier:{$in:cohort.assigned}}).toArray(function(err,lists){
                if(err) throw err;
                const average = arr => arr.reduce((sume, el) => sume + el, 0) / arr.length;
                for(var i in lists){
                    lists[i].table = null;
                    lists[i].list = [];
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
                        code: req.query.code,
                        cohort: TargetCohort
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
                        assigned: [],
                        users: []
                    }, (err)=>{
                        if(err) throw err;
                        res.json({
                            success: true,
                            error: null
                        });
                    })
                }else{
                    res.json({
                        success: false,
                        error: "Cohort already exists, it contains "+finder.users.length+" users."
                    });
                }
            });
        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.get("/d/admindelcohort", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin"){
            dbo.collection("cohorts").deleteOne({name: req.query.name}, (err)=>{
                if(err) res.json({success:false, error:err});
                res.json({
                    success:true,
                    error:null
                });
            })
        }else{
            res.json({
                success:false,
                error:"Not signed in or is not admin"
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

    app.get("/d/adminassigncohort", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin") {
            let TargetCohort = req.query.cohort;
            let TargetList = req.query.listid;
            dbo.collection("lists").findOne({identifier: req.query.listid},(err,data)=>{
                if(err) throw err;
                if(data===null||data===undefined){
                    res.json({
                        success: false,
                        error: "List does not exist"
                    });
                }else{
                    dbo.collection("cohorts").updateOne({name: TargetCohort}, {$push:{assigned:TargetList}}, (err)=>{
                        if(err) throw err;
                        res.json({
                            success: true,
                            error: null
                        });
                    });
                }
            });

        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.get("/d/adminunassigncohort", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin") {
            dbo.collection("cohorts").findOne({name:req.query.cohort}, (err,cohort)=>{
                if(err) throw err;

                const index = cohort.assigned.indexOf(req.query.listid);
                if(index !== -1){
                    cohort.assigned.splice(index, 1);
                    dbo.collection("cohorts").updateOne({name:req.query.cohort},{$set:{assigned:cohort.assigned}},(err)=>{
                        if(err) throw err;
                        res.json({
                            success: true,
                            error: null
                        });
                    });
                }else{
                    res.json({
                        success: false,
                        error: "Could not find list assignment to delete. Searched for "+req.query.listid+" in "+req.query.cohort
                    });
                }

            });
        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.get("/d/randomcode", (req,res)=>{
        if(req.session.authed&&(req.session.authrole==="teacher"||req.session.authrole==="admin")) {

            let TargetCohort;
            if (req.session.authrole === "teacher") {
                TargetCohort = req.session.authcohort.name;
            } else {
                TargetCohort = req.query.cohort || req.session.authcohort.name
            }

            function doTry(){
                let TryCode = Math.floor(Math.random() * 10000).toString();
                dbo.collection("cohorts").findOne({
                    name: TargetCohort,
                    "users.code": TryCode
                }, (err, data)=>{
                    if(err) throw err;
                    if(data!==null){
                        doTry();
                    }else{
                        res.json({
                            code: TryCode
                        });
                    }
                });
            }

            doTry();
        }
    });

    app.get("/d/adminlists", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin"){
            dbo.collection("lists").find({}).toArray((err,data)=>{
                if(err) throw err;
                res.json(data);
            });
        }else{
            res.send("Not authorised");
        }
    });

    app.get("/d/admindellist", (req,res)=>{
        if(req.session.authed&&req.session.authrole==="admin"){
            dbo.collection("lists").deleteOne({identifier:req.query.listid},(err)=>{
                if(err) throw err;
                res.json({
                    success: true,
                    error: null
                });
            });
        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.get("/d/adminaddlist", (req,res) => {
        if(req.session.authed&&req.session.authrole==="admin"){
            let json = JSON.parse(req.query.json);
            dbo.collection("lists").findOne({identifier: json.identifier}, (err, list)=>{
                if(err) throw err;
                if(list==null){
                    dbo.collection("lists").insertOne(JSON.parse(req.query.json), (err, response) => {
                        if(err) throw err;
                        res.json({
                            success: true,
                            response: response,
                            error: null
                        });
                    });
                }else{
                    res.json({
                        success: false,
                        error: "List with identifier '"+json.identifier+"' already exists"
                    });
                }
            });
        }else{
            res.json({
                success: false,
                error: "Not signed in or is not admin"
            });
        }
    });

    app.listen(port);

});
