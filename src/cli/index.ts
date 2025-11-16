#!/usr/bin/env node

import { Command } from "commander";

// Import your command groups
import { rpc } from "./rpc";
import { query } from "./query";
// TODO
// import { tx } from "./tx";
// import { consts } from "./consts";
// import { events } from "./events";

const program = new Command();

program
  .name("polkakit")
  .description("Polkadot developer toolkit CLI")
  .version("0.0.1");

// Register subcommands
program.addCommand(rpc);
program.addCommand(query);
// TODO
// program.addCommand(tx);
// program.addCommand(consts);
// program.addCommand(events);

program.parse(process.argv);
