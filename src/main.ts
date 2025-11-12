#!/usr/bin/env ts-node
import { Command } from "commander";
import { subscribeNewHeads } from "./tools/rpc";
import { getBlockDetails } from "./tools/rpc";

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

program
  .command("block <hash>")
  .description("Get details of a specific block by its hash")
  .action(async (hash: string) => {
    await getBlockDetails(hash);
  });


program.parse(process.argv);



