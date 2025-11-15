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
  nodeVersion: String
) {
  const output =
    chalk.cyan(chain) +
    "\n" +
    chalk.cyan(nodeName) +
    "\n" +
    chalk.cyan(nodeVersion);

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