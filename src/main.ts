#!/usr/bin/env ts-node
import { Command } from "commander";
import { subscribeNewHeads } from "./tools/rpc";

const program = new Command();

program
  .name("dotcli")
  .description("Polkadot CLI toolkit")
  .version("0.1.0");

program
  .command("tail")
  .description("Stream new Polkadot blocks")
  .action(async () => {
    await subscribeNewHeads();
  });

program.parse(process.argv);



