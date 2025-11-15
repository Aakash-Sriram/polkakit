import { api } from "./api";
import chalk from "chalk";
import { boxEm } from "../util/BoxEm";

export async function subscribeNewHeads() {
  console.log(chalk.cyan("Connecting to Polkadot..."));

  const myApi = await api();
  console.log(chalk.green("Connected! Listening for new blocks...\n"));

  const unsubscribe = await myApi.rpc.chain.subscribeNewHeads(
    async (header: any) => {
      //    const blockNumber = header.number.toString();
      const hash = header.hash.toHex();
      await getBlockDetails(hash);
    },
  );

  process.on("SIGINT", () => {
    console.log("\nDisconnecting...");
    unsubscribe();
    process.exit(0);
  });

  return unsubscribe;
}

export async function getBlockDetails(blockHash: string) {
  const myApi = await api();
  const myBlock = await myApi.rpc.chain.getBlock(blockHash);
  const header = myBlock.block.header;
  const extrinsics = myBlock.block.extrinsics;

  const { parentHash, number, hash } = header;

  let timestamp: string | null = null;

  for (const ext of extrinsics) {
    const { method } = ext;
    if (method.section === "timestamp" && method.method === "set") {
      const raw = parseInt(method.args[0].toString(), 10);
      timestamp = new Date(raw).toISOString();
      break;
    }
  }

  if (!timestamp) {
    timestamp = "N/A";
  }

  // 🔥 Decode extrinsics here
  const decoded = extrinsics.map((ext, index) => {
    try {
      const method = ext.method;
      const section = method.section;
      const call = method.method;
      const args = method.args.map((a: any) => a.toHuman());
      return {
        index,
        section,
        call,
        args,
      };
    } catch (err) {
      return { index, error: "Failed to decode extrinsic" };
    }
  });

  console.log(chalk.yellow("\nExtrinsics:"));
  decoded.forEach((ex) => {
    if (!ex.error) {
      console.log(
        `  [${ex.index}] ${chalk.cyan(ex.section)}.${chalk.green(ex.call)}(${ex.args.join(", ")})`,
      );
    } else {
      console.log(`  [${ex.index}] <decode error>`);
    }
  });

  console.log("\n");

  boxEm(
    number.toString(),
    hash.toHex(),
    parentHash.toHex(),
    timestamp,
    extrinsics.length,
  );
}

export async function getBlockDetailsByHash() {
  console.log(chalk.cyan("Connecting to Polkadot..."));
  const myApi = await api();
  console.log(chalk.green("Connected! Fetching latest block details...\n"));
  const latestHeader = await myApi.rpc.chain.getHeader();
  const latestBlockHash = latestHeader.hash;
  await getBlockDetails(latestBlockHash.toHex());
}

export async function getBlockDetailsByNumber(number: number) {
  const myApi = await api();
  const blockHash = await myApi.rpc.chain.getBlockHash(number);
  await getBlockDetails(blockHash.toHex());
}
