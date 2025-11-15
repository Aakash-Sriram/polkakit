import { Command } from "commander";
import chalk from "chalk";

import { connect } from "../lib/api";
import { subscribeNewHeads } from "../lib/stream";
import {
  getBlockDetails,
  getBlockDetailsByNumber,
  getLatestBlockDetails
} from "../lib/blocks";

import { getChainInfo } from "../lib/chain";
import { BlockDetailsPrettyPrint, ChainPrettyPrint } from "../util/BoxEm";

export const rpc = new Command("rpc");

rpc
  .command("watch")
  .description("Subscribe to new Polkadot blocks")
  .action(async () => {
    const api = await connect();

    console.log(chalk.cyan("Watching new blocks...\n"));

    await subscribeNewHeads(api, (block) => {
      console.log(
        chalk.green(
          `New Block #${block.number}  Hash: ${block.hash}`
        )
      );
    });
  });

rpc
  .command("block <hashOrNumber>")
  .description("Get block details by number or hash")
  .action(async (input) => {
    const api = await connect();

    let data;
    if (input.startsWith("0x")) {
      data = await getBlockDetails(api, input);
    } else {
      data = await getBlockDetailsByNumber(api, Number(input));
    }

    BlockDetailsPrettyPrint(
      data.number,
      data.hash,
      data.parentHash,
      data.timestamp,
      data.extrinsics.length
    );
  });

rpc
  .command("latest")
  .description("Get the latest block")
  .action(async () => {
    const api = await connect();
    const data = await getLatestBlockDetails(api);

    BlockDetailsPrettyPrint(
      data.number,
      data.hash,
      data.parentHash,
      data.timestamp,
      data.extrinsics.length
    );
  });

rpc
  .command("chain-info")
  .description("Get chain info")
  .action(async () => {
    const api = await connect();
    const info = await getChainInfo(api);

    ChainPrettyPrint(
      info.chain,
      info.nodeName,
      info.nodeVersion,
      info.chainType
    );
    process.exit(0);
  });
