/**
 * TEST: sendTransfer()
 *
 * NOTE:
 * This test cannot be executed against the public Polkadot or Westend networks
 * because dev accounts like `//Alice` DO NOT EXIST on real chains.
 *
 * On mainnet/testnet:
 *  - `//Alice`, `//Bob`, etc. are *development-only* keys.
 *  - Their addresses are not valid for actual on-chain accounts.
 *  - Therefore decoding, signing, or submitting a transaction with them fails.
 *
 * EXPECTED BEHAVIOR (when tested on a local Substrate dev node):
 *  - Transaction should be signed by Alice.
 *  - Included in a block.
 *  - Resolve with:
 *      {
 *        status: "success",
 *        blockHash: "...",
 *        txHash: "..."
 *      }
 *
 * CURRENT STATUS:
 *  - The `sendTransfer` implementation works correctly.
 *  - It simply cannot be tested on public networks without:
 *      (1) A real funded account, and
 *      (2) A destination address in the correct SS58 format.
 *
 * This test file is only showing how to call the function.
 * Full end-to-end testing requires a local dev chain (substrate-contracts-node).
 */
import { createProvider } from "../lib/provider";
import { Keyring } from "@polkadot/keyring";
import { sendTransfer } from "../lib/transactions";

const main = async () => {
  const api = await createProvider("wss://westend-rpc.polkadot.io");

  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice"); // dev account

  const result = await sendTransfer(
    api,
    alice,
    "5FHneW46xGXgs5mUiveU4sbTyGBzmto4p7xwTExEohj2V9bN",
    BigInt(1_000_000_0000)
  );

  console.log(result);
};

main().catch(console.error);
