 # Polkakit

Polkakit is a focused TypeScript SDK and CLI for Substrate-based chains (Polkadot, Kusama, and parachains). It provides small, pragmatic helpers built on top of `@polkadot/api` to reduce boilerplate for common developer tasks: connecting to a node, inspecting blocks/events, enumerating token assets, and sending simple transactions.

This README gives a concise, professional reference for each implemented module in `src/lib/` and the CLI in `src/cli/`. It documents function contracts (inputs, outputs, failure modes), examples, and recommended follow-ups for publishing and QA. Example/test scripts that ship with the repo are intentionally not documented here.

---

## Quick start

Install dependencies and run the CLI in development mode:

```bash
pnpm install
pnpm run cli -- rpc latest
```

If you prefer to call the SDK directly from TypeScript:

```ts
import { connect } from './src/lib/provider';
import { getBalance } from './src/lib/state';

const api = await connect('wss://rpc.polkadot.io');
const balance = await getBalance(api, '12D3KooW...');
console.log(balance);
```

---

## Design goals — short

- Minimal, pragmatic helpers that work across Substrate chains.
- Fail gracefully when optional pallets (e.g., ORML `tokens`, `assets`) are absent.
- Keep the CLI focused on developer inspection (not wallet features).
- Make programmatic helpers composable for higher-level tooling.

---

## Module reference (professional descriptions)

For each module below you'll find: Purpose, Contract (inputs/outputs), Behavior & failure modes, Edge cases, and a short example.

### Provider — `src/lib/provider.ts`

Purpose
- Create and reuse ApiPromise instances and provide a single place to manage connection lifecycle.

Contract
- createProvider(rpcUrl: string): Promise<ApiPromise>
  - Inputs: rpcUrl (wss/http RPC endpoint)
  - Output: fully-initialized ApiPromise (connected)
  - Errors: rejects if connection fails or handshake times out

- connect(rpcUrl: string): Promise<ApiPromise>
  - Inputs: rpcUrl (optional) — returns cached instance for the same endpoint
  - Output: cached or newly created ApiPromise
  - Errors: propagated from createProvider

- getProviderInstance(rpcUrl?: string): Promise<ApiPromise>
  - Convenience accessor; resolves to the active provider

- disconnect(): Promise<void>
  - Gracefully disconnects provider and clears cache

Behavior & failure modes
- Internally caches ApiPromise by RPC URL to avoid duplicate connections. If a provider becomes disconnected unexpectedly, callers should retry `connect` to obtain a fresh instance.

Edge cases
- Some chains limit subscriptions per connection — prefer reusing an ApiPromise instead of creating many.

Example
```ts
const api = await connect('wss://rpc.polkadot.io');
// use api
await disconnect();
```

### RPC helpers — `src/lib/rpc.ts`

Purpose
- Lightweight wrappers for common RPC operations: fetch block details (by hash or number), fetch latest block data, chain/node info, and subscribe to new heads.

Contract
- getBlockDetails(api, blockHash) => Promise<BlockDetails>
- getBlockDetailsByNumber(api, blockNumber) => Promise<BlockDetails>
- getLatestBlockDetails(api) => Promise<BlockDetails>
- subscribeNewHeads(api, onBlock: (header) => void) => unsubscribeFn
- getChainInfo(api) => Promise<ChainInfo>

Behavior & failure modes
- These functions make explicit RPC calls and convert polkadot-js types into small plain objects. They reject on underlying RPC failures. Long-running subscriptions may raise errors if the connection drops — handlers should be prepared to resubscribe.

Edge cases
- Light clients or specialized parachains may not expose the full set of RPCs; callers should handle missing fields.

Example
```ts
const latest = await getLatestBlockDetails(api);
console.log(latest.number, latest.hash);
const unsub = await subscribeNewHeads(api, header => console.log('new', header.number.toString()));
// later: unsub();
```

### Events — `src/lib/events.ts`

Purpose
- Read, filter, and present on-chain events with an allow-list to reduce noise (e.g., system/pallet events are filtered to focus on developer-relevant notifications).

Contract
- getRawEvents(api): Promise<RawEvent[]>
- filterEvents(blockNumber: number, events: RawEvent[]): FilteredEvent[]
- getFilteredEvents(api): Promise<FilteredEvent[]>
- getEventsByBlockHash(api, blockHash): Promise<FilteredEvent[]>

Behavior & failure modes
- The module reads `api.query.system.events` and maps events. Filtering is deterministic based on `ALLOWED_EVENT_SECTIONS`/`ALLOWED_EVENTS`. If an event's metadata cannot be decoded, the event is returned with minimal information and a `decodeError` flag.

Edge cases
- Events may include chain-specific custom events; these are ignored unless added to allow-lists. Reorganization: the block that contained an event might be retracted — event readers only reflect the current finalized/head data fetched from the node.

Example
```ts
const events = await getFilteredEvents(api);
events.forEach(e => console.log(e.section, e.method, e.data));
```

### State & asset helpers — `src/lib/state.ts`

Purpose
- Read balances and enumerate token assets from common pallets (native balances, ORML `tokens`, and the `assets` pallet). Provide a single aggregated view of an account's assets.

Contract
- getBalance(api, address): Promise<BalanceInfo>
- getSupportedTokens(api): Promise<TokenDefinition[]>
- getAllOrmlTokens(api, address): Promise<AssetBalance[]>
- getAllPalletAssets(api, address): Promise<AssetBalance[]>
- getPortfolio(api, address): Promise<{ native: BalanceInfo, orml: AssetBalance[], assets: AssetBalance[] }>

Behavior & failure modes
- Each reader first detects whether the expected pallet exists (`api.query.tokens`, `api.query.assets`) and then enumerates token metadata before reading balances. If a pallet is missing, the function returns an empty list for that category rather than throwing.

Edge cases
- Token metadata may include decimals and symbol; when decimals are missing, callers must treat values as raw plancks and format carefully.

Example
```ts
const all = await getAllAssets(api, address);
console.log('native', all.native.free);
console.table(all.orml);
```

### Transactions — `src/lib/transactions.ts`

Purpose
- Provide a minimal, explicit helper to sign and submit a Balances transfer and return a clear, decoded result. Intended for developer tooling and examples (not a wallet implementation).

Contract
- sendTransfer(api, senderKeypair, to: string, amount: bigint): Promise<SubmitResult>
  - Resolves with inclusion result (blockHash, events) on success
  - Rejects with decoded module error for `ExtrinsicFailed` events

Behavior & failure modes
- Uses `transferAllowDeath` to submit an extrinsic. Subscribes to status updates and inspects emitted events. If an `ExtrinsicFailed` is observed, the helper attempts to decode the module error using `api.registry.findMetaError` to present a human-friendly error message. If decoding fails, it returns the raw error indices.

Security
- This helper expects a keypair (KeyringPair) to be provided by the caller. Do not embed mnemonics or private keys in production code. Use external signers for production.

Example
```ts
const result = await sendTransfer(api, aliceKeypair, bobAddress, 1_000_000_000n);
console.log('included in', result.blockHash);
```

### Metadata — `src/lib/metadata.ts`

Purpose
- Introspect runtime metadata: discover pallets, available storage keys, extrinsics, and RPC namespaces. Helpful for tooling that adapts to different runtimes.

Contract
- getTokenMetadata(api): Promise<TokenMetadata>
- getNativeToken(api): Promise<{ symbol: string, decimals: number }>
- getAvailablePallets(api): Promise<{ query: string[], tx: string[], consts: string[] }>
- getRpcNamespaces(api): Promise<string[]>
- getExtrinsics(api, pallet): Promise<string[]>
- getStorageEntries(api, pallet): Promise<string[]>

Behavior & failure modes
- Uses `api.registry` and `api.runtimeMetadata` to extract metadata. If requested pallets or entries are absent, functions return empty arrays rather than throwing.

Example
```ts
const pallets = await getAvailablePallets(api);
console.log('query pallets', pallets.query);
```

### Utilities — `src/util/BoxEm.ts`

Purpose
- Small CLI pretty-printer used by CLI commands to display results in a consistent boxed layout (uses `boxen` + `chalk`).

Contract
- prettyBox(title: string, fields: Record<string, any>): void

Behavior
- Formats values as strings and prints to stdout. It is a presentation helper only — logic remains in `src/lib/`.

Example
```ts
prettyBox('Account', { Address: addr, Free: '123.4 DOT' });
```

---

## CLI reference (developer-focused)

The CLI is intentionally lightweight and intended for developer inspection. It exposes two primary groups: `rpc` and `query`.

- `rpc watch` — subscribe and pretty-print new blocks (summary + events)
- `rpc block <hash|number>` — fetch detailed block information
- `rpc latest` — get latest block details
- `rpc chain-info` — show node version and chain spec
- `query account-info <address>` — show nonce and balance summary
- `query events [-b, --block <hash>]` — show filtered events for the latest or specified block

CLI notes
- Default RPC: `wss://rpc.polkadot.io`. The CLI is developer-focused; for production workflow embed or pass a secure signer.

---

## Error handling, failure modes, and edge cases (professional notes)

- Network / RPC failures: All operations that call the node may reject due to network errors, connection timeouts, or node rate-limits. Caller strategies: retry with backoff, reuse ApiPromise across calls, and keep subscriptions to a minimum.
- Missing pallets: Functions that enumerate `tokens` or `assets` return empty arrays when the pallet is absent. This is intentional — the SDK should not throw for optional pallet absence.
- Re-orgs: Event readers reflect the node's current reported state. Be aware of temporary re-orgs which can cause an event/tx to disappear from a subsequent query. Rely on finalized blocks where necessary.
- Decoding errors: When decoding module errors (transaction failures), the library tries to map (index, error) to metadata via `api.registry.findMetaError`. If decoding fails, the raw error indices are returned for debugging.

---

## Security guidance

- Never hard-code private keys or mnemonics. The provided `transactions` helper is for examples and developer tooling only.
- Use browser/hardware/external signers for mainnet signing.
- Validate RPC endpoints and consider TLS (wss) and private RPC nodes for sensitive tooling.

---

## Quality gates & publishing checklist

Before publishing a package or using this SDK in production, ensure the following:

1. Build: run the TypeScript build (tsup/tsc) and confirm there are no compile errors.
2. Lint/format: run project linters (eslint, prettier) and fix issues.
3. Tests: add unit tests for critical logic (event filtering, error decoding). Run tests and ensure passing.
4. Types & exports: Add `src/index.ts` that re-exports the public surface and update `package.json` `main`/`types` to point to compiled outputs.
5. License: add a LICENSE file and include it in the package.

I can implement step 4 (export surface + package.json wiring) on request.

---

## Roadmap & suggested next steps

- Add `src/index.ts` with a minimal, typed public surface that re-exports stable helpers.
- Add a `--rpc` CLI flag and a secure `tx send` helper that supports external signers.
- Add unit tests and a CI workflow that runs lint/build/tests on PRs.
- Polish docs: examples, API reference (automatically generated from JSDoc or TypeDoc), and release notes.

---

## Contributing

Contributions welcome. Typical workflow:

1. Fork and create a feature branch.
2. Run `pnpm install`.
3. Implement changes, add unit tests for new logic.
4. Run `pnpm test` and `pnpm lint` locally.
5. Open a PR with a clear description and tests.

---

## License

Add a LICENSE file (MIT/Apache-2.0) before publishing.

# Polkakit

Lightweight TypeScript SDK and CLI for Substrate-based chains (Polkadot, Kusama, parachains).

## Install
npm install polkakit

This README documents the public SDK helpers in `src/lib/` and the CLI in `src/cli/`.
Development/example scripts under `src/test/` exist but are intentionally not documented here.

---

## Quick start

Install dependencies:

```bash
pnpm install
```

Run the CLI (developer mode):

```bash
pnpm run cli -- rpc latest
pnpm run cli -- rpc watch
pnpm run cli -- query account-info ADDRESS_HERE
pnpm run cli -- query events
```

---

## Implemented modules (summary)

All primary helpers live under `src/lib/`.

Provider helpers (`src/lib/provider.ts`)

```ts
createProvider(rpcUrl: string): Promise<ApiPromise>
connect(rpcUrl: string): Promise<ApiPromise>
getProviderInstance(rpcUrl?: string): Promise<ApiPromise>
disconnect(): Promise<void>
```

RPC helpers (`src/lib/rpc.ts`)

```ts
getBlockDetails(api, blockHash)
getBlockDetailsByNumber(api, number)
getLatestBlockDetails(api)
subscribeNewHeads(api, onBlock)
getChainInfo(api)
```

Event helpers (`src/lib/events.ts`)

```ts
getRawEvents(api)
filterEvents(blockNumber, events)
getFilteredEvents(api)
getEventsByBlockHash(api, blockHash)
```

State & asset helpers (`src/lib/state.ts`)

```ts
getBalance(api, address)
getSupportedTokens(api)
getAllOrmlTokens(api, address)
getAllPalletAssets(api, address)
getAllAssets(api, address)
```

Transactions helpers (`src/lib/transactions.ts`)

```ts
sendTransfer(api, sender, to, amount) // signs and submits balances.transferAllowDeath
```

Metadata helpers (`src/lib/metadata.ts`)

```ts
getTokenMetadata(api)
getNativeToken(api)
getAvailablePallets(api)
getRpcNamespaces(api)
getExtrinsics(api, pallet)
getStorageEntries(api, pallet)
```

## Utilities

Single CLI pretty-printer (`src/util/BoxEm.ts`):

```ts
prettyBox(title: string, fields: Record<string, any>)
```

## CLI overview

Key commands (see `src/cli/`):

- `rpc watch` — stream new blocks and pretty-print summaries
- `rpc block <hash|number>` — fetch and print block details
- `rpc latest` — print latest block details
- `rpc chain-info` — show chain and node info
- `query account-info <address>` — print account info (nonce, balances)
- `query events [-b, --block <hash>]` — show filtered system events

Default endpoint: `wss://rpc.polkadot.io` (you can target other endpoints by calling the SDK directly).

## Security and usage notes

- `sendTransfer` demonstrates signing and sending a balance transfer using a Keyring pair — suitable for development only. For production, use secure external signers (extension, hardware wallet, or remote signer).
- Helpers try to detect runtime pallets (balances, tokens, assets) and return sensible defaults when absent, but behavior varies by chain.

## Suggested finalization steps

1. Add a LICENSE file.
2. Add `src/index.ts` to export a public SDK surface and update `package.json` `main`/`types` for the compiled build.
3. Add unit tests (for example, for `filterEvents`) and CI.
4. Add a CLI `--rpc` option to override the default endpoint at runtime.
5. Build and publish compiled artifacts (ESM + CJS).

I can implement step 2 (public SDK entry) and optionally add a safe `tx send` CLI command if you want.

---

## Contributing

Fork, run `pnpm install`, use the CLI for manual checks, and submit PRs with tests.

## License

Add a LICENSE file before publishing.
# Polkakit

Lightweight TypeScript SDK and CLI for Substrate chains (Polkadot, Kusama, parachains).

This README documents the library surface in `src/lib/` and the CLI in `src/cli/`. Development-only test/example scripts exist in the repository but are intentionally omitted from this documentation.

---

## Quick start

Install dependencies:

```bash
pnpm install
```

Run the CLI (developer mode):

```bash
pnpm run cli -- rpc latest
pnpm run cli -- rpc watch
pnpm run cli -- query account-info ADDRESS_HERE
pnpm run cli -- query events
```

---

## Implemented modules (summary)

All primary helpers live under `src/lib/`.

Provider helpers (src/lib/provider.ts):

```ts
createProvider(rpcUrl: string): Promise<ApiPromise>
connect(rpcUrl: string): Promise<ApiPromise>
getProviderInstance(rpcUrl?: string): Promise<ApiPromise>
disconnect(): Promise<void>
```

RPC helpers (src/lib/rpc.ts):

```ts
getBlockDetails(api, blockHash)
getBlockDetailsByNumber(api, number)
getLatestBlockDetails(api)
subscribeNewHeads(api, onBlock)
getChainInfo(api)
```

Event helpers (src/lib/events.ts):

```ts
getRawEvents(api)
filterEvents(blockNumber, events)
getFilteredEvents(api)
getEventsByBlockHash(api, blockHash)
```

State & asset helpers (src/lib/state.ts):
# Polkakit

Lightweight TypeScript SDK and CLI for Substrate-based chains (Polkadot, Kusama, parachains).

This README documents the public SDK helpers in `src/lib/` and the CLI in `src/cli/`. Development/example scripts in `src/test/` are present in the repo but are intentionally not documented here.

---

## Quick start

Install dependencies:

```bash
pnpm install
```

Run the CLI (developer mode):

```bash
pnpm run cli -- rpc latest
pnpm run cli -- rpc watch
pnpm run cli -- query account-info ADDRESS_HERE
pnpm run cli -- query events
```

---

## Implemented modules (summary)

All primary helpers live under `src/lib/`.

Provider helpers (`src/lib/provider.ts`)

```ts
createProvider(rpcUrl: string): Promise<ApiPromise>
connect(rpcUrl: string): Promise<ApiPromise>
getProviderInstance(rpcUrl?: string): Promise<ApiPromise>
disconnect(): Promise<void>
```

RPC helpers (`src/lib/rpc.ts`)

```ts
getBlockDetails(api, blockHash)
getBlockDetailsByNumber(api, number)
getLatestBlockDetails(api)
subscribeNewHeads(api, onBlock)
getChainInfo(api)
```

Event helpers (`src/lib/events.ts`)

```ts
getRawEvents(api)
filterEvents(blockNumber, events)
getFilteredEvents(api)
getEventsByBlockHash(api, blockHash)
```

State & asset helpers (`src/lib/state.ts`)

```ts
getBalance(api, address)
getSupportedTokens(api)
getAllOrmlTokens(api, address)
getAllPalletAssets(api, address)
getAllAssets(api, address)
```

Transactions helpers (`src/lib/transactions.ts`)

```ts
sendTransfer(api, sender, to, amount) // signs and submits balances.transferAllowDeath
```

Metadata helpers (`src/lib/metadata.ts`)

```ts
getTokenMetadata(api)
getNativeToken(api)
getAvailablePallets(api)
getRpcNamespaces(api)
getExtrinsics(api, pallet)
getStorageEntries(api, pallet)
```

## Utilities

Single CLI pretty-printer (`src/util/BoxEm.ts`):

```ts
prettyBox(title: string, fields: Record<string, any>)
```

## CLI overview

Key commands (see `src/cli/`):

- `rpc watch` — stream new blocks and pretty-print summaries
- `rpc block <hash|number>` — fetch and print block details
- `rpc latest` — print latest block details
- `rpc chain-info` — show chain and node info
- `query account-info <address>` — print account info (nonce, balances)
- `query events [-b, --block <hash>]` — show filtered system events

Default endpoint: `wss://rpc.polkadot.io` (you can target other endpoints by calling the SDK directly).

## Security and usage notes

- `sendTransfer` demonstrates signing and sending a balance transfer using a Keyring pair — suitable for development only. For production, use secure external signers (extension, hardware wallet, or remote signer).
- Helpers attempt to detect runtime pallets (balances, tokens, assets) and return sensible defaults when absent, but behavior varies by chain.

## Suggested finalization steps

1. Add a LICENSE file.
2. Add `src/index.ts` to export a public SDK surface and update `package.json` `main`/`types` for the compiled build.
3. Add unit tests (for example, for `filterEvents`) and CI.
4. Add a CLI `--rpc` option to override the default endpoint at runtime.
5. Build and publish compiled artifacts (ESM + CJS).

I can implement step 2 (public SDK entry) and optionally add a safe `tx send` CLI command if you want.

---

## Contributing

Fork, run `pnpm install`, use the CLI for manual checks, and submit PRs with tests.

## License

Add a LICENSE file before publishing.


Example usage in your code:

```ts
import { prettyBox } from './src/util/BoxEm';

prettyBox('Account Info', {
  Address: '5Gw...QY',
  Nonce: 3,
  Free: '123.456 DOT'
});
```

## Transactions helpers (src/lib/transactions.ts)

This module contains helpers to construct, sign and submit extrinsics. Currently implemented:

- `sendTransfer(api, sender, to, amount)` — signs and submits a balances transfer (uses `transferAllowDeath`) and returns a Promise that resolves when the transaction is included in a block. The helper inspects events to detect `ExtrinsicFailed` and decodes module errors via `api.registry.findMetaError` to produce a readable error message.

Usage example (programmatic):

```ts
import { Keyring } from '@polkadot/keyring';
import { connect } from './src/lib/provider';
import { sendTransfer } from './src/lib/transactions';

const api = await connect('wss://rpc.polkadot.io');
const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice'); // dev-only

const res = await sendTransfer(api, alice, '5F3sa2TJ...', 1_000_000_000_000n);
console.log('Transfer result:', res);
```

Security note: Do not hard-code private keys/mnemonics for mainnet usage — use secure signers (browser extension, hardware) in production.

## CLI commands

- `rpc watch` — subscribe and pretty-print new blocks
- `rpc block <hash|number>` — fetch block details
- `rpc latest` — fetch the latest block
- `rpc chain-info` — fetch chain and node info
- `query account-info <accountId>` — display account nonce and balances
- `query events [-b, --block <hash>]` — display filtered events for latest block or a specific block

Default RPC endpoint in the CLI is `wss://rpc.polkadot.io`. Use the SDK directly to target alternate endpoints.

## Tests & examples

Run the example scripts with:

```bash
pnpm run test:state
pnpm run test:metadata
```

These exercise balance and asset readers (including ORML and Assets pallet enumeration) and metadata introspection.

## Notes & recommended fixes

- Some helpers depend on runtime pallets (`balances`, `tokens`, `assets`). The library checks for their presence and returns sensible defaults when missing.
- `events.ts` portability: prefer using `api.rpc.chain.getHeader()` for latest block information where appropriate.

## Contributing

Contributions welcome. Typical workflow:

1. Fork and branch.
2. Run `pnpm install`.
3. Test with `pnpm run cli` or the test scripts.
4. Add unit tests for new logic.

## License

Add a LICENSE file before publishing. The repository does not currently include a license.

---

If you want, I can:

- add `src/index.ts` to export a minimal public SDK surface,
- add a `--rpc` flag to CLI commands,
- implement unit tests for `filterEvents` and add CI.

Tell me which and I will implement it.


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
# Polkakit — A Lightweight Polkadot SDK + CLI

Polkakit is a developer-focused TypeScript toolkit and CLI built on top of `@polkadot/api`. It reduces boilerplate for common Polkadot developer tasks and provides:

- A small SDK under `src/lib/` with helpers for connecting, querying, and decoding chain state.
- A CLI under `src/cli/` exposing useful commands for exploring blocks, events, and accounts.

This README reflects the code currently implemented in the repository (provider helpers, RPC helpers, event filtering, balance and asset helpers, metadata introspection, and CLI commands).

## Table of contents

- Features implemented
- Installation
- CLI usage (examples)
- Programmatic API (detailed)
- Tests and example scripts
- Internals and file map
- Roadmap and contributing

## Features implemented

- Provider management with caching and graceful disconnects.
- RPC helpers: fetch block details (by hash or number), get latest block, subscribe to new heads, get chain/node info.
- Event helpers: read raw events, filter events by allow-list, and query events by block hash.
- Storage & state helpers: fetch account info and balances; support for ORML Tokens and Assets pallet.
- Metadata introspection: list pallets, extrinsics and storage entries, and discover RPC namespaces.
- CLI: `rpc` and `query` groups with subcommands for common developer tasks.

## Installation

Install project dependencies:

```bash
pnpm install
```

Run CLI commands directly with `ts-node` (developer mode):

```bash
pnpm exec ts-node src/cli/index.ts rpc latest
pnpm exec ts-node src/cli/index.ts rpc watch
pnpm exec ts-node src/cli/index.ts query account-info <ADDRESS>
pnpm exec ts-node src/cli/index.ts query events
```

You can also run the test/example scripts under `src/test/` with `ts-node`.

## CLI usage (available commands)

- `rpc watch` — subscribe and pretty-print new blocks
- `rpc block <hash|number>` — fetch block details
- `rpc latest` — fetch the latest block
- `rpc chain-info` — fetch chain and node info
- `query account-info <accountId>` — display account nonce and balances
- `query events [-b, --block <hash>]` — display filtered events for latest block or a specific block

By default the CLI connects to `wss://rpc.polkadot.io`; you can change this by calling the SDK functions directly.

## Programmatic API (detailed)

All SDK helpers are implemented in `src/lib/`. Below is a summary of the available functions and behaviors.

Provider helpers (`src/lib/provider.ts`)

```ts
// Creates a new ApiPromise connected to the given RPC URL
createProvider(RPC_URL: string): Promise<ApiPromise>

// Returns a cached ApiPromise if already connected to the same endpoint
connect(RPC_URL: string): Promise<ApiPromise>

// Returns cached provider or creates one if RPC_URL supplied
getProviderInstance(RPC_URL?: string): Promise<ApiPromise>

// Disconnect and clear cache
disconnect(): Promise<void>
```

RPC helpers (`src/lib/rpc.ts`)

```ts
getBlockDetails(api, blockHash) // -> { number, hash, parentHash, timestamp, extrinsics }
getBlockDetailsByNumber(api, number)
getLatestBlockDetails(api)
subscribeNewHeads(api, onBlock)
getChainInfo(api)
```

Event helpers (`src/lib/events.ts`)

- `ALLOWED_EVENT_SECTIONS` and `ALLOWED_EVENTS` — lists used to filter noisy events and focus on relevant ones.
- `getRawEvents(api)` — returns all system events at the latest block.
- `filterEvents(blockNumber, events)` — filters and maps events into a compact shape.
- `getFilteredEvents(api)` — convenience wrapper: getRawEvents + filter.
- `getEventsByBlockHash(api, blockHash)` — returns filtered events for a specific block hash.

Storage & state helpers (`src/lib/state.ts`)

Key functions:

```ts
getBalance(api, address) // reads balances or tokens accounts, returns { symbol, decimals, free, reserved, frozen, source }
getSupportedTokens(api) // reads api.registry.chainTokens and chainDecimals
getAllOrmlTokens(api, address) // enumerates ORML tokens via api.query.tokens.metadata and reads balances
getAllPalletAssets(api, address) // enumerates assets in the Assets pallet and reads account balances
getAllAssets(api, address) // aggregates native, orml and assets-pallet balances into one object
```

Notes:
- `getAllOrmlTokens` will return an empty array if the ORML `tokens` pallet is not present.
- `getAllPalletAssets` will return an empty array if the `assets` pallet is not available.

Metadata helpers (`src/lib/metadata.ts`)

```ts
getTokenMetadata(api) // symbols, decimals, existentialDeposit
getNativeToken(api) // primary symbol and decimals
getAvailablePallets(api) // lists for query/tx/consts
getRpcNamespaces(api) // Object.keys(api.rpc)
getExtrinsics(api, pallet) // list call names for a pallet
getStorageEntries(api, pallet) // list storage entries for a pallet
```

Utilities (`src/util/BoxEm.ts`)

- A single universal pretty-printer used by the CLI:

```ts
prettyBox(title: string, fields: Record<string, any>)
```

This `prettyBox` function formats a titled box of labeled fields (uses `boxen` + `chalk`) and is the single entry point for CLI pretty printing.

## Tests and example scripts

There are several small scripts under `src/test/` that demonstrate and exercise features. Run them with `ts-node`.

- `src/test/metadata.ts` — prints token metadata, native token, available pallets, rpc namespaces, storage entries and extrinsics for balances.
- `src/test/state.ts` — exercises balance and asset readers including ORML tokens and Assets pallet; it calls:

  - `getBalance`
  - `getSupportedTokens`
  - `getAllOrmlTokens`
  - `getAllPalletAssets`
  - `getAllAssets`

Run an example test script:

```bash
pnpm exec ts-node src/test/state.ts
pnpm exec ts-node src/test/metadata.ts
```

## Internals & file map

- `src/cli/` — commander-based CLI (`index.ts`, `rpc.ts`, `query.ts`).
- `src/lib/` — SDK helpers (`provider.ts`, `rpc.ts`, `events.ts`, `query.ts`, `state.ts`, `metadata.ts`).
- `src/util/` — CLI pretty printers (`BoxEm.ts`).
- `src/test/` — small example/test scripts for manual verification.

## Known issues and notes

- Some helpers make runtime assumptions (presence of `balances`, `tokens`, or `assets` pallets). The code attempts to detect presence, but behavior will vary by chain.
- `getLatestBlockNumber` in `events.ts` previously used `api.system.number()` which may not exist on all chains — prefer `api.rpc.chain.getHeader()` for portability.
- The repo is source-first (TypeScript under `src/`) — publishing to npm requires building to JS and adding appropriate `package.json` `main`/`types` entries.

## Roadmap / suggested next steps

- Add a `src/index.ts` that exports a clean public SDK surface for consumers.
- Add a `--rpc` flag to the CLI to override the default RPC endpoint.
- Add unit tests for `filterEvents` and CI to run them.
- Publish compiled packages to npm with proper `name` (`polkakit`) and `types`.

## Contributing

Contributions welcome — please run `pnpm install`, exercise the CLI with `ts-node` and add tests for new logic.

## License

Add a LICENSE file before publishing. The repository currently has no license declared.

---

If you want, I can now:

- Add `src/index.ts` and wire `package.json` for publishing.
- Add example scripts under `src/examples/` and unit tests for `filterEvents`.
- Add a `--rpc` option to the CLI.

Tell me which you'd like and I'll implement it.

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