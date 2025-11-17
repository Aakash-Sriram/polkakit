import { createProvider } from "../lib/provider";
import {
  getTokenMetadata,
  getNativeToken,
  getAvailablePallets,
  getRpcNamespaces,
  getStorageEntries,
  getExtrinsics
} from "../lib/metadata";

async function main() {
  const api = await createProvider("wss://rpc.polkadot.io");

  console.log("\nToken Metadata");
  console.log(getTokenMetadata(api));

  console.log("\nNative Token");
  console.log(getNativeToken(api));

  console.log("\nPallets (query/tx/consts)");
  console.log(getAvailablePallets(api));

  console.log("\nRPC Namespaces");
  console.log(getRpcNamespaces(api));

  console.log("\nStorage Entries (balances)");
  console.log(getStorageEntries(api, "balances"));

  console.log("\nExtrinsics (balances)");
  console.log(getExtrinsics(api, "balances"));

  process.exit(0);
}

main().catch(console.error);
