let fs = require("fs");
let css = require("css");
let MongoClient = require("mongodb");
let getOS = require("getos");

function gmConsole(string, colour){
    console.log(`${colour}${string}\x1b[0m`);
}

gmConsole("\n===============\nGrammarer Setup\n===============\n", "\x1b[31m");

gmConsole("Reading JSON from gm-options.json", "\x1b[33m");
fs.readFile("gm-options.json", function(err, config){
    if(err){
        gmConsole("Error reading JSON from gm-options.json: "+err, "\x1b[47m\x1b[31m");
        process.exit();
    }

    // Set JSON
    let json = JSON.parse(config);

    // Check JSON
    gmConsole("Checking JSON for content errors", "\x1b[33m");
    if(!json.organisation|| !json.rootUrl || !json.ports || !json.features){
        gmConsole("JSON error found in gm-options.json - please check documentation again", "\x1b[41m");
    }else{
        gmConsole("Reading package.json", "\x1b[33m");
        let packageJson = JSON.parse(fs.readFileSync("package.json"));

        json.dbString = '"' + json.dbString + '"';

        gmConsole("Setting ports", "\x1b[33m");

        getOS(function(e,os){
            if(e) return console.log(e);

            let command = "export";
            if(os.os.startsWith("win")){
                command = "set";
            }
            packageJson.scripts.start = `${command} PORT=${json.ports.production}&&${command} DBSTRING=${json.dbString}&&node controller.js`;
            packageJson.scripts["start-dev"] = `${command} PORT=${json.ports.development}&&${command} DBSTRING=${json.dbString}&&node controller.js`;
            packageJson.scripts["dev-reset-db"] = `${command} DBSTRING=${json.dbString}&&node reset.js`;

            gmConsole("Writing package.json", "\x1b[33m");
            fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

            json.dbString = json.dbString.replace(/"/g,"");

            gmConsole("Reading navbar.css", "\x1b[33m");
            let navbar = fs.readFileSync("frontend/navbar.css", "utf-8");
            gmConsole("Parsing CSS", "\x1b[33m");
            navbar = css.parse(navbar, { source: "frontend/navbar.css" });
            gmConsole("Changing colour rules", "\x1b[33m");
            navbar.stylesheet.rules[0].declarations[0].value = json.organisation.primaryColour + "!important";
            navbar.stylesheet.rules[1].declarations[1].value = json.organisation.primaryColour + "!important";
            navbar.stylesheet.rules[2].declarations[0].value = json.organisation.secondaryColour + "!important";
            gmConsole("Generating string", "\x1b[33m");
            navbar = css.stringify(navbar);
            gmConsole("Writing navbar.css", "\x1b[33m");
            fs.writeFileSync("frontend/navbar.css", navbar);

            gmConsole("Reading loader.css", "\x1b[33m");
            let loader = fs.readFileSync("frontend/loader.css", "utf-8");
            gmConsole("Parsing CSS", "\x1b[33m");
            loader = css.parse(loader, { source: "frontend/loader.css" });
            gmConsole("Changing colour rules", "\x1b[33m");
            loader.stylesheet.rules[2].declarations[3].value = json.organisation.primaryColour;
            loader.stylesheet.rules[2].declarations[4].value = json.organisation.primaryColour;
            gmConsole("Generating string", "\x1b[33m");
            loader = css.stringify(loader);
            gmConsole("Writing loader.css", "\x1b[33m");
            fs.writeFileSync("frontend/loader.css", loader);

            gmConsole("Creating database", "\x1b[33m");
            MongoClient.connect(json.dbString, function(err,client) {
                if (err) throw err;
                let dbo = client.db("grammarer-db");
                dbo.collection("cohorts").find({}).toArray((err,data)=>{
                    if(err) throw err;
                    /*
                    code: "admin",
                    deploy: "setup",
                    card: false,
                    role: "admin",
                    lastAccess: 0
                     */
                    if(data.length===0){
                        dbo.collection("cohorts").insertOne({
                            name: "staff",
                            users: [
                                {
                                    code: "admin",
                                    deploy: "setup",
                                    card: false,
                                    role: "admin",
                                    owner: true,
                                    lastAccess: 0
                                }
                            ]
                        },(err)=>{
                            if(err) throw err;
                            gmFinish();
                        });
                    }else{
                        gmFinish();
                    }
                });
            });
        });

        function gmFinish(){
            gmConsole("Writing frontend config", "\x1b[33m");
            json.dbString = "";
            fs.writeFileSync("frontend/gm-options.json", JSON.stringify(json));

            gmConsole("\n========================================================\nDONE!\nRun 'npm start' or 'npm run start-dev' to run Grammarer.\nUse the default code 'admin' to sign in.\n========================================================\n", "\x1b[31m");
            process.exit();
        }
    }
});