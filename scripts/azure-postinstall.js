var spawn = require("child_process").spawn;

// this is needed until Azure uses the proper npm/node versions
// to autorun postinstall hooks. Right now, it uses a super old
// version - so we use this shim to build using the correct version
// from the engines package.json field.
if (typeof process.env["DEPLOYMENT_TARGET"] !== "undefined") {
  console.log("Detected Azure");
  console.log("Azure Path: " + process.env.PATH);
  console.log("Azure Npm: " + process.env.NPM_CMD);
  console.log("Azure Node: " + process.env.NODE_EXE);
  console.log("Current Exe: " + process.argv[0]);

  // this depends on typescript/bin/tsc existing in the npm package
  var response = spawn(process.env.NODE_EXE, ["bin/tsc"], {
    cwd: "node_modules/typescript",
    stdio: "inherit"
  });

  response.on("error", function (err) {
    console.log("Spawn Error: " + err.message);
    process.exit(1);
  });

  response.on("exit", function (code) {
    console.log("Spawn code: " + code);
    process.exit(code);
  });
}