import boxen from "boxen";
import chalk from "chalk";
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
