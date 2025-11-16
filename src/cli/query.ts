import { Command } from "commander";
import chalk from "chalk";
import { connect } from "../lib/api";
import { prettyBox } from "../util/BoxEm";

export const query = new Command("query");

query
    .command("account-info <accountId>")
    .description("Get account information by account ID")
    .action(async (accountId) => {
        const api = await connect();
        const info = await api.query.system.account(accountId);
        const jsonInfo = info.toJSON() as any;
        const {nonce, consumers,providers,sufficients,data} = jsonInfo
        const {free , reserved,frozen,flags} =data;
        prettyBox(`Account Info: ${accountId}`, {
            Address: accountId,
            Nonce: nonce,
            Free: free,
            Reserved: reserved,
            Frozen: frozen,
            Flags: flags,
            Consumers: consumers,
            Providers: providers,
            Sufficients: sufficients
        });
        process.exit(0);
    });

