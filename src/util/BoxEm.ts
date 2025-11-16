import boxen from "boxen";
import chalk from "chalk";
//====================
//====================

export function BlockDetailsPrettyPrint(
  blockNumber: string,
  hash: string,
  parent: string,
  timestamp: string,
  extrinsicsCount: number
) {
  const output =
    `${chalk.yellow("Block")} #${blockNumber}\n` +
    `${chalk.cyan("Hash")}: ${hash}\n` +
    `${chalk.cyan("Parent")}: ${parent}\n` +
    `${chalk.cyan("Timestamp")}: ${timestamp}\n` +
    `${chalk.cyan("Extrinsics count")}: ${extrinsicsCount}`;

  console.log(
    boxen(output, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      title: `Block ${blockNumber}`,
      titleAlignment: "center",
    })
  );
}

//====================
//====================

export function ChainPrettyPrint(
  chain:String,
  nodeName:String,
  nodeVersion: String,
  chainType:String
) {
  const output =
    `${chalk.yellow("Chain: ")}`+chalk.cyan(chain) +
    "\n" +
    `${chalk.yellow("Node Name: ")}`+chalk.cyan(nodeName) +
    "\n" +
    `${chalk.yellow("Node Version: ")}`+chalk.cyan(nodeVersion) +
    "\n" +
    `${chalk.yellow("Chain Type: ")}`+chalk.cyan(chainType);

  const boxed = boxen(output, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    title: "Chain Info",
    titleAlignment: "center",
  });

  console.log(boxed);
}

/**
 * Pretty-print any number of labeled values in a box.
 *
 * Usage:
 * prettyBox("Account Info", { Address: "...", Nonce: 3, Balance: "10 DOT" });
 */
export function prettyBox(title: string, fields: Record<string, any>) {
  const lines = Object.entries(fields)
    .map(([key, value]) => `${chalk.cyan(key)}: ${chalk.yellow(String(value))}`)
    .join("\n");

  const content = `${chalk.bold.italic(title)}\n\n${lines}`;

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
    })
  );
}
