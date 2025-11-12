import { api } from "./api";
import chalk from "chalk";

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
