# 🪐 Polkakit — A Lightweight Polkadot SDK + CLI

**Polkakit** is a minimal, developer-friendly toolkit built on top of `@polkadot/api`.  
It provides:

- **A usable TypeScript SDK** (importable in any Node/dApp project)
- **A CLI tool** for exploring Polkadot chain data
- Clean wrappers over the major API namespaces:
  - `api.rpc`
  - `api.query`
  - `api.tx`
  - `api.events`
  - `api.consts`

Polkakit aims to remove boilerplate and help developers focus on building real dApps without fighting Polkadot-JS internals.

---

## 🚀 Features

### ✔ CLI Commands  
- Watch new blocks  
- Fetch block details  
- Query chain/system info  
- Explore pallets, storage, and extrinsics  
- Inspect events  
- View runtime constants  

### ✔ SDK Functions  
- Subscribe to new blocks  
- Fetch and decode block data  
- Query storage  
- Inspect events and constants  
- Build tooling on top of Polkadot API without repetitive setup

---

## 📦 Installation

### **CLI (Global install)**

```bash
pnpm build
pnpm link --global
# Now use the CLI
polkakit rpc watch
polkakit rpc chain-info
SDK (library import)
bash
Copy code
pnpm add polkakit
ts
Copy code
import { subscribeNewHeads, getBlockDetails, getChainInfo } from "polkakit";

const api = await connect();

subscribeNewHeads(api, (block) => {
  console.log("New block:", block);
});
📁 Project Structure
powershell
Copy code
src/
  cli/        → CLI implementation
  lib/        → SDK (importable functions)
  util/       → Pretty printers & helpers
  find.ts     → Namespace discovery script
dist/
  ...         → Compiled CJS + ESM outputs
🧩 Quick Start
Run namespace explorer
bash
Copy code
pnpm exec ts-node src/find.ts
This prints available:

RPC groups

Query pallets

Extrinsic pallets

Events

Constants

from the connected Polkadot node.

🛠 CLI Usage
After linking (pnpm link --global):

Watch new blocks
bash
Copy code
polkakit rpc watch
Fetch block by number
bash
Copy code
polkakit rpc block 15000000
Fetch block by hash
bash
Copy code
polkakit rpc block 0xabc123...
Show chain info
bash
Copy code
polkakit rpc chain-info
Show events of a block
bash
Copy code
polkakit events <blockHash>