var spawn = require("child_process").spawnSync;

if (typeof process.env["DEPLOYMENT_TARGET"] !== "undefined") {
  console.log("Detected Azure");
  console.log("Azure Path: " + process.env.PATH);
  console.log("Azure Npm: " + process.env.NPM_CMD);
  console.log("Azure Node: " + process.env.NODE_EXE);
  console.log("Current Exe: " + process.argv[0]);

  var response = spawn(process.env.NODE_EXE, ["node_modules/.bin/tsc"], {
    stdio: "inherit"
  });

  if (response.error) {
    console.log("Tsc Error: " + response.error);
  }

  console.log("Tsc status: " + response.status);
}