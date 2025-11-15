#!/usr/bin/env ts-node
import { Command } from "commander";
import {
  subscribeNewHeads,
  getBlockDetails,
  getBlockDetailsByNumber,
  getChainInfo,
} from "./tools/rpc";

const program = new Command();

program.name("polkakit").description("Polkadot CLI toolkit").version("0.0.1");

program
  .command("watch")
  .description("Stream new Polkadot blocks")
  .action(async () => {
    await subscribeNewHeads();
  });

program
  .command("block <input>")
  .description("Get details of a specific block by hash or number")
  .action(async (input: string) => {
    const blockNum = Number(input);
    if (input.startsWith("0x")) {
      // input is a block hash
      await getBlockDetails(input);
    } else {
      await getBlockDetailsByNumber(blockNum);
    }
  });


program
  .command("chain")
  .description("Get chain information")
  .action(async () => {
    await getChainInfo();
    process.exit(0);
  });

program.parse(process.argv);
