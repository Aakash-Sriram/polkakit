import { Command } from "commander";
import { connect } from "../lib/api";
import { prettyBox } from "../util/BoxEm";
import { 
    getFilteredEvents
} from "../lib/events";

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
query
  .command("events")
  .description("Get filtered recent system events")
  .action(async () => {
    const api = await connect();
    const filtered = await getFilteredEvents(api);
    const {blockNumber , events} = filtered;
    if (!events || events.length === 0) {
      console.log("No relevant events in this block.");
      process.exit(0);
    }

    prettyBox(
        `Filtered System Events from\nBlock : ${blockNumber}`,
        events.map(e => 
        `${e.index}: ${e.section}.${e.method}(${JSON.stringify(e.data)})`
      )
      
    );

    process.exit(0);
  });
  