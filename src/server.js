const chalk = require("chalk");
const pathParse = require("path-parse");
const yargs = require("yargs")(process.argv.slice(2));
const { createServer } = require("http");
const { appProperties } = require("./config/app.config");
const { createServer:createIOServer } = require("./server-io");

// === yargs settings ===
yargs
  .option("port", {
    alias: "p",
    demandOption: false,
    default: appProperties.portDefault,
    describe: "The port were the server is listening",
    type: "number",
    nargs: 1,
  })
  .version("1.0.0")
  .help()
  .usage("Usage: $0 -p port")
  .example(
    `$0 -p ${appProperties.portDefault}`,
    `: Start the server on port ${appProperties.portDefault}`
  )
  .epilog(
    `${chalk.bold.inverse.green("CAS-WApp")}\nBy Cyril Adam\nCopyright 2022`
  );
const argv = yargs.argv;

const serverExpress = require("./server-express");
const httpServer = createServer(serverExpress);
createIOServer(httpServer);

// === starting the server ===
httpServer.listen(process.env.PORT||argv.port, () => {
  console.log(
    `${chalk.bold.inverse.green(
      " Success "
    )} : Server is up at http://localhost:${process.env.PORT||argv.port}`
  );
  console.log(`> See more options : ${pathParse(argv["$0"]).base} --help`);
});
