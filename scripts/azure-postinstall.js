var spawn = require("child_process").spawn;

if (typeof process.env["DEPLOYMENT_TARGET"] !== "undefined") {
  console.log("Detected Azure");
  console.log("Azure Path: " + process.env.PATH);
  console.log("Azure Npm: " + process.env.NPM_CMD);
  console.log("Azure Node: " + process.env.NODE_EXE);
  console.log("Current Exe: " + process.argv[0]);

  var response = spawn(process.env.NODE_EXE, ["node_modules/.bin/tsc"], {
    stdio: "inherit"
  });

  response.on("error", function (err) {
    console.log("Spawn Error: " + err.message);
  });

  response.on("exit", function (code) {
    console.log("Spawn code: " + code);
    process.exit(code);
  });
}