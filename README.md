# Polkakit (polkakit)

Polkakit is a lightweight TypeScript toolkit and CLI for interacting with Substrate-based chains (Polkadot, Kusama and parachains) using `@polkadot/api`.

It provides two main surfaces:

- A programmatic SDK under `src/lib/` with helpers for connecting to nodes, reading chain state, decoding blocks, and filtering events.
- A CLI wrapper under `src/cli/` that provides quick developer commands for inspecting blocks, events and account state.

This README documents what is implemented in this repository right now, how to use the CLI, and how to use the implemented SDK functions programmatically.

## Table of contents

- Features implemented
- Installation
- CLI usage (examples)
- Programmatic API: functions and examples
- File map / internals
- Development notes, roadmap and next steps
- Contributing & license

## Features implemented

- Provider management with connection caching and clean disconnects.
- RPC helpers: fetch block details (by hash or number), get latest block, subscribe to new heads, and get chain/node info.
- Event helpers: read raw events, filter events by an allow-list, query events by block hash.
- Storage and state helpers: fetch account info, robust balance lookup (supports `balances` and `tokens` pallets when available), token metadata helpers.
- Metadata helpers: list available pallets under `query`, `tx`, `consts`, list extrinsics/storage for a pallet and discover RPC namespaces.
- A CLI exposing `rpc` and `query` groups with useful subcommands (watch, block, latest, chain-info, account-info, events).

## Installation

Install dependencies (pnpm is used by the project):

```bash
pnpm install
```

Run CLI commands with `ts-node` (developer mode):

```bash
# get latest block
pnpm exec ts-node src/cli/index.ts rpc latest

# watch new blocks
pnpm exec ts-node src/cli/index.ts rpc watch

# query account info
pnpm exec ts-node src/cli/index.ts query account-info <ADDRESS>

# get filtered events (or provide -b <hash>)
pnpm exec ts-node src/cli/index.ts query events
pnpm exec ts-node src/cli/index.ts query events -b <BLOCK_HASH>
```

If you prefer, compile with `tsc` and publish the compiled `dist/` files for a production-ready package.

## CLI usage (what's available)

The CLI lives in `src/cli/` and registers the following commands:

- `rpc watch` — Subscribe to new blocks and pretty-print a summary for each.
- `rpc block <hash|number>` — Print detailed info for a block by hash or number.
- `rpc latest` — Print latest block.
- `rpc chain-info` — Print chain and node information (chain name, node version, health).
- `query account-info <accountId>` — Print account nonce and token balances.
- `query events [-b, --block <hash>]` — Print filtered events from the latest block or the specified block hash.

The CLI currently uses `wss://rpc.polkadot.io` as the default endpoint. You can adjust the code or call SDK functions directly to use a different endpoint.

## Programmatic API (what's implemented)

The following modules and functions are implemented in `src/lib/`.

Provider (src/lib/provider.ts)

- createProvider(RPC_URL: string): Promise<ApiPromise>
  - Creates a brand-new ApiPromise connected to RPC_URL.

- connect(RPC_URL: string): Promise<ApiPromise>
  - Returns a cached provider when possible; otherwise creates and caches a new one.

- getProviderInstance(RPC_URL?): Promise<ApiPromise>
  - Returns the cached provider, or throws if not initialized and no RPC_URL provided.

- disconnect(): Promise<void>
  - Disconnects an active provider and clears cache.

RPC helpers (src/lib/rpc.ts)

- getBlockDetails(api, blockHash) — Decode a block and return { number, hash, parentHash, timestamp, extrinsics }.
- getBlockDetailsByNumber(api, number) — Convenience wrapper that resolves block hash and calls getBlockDetails.
- getLatestBlockDetails(api) — Gets the latest header and decodes that block.
- subscribeNewHeads(api, onBlock) — Subscribes to new headers and invokes the callback with a compact block object.
- getChainInfo(api) — Returns chain, nodeName, nodeVersion, chainType and health information.

Event helpers (src/lib/events.ts)

- ALLOWED_EVENT_SECTIONS and ALLOWED_EVENTS — allow lists used to focus on relevant event types.
- getRawEvents(api) — Get all system events at the latest block.
- filterEvents(blockNumber, events) — Filter events by allow lists and map them to a safe shape.
- getFilteredEvents(api) — Convenience wrapper (getRawEvents + filterEvents).
- getEventsByBlockHash(api, blockHash) — Read & filter events for a given block hash.

Storage & state (src/lib/query.ts and src/lib/state.ts)

- accountInfo(api, accountId) — Returns `api.query.system.account(accountId)` (raw result object).
- getBalance(api, address) — Tries `balances.freeBalance` first, falls back to `tokens.accounts` when available; returns shape { symbol, decimals, free, reserved, frozen, source }.
- getSupportedTokens(api) — Returns chain token symbols & decimals read from `api.registry`.

Metadata & introspection (src/lib/metadata.ts)

- getTokenMetadata(api) — Symbol, decimals, and existentialDeposit (if available).
- getNativeToken(api) — Returns the primary token symbol and decimals.
- getAvailablePallets(api) — Lists pallet names exposed under `api.query`, `api.tx`, and `api.consts`.
- getRpcNamespaces(api) — Lists `api.rpc` namespaces.
- getExtrinsics(api, pallet) — Returns extrinsic call names for a given pallet (throws if pallet missing in `api.tx`).
- getStorageEntries(api, pallet) — Returns storage entry names for a given pallet (throws if missing in `api.query`).

Utilities

- `src/util/BoxEm.ts` — Pretty-print helper functions used by the CLI (boxen + chalk wrappers).

## Examples (programmatic)

Basic connect and get latest block

```ts
import { connect, disconnect } from './src/lib/provider';
import { getLatestBlockDetails } from './src/lib/rpc';

async function main(){
  const api = await connect('wss://rpc.polkadot.io');
  const block = await getLatestBlockDetails(api);
  console.log('Latest block:', block.number, block.hash);
  await disconnect();
}

main().catch(console.error);
```

Fetch and filter recent events

```ts
import { connect } from './src/lib/provider';
import { getFilteredEvents } from './src/lib/events';

const api = await connect('wss://rpc.polkadot.io');
const { blockNumber, events } = await getFilteredEvents(api);
console.log(blockNumber, events);
```

Get account balance (supports multiple token systems)

```ts
import { connect } from './src/lib/provider';
import { getBalance } from './src/lib/state';

const api = await connect('wss://rpc.polkadot.io');
const balance = await getBalance(api, '12D3KooW...');
console.log(balance);
```

## Development notes & known limitations

- Some helper functions assume certain pallets exist (e.g. `balances`, `tokens`). The code checks for presence but behavior will vary by chain.
- `getLatestBlockNumber` in `events.ts` uses `api.system.number()` — prefer `api.rpc.chain.getHeader()` for portability.
- The package is currently a source-first repository (TS files under `src/`) and not published to npm; to publish, compile to JS and add an appropriate `package.json` `name`/`main`/`types` entries.

## Roadmap / next steps (recommended)

- Add a top-level `src/index.ts` to export a clean public SDK surface (re-export the useful functions).
- Add TypeScript types/exports to `package.json` for consumers.
- Add CLI packaging (bin entry) and a build pipeline to produce `dist/` ESM + CJS bundles.
- Add unit tests for `filterEvents` and small integration tests using a local dev node.
- Add a `--rpc` CLI flag to override the default endpoint.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork and branch.
2. Run `pnpm install`.
3. Run/verify CLI examples with `pnpm exec ts-node src/cli/index.ts <command>`.
4. Add tests for new logic.

## License

This repository currently does not include a LICENSE file. Add a license (MIT/Apache-2.0/etc.) before publishing publicly.

---

If you'd like, I can also:

- Add a `src/index.ts` that exports a tidy SDK surface and wire it into `package.json`.
- Add a few `src/examples/` scripts and small unit tests for events filtering.
- Fix markdownlint warnings and polish headings.

Tell me which of those you'd like and I'll implement it.