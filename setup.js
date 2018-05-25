let fs = require("fs");

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

        gmConsole("Setting ports", "\x1b[33m");
        packageJson.scripts.start = `set PORT=${json.ports.production}&&set DBSTRING=${json.dbString}&&node controller.js`;
        packageJson.scripts["start-dev"] = `set PORT=${json.ports.development}&&set DBSTRING=${json.dbString}&&node controller.js`;

        gmConsole("Writing package.json", "\x1b[33m");
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

        gmConsole("Writing frontend config", "\x1b[33m");
        fs.writeFileSync("frontend/gm-options.json", JSON.stringify(json));

        gmConsole("\n=======================================================\nDONE!\nRun 'npm start' or 'npm run start-dev' to run Grammarer\n=======================================================\n", "\x1b[31m");
    }
});