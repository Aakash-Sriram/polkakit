import { Command } from "commander";
import chalk from "chalk";

import { connect } from "../lib/api";
import { 
  subscribeNewHeads,
  getChainInfo
} from "../lib/rpc";
import {
  getBlockDetails,
  getBlockDetailsByNumber,
  getLatestBlockDetails
} from "../lib/rpc";

import { prettyBox } from "../util/BoxEm";

export const rpc = new Command("rpc");
const DEFAULT_RPC = "wss://rpc.polkadot.io";

rpc
  .command("watch")
  .description("Subscribe to new Polkadot blocks")
  .action(async () => {
    const api = await connect(DEFAULT_RPC);

    console.log(chalk.cyan("Watching new blocks...\n"));

    await subscribeNewHeads(api, async (block) => {
        const data = await getBlockDetails(api,block.hash);
        const {number , hash, parentHash, timestamp, extrinsics} = data;
        prettyBox("Block Details", {
          Number: number,
          Hash: hash,
          "Parent Hash": parentHash,
          Timestamp: timestamp,
          "Extrinsics Count": extrinsics.length
        });
    });
  });

rpc
  .command("block <hashOrNumber>")
  .description("Get block details by number or hash")
  .action(async (input) => {
    const api = await connect(DEFAULT_RPC);

    let data;
    if (input.startsWith("0x")) {
      data = await getBlockDetails(api, input);
    } else {
      data = await getBlockDetailsByNumber(api, Number(input));
    }

    prettyBox("Block Details", {
      Number: data.number,
      Hash: data.hash,
      "Parent Hash": data.parentHash,
      Timestamp: data.timestamp,
      "Extrinsics Count": data.extrinsics.length
    });
    process.exit(0);
  });

rpc
  .command("latest")
  .description("Get the latest block")
  .action(async () => {
    const api = await connect(DEFAULT_RPC);
    const data = await getLatestBlockDetails(api);

    prettyBox("Latest Block", {
      Number: data.number,
      Hash: data.hash,
      "Parent Hash": data.parentHash,
      Timestamp: data.timestamp,
      "Extrinsics Count": data.extrinsics.length
    });
    process.exit(0);
  });

rpc
  .command("chain-info")
  .description("Get chain info")
  .action(async () => {
    const api = await connect(DEFAULT_RPC);
    const info = await getChainInfo(api);

    prettyBox("Chain Info", {
      Chain: info.chain,
      "Node Name": info.nodeName,
      "Node Version": info.nodeVersion,
      "Chain Type": info.chainType
    });
    process.exit(0);
  });
