import { Command } from "commander";
import chalk from "chalk";
import { connect } from "../lib/api";

export const query = new Command("query");

query
    .command("account-info <accountId>")
    .description("Get account information by account ID")
    .action(async (accountId) => {
        const api = await connect();
        const info = await api.query.system.account(accountId);
        console.log(chalk.cyan(`Account Info for ${accountId}:\n`), info.toHuman());
        process.exit(0);
    });

