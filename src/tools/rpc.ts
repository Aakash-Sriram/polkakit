import { api } from "./api";
import chalk from "chalk";
import { boxEm } from "../util/BoxEm";
export async function subscribeNewHeads() {
  console.log(chalk.cyan("Connecting to Polkadot..."));

  const myApi = await api();
  console.log(chalk.green("Connected! Listening for new blocks...\n"));

  const unsubscribe = await myApi.rpc.chain.subscribeNewHeads((header:any) => {
    const blockNumber = header.number.toString();
    const hash = header.hash.toHex();
    console.log(
      chalk.yellow(`New block #${blockNumber}`),
      chalk.italic(hash)
    );
  });

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

  boxEm(
    number.toString(),
    hash.toHex(),
    parentHash.toHex(),
    timestamp,                      
    extrinsics.length
  );
}

  
export async function getLatestBlockDetailsByHash() {
  const myApi = await api();
  const latestHeader = await myApi.rpc.chain.getHeader();
  const latestBlockHash = latestHeader.hash;
  await getBlockDetails(latestBlockHash.toHex());
}

export async function getLatestBlockDetailsByNumber(number:number){
    const myApi = await api();
    const blockHash = await myApi.rpc.chain.getBlockHash(number);
    await getBlockDetails(blockHash.toHex());

}
