/**
 * TEST: InkContract (ink!.wasm smart contracts)
 *
 * IMPORTANT:
 * ---------------------------------------------
 * THIS TEST CANNOT RUN ON:
 *   - Polkadot Relay Chain
 *   - Westend
 *   - Kusama
 *
 * Because these chains DO NOT support contracts.
 *
 * ink! contracts ONLY run on:
 *   - substrate-contracts-node (local dev)
 *   - Shibuya (Astar Testnet)
 *   - Phala PoC3
 *   - Aleph Zero Testnet
 *   - Any chain with `pallet-contracts`
 *
 * EXPECTED BEHAVIOR (when using a real contract chain):
 *   1. Load ABI + contract address
 *   2. Perform a dry-run query (no gas, no fee)
 *   3. Execute a transaction (writes to contract)
 *
 * This file shows how to call InkContract APIs.
 * Running it requires:
 *   - A contract-enabled node
 *   - A deployed ink! contract
 *   - The contract's ABI JSON
 */
import fs from "fs";
import { createProvider } from "../lib/provider";
import { Keyring } from "@polkadot/keyring";
import { createInkContract } from "../lib/ink";

const RPC = "ws://127.0.0.1:9944"; // Local contracts node
const ABI_PATH = "./contract_metadata.json"; // Replace with your ABI
const CONTRACT_ADDRESS = "5F..."; // Replace with your deployed contract address

const main = async () => {

  const api = await createProvider(RPC);


  const metadata = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));


  const contract = createInkContract(api, metadata, CONTRACT_ADDRESS);

  // -------------------------
  //    NOTE: Only works on local dev node!
  // -------------------------
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");

  console.log("\nQUERY: getValue()");

  try {
    const res = await contract.query(alice.address, "getValue");
    console.log("Query result:", res);
  } catch (err) {
    console.error("Query failed:", err);
  }

  console.log("\nTX: setValue(123)");

  try {
    const output = await contract.tx(alice, "setValue", 0, 123);
    console.log("TX Result:", output);
  } catch (err) {
    console.error("TX failed:", err);
  }

  process.exit(0);
};

main().catch(console.error);
/**
 * EXPECTED OUTPUT (WHEN RUNNING ON A CONTRACT NODE)

If the ink! contract has:

#[ink(message)]
pub fn getValue(&self) -> u32 {}

#[ink(message)]
pub fn setValue(&mut self, x: u32) {}

Query Output
QUERY: getValue() 
Query result: 0

Tx Output

(after writing )

TX: setValue(123) 
{
  status: "in-block",
  blockHash: "0xabc...",
  events: [
    { section: "contracts", method: "ContractEmitted", ... },
    { section: "system", method: "ExtrinsicSuccess", ... }
  ]
}

❗ HOW TO ACTUALLY RUN THIS TEST

You must install a contracts-enabled chain:

Option A — easiest
docker run -p 9944:9944 -it paritytech/contracts-node:latest

Option B — manually
rustup default stable
rustup target add wasm32-unknown-unknown
cargo install contracts-node --git https://github.com/paritytech/contracts-node --force
substrate-contracts-node --dev

 */