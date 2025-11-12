## dotcli — Polkadot API namespace guide

This repository contains small CLI utilities that use @polkadot/api. The file `src/find.ts` enumerates several top-level API namespaces you get when connecting to a node:

- api.rpc
- api.query
- api.tx
- api.events
- api.consts

This README documents what each namespace is, typical usage patterns, and short TypeScript examples you can run locally.

Prerequisites
- Node.js (16+ recommended)
- pnpm (the project uses pnpm lock, but npm/yarn also work)

Install dependencies

```bash
pnpm install
# or (if you don't have pnpm): npm install
```

Run the example file (`src/find.ts`) with ts-node

```bash
pnpm exec ts-node src/find.ts
# or using npx: npx ts-node src/find.ts
```

Notes about the code samples
- All samples below assume you have `@polkadot/api` installed and imported as shown in `src/find.ts`.
- For transaction signing examples we use `@polkadot/keyring` in examples; when interacting with mainnet use a proper signer (web extension, ledger, or injected signer) and never hard-code private keys in source.

## Quick contract: inputs/outputs and success criteria

- Inputs: a connected ApiPromise instance (api)
- Outputs: values returned by node (headers, storage, events, constants, transaction results)
- Success: examples run without throw (after installing deps) and the snippets show how to discover available pallets and calls.

## 1) api.rpc — RPC methods

What it is
- `api.rpc` exposes the node's remote procedure call (RPC) surface. These are low-level node methods (chain, system, state, author, offchain, etc.).

When to use
- When you need chain-level operations that are not part of a high-level runtime pallet API, e.g. subscribe to new heads, get runtime version, fetch raw blocks or block hashes, perform node-specific debug operations.

Common methods
- `api.rpc.chain.getHeader()` — get latest header
- `api.rpc.chain.getBlock(hash?)` — fetch a block
- `api.rpc.chain.getBlockHash(number?)` — get a block hash
- `api.rpc.chain.subscribeNewHeads(cb)` — stream new headers
- `api.rpc.system.health()` — node health

Example

```ts
const header = await api.rpc.chain.getHeader();
console.log(`block #${header.number}`);

// Subscribe to new heads
const unsub = await api.rpc.chain.subscribeNewHeads((newHeader) => {
	console.log('new block:', newHeader.number.toString());
	// optionally call unsub() when done
});

// Low-level calls: e.g. system health
const health = await api.rpc.system.health();
console.log('node health:', health);
```

How to discover available RPC groups

```ts
console.log(Object.keys(api.rpc)); // e.g. ['chain','system','author','state', ...]
console.log(Object.keys(api.rpc.chain)); // methods under chain
```

## 2) api.query — on-chain storage queries

What it is
- `api.query` gives access to the runtime storage of pallets. Each pallet becomes a namespace with properties for its storage entries (maps, values, double maps).

When to use
- To read chain state: account balances, staking info, runtime-specific storage values.

Common patterns
- Read a simple value: `await api.query.system.account(accountId)`
- Read a map entry: `await api.query.balances.freeBalance(accountId)` (runtime dependent)
- Subscribe to changes: `api.query.system.account(accountId, (account) => { ... })`
- Use `.at(blockHash)` to query historic state at a given block

Examples

```ts
// single read
const info = await api.query.system.account(ALICE_ADDRESS);
console.log('nonce/balance:', info.nonce.toString(), info.data.free.toString());

// subscription
const unsubscribe = await api.query.system.account(ALICE_ADDRESS, (acct) => {
	console.log('updated account data', acct.toHuman());
});

// query entries / iterate keys
const entries = await api.query.staking.erasStakers.entries(ERA_INDEX);
entries.forEach(([storageKey, exposure]) => {
	// storageKey.args gives the key parts, exposure is the value
});

// read state at a historic block
const blockHash = await api.rpc.chain.getBlockHash(1000);
const historic = await api.query.system.account.at(blockHash, SOME_ADDRESS);
```

How to discover what's available

```ts
console.log(Object.keys(api.query)); // lists pallets
console.log(Object.keys(api.query.balances)); // lists storage methods for balances
```

## 3) api.tx — extrinsics / transactions

What it is
- `api.tx` is the runtime's callable extrinsics grouped by pallet. Use these to construct, sign and submit transactions.

When to use
- To send funds, call pallet methods, vote, stake, or any state-changing operation.

Common patterns
- Construct: `api.tx.balances.transfer(dest, amount)`
- Estimate fee: `await tx.paymentInfo(signerAddress)`
- Sign & send: `await tx.signAndSend(signer)` (or `tx.sign(pair)` + `tx.send()`)

Example (using Keyring for local dev)

```ts
import { Keyring } from '@polkadot/keyring';

const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice'); // dev account only

const tx = api.tx.balances.transfer(DEST_ADDRESS, 1_000_000_000_000n);
const info = await tx.paymentInfo(alice.address);
console.log('fee estimate:', info.partialFee.toString());

const unsub = await tx.signAndSend(alice, (result) => {
	console.log('status', result.status.toString());
	if (result.status.isInBlock || result.status.isFinalized) {
		console.log('included at', result.status.toString());
		unsub();
	}
});
```

Notes about signers
- On a local dev chain you can use keyring pairs from mnemonics like `//Alice`. On real networks use secure signers (browser extension, external signer) and never check in secrets.

## 4) api.events / system events

What it is
- `api.events` lists the event types that can be emitted by runtime pallets. To read events you typically subscribe to the system events storage.

When to use
- Track on-chain events such as Transfers, Staking events, Bounties, etc.

Example: subscribe to events

```ts
// subscribe to system events (fired each block)
const unsubscribeEvents = await api.query.system.events((events) => {
	console.log(`received ${events.length} events`);
	events.forEach(({ event, phase }) => {
		const types = event.typeDef;
		console.log(event.section, event.method, event.meta.documentation.join(' '), event.data.toString());
	});
});

// when done: unsubscribeEvents();
```

How to discover available event types

```ts
console.log(Object.keys(api.events));
```

## 5) api.consts — runtime constants

What it is
- `api.consts` contains chain/runtime constants (fixed values baked into runtime) grouped by pallet.

When to use
- To read changeable-but-constant configuration such as existential deposit, block weights, bonding durations, etc.

Example

```ts
console.log('existential deposit:', api.consts.balances.existentialDeposit.toString());
console.log('max block weight (human):', api.consts.system.blockWeights?.toHuman());
```

How to discover constants

```ts
console.log(Object.keys(api.consts)); // pallet names
console.log(Object.keys(api.consts.balances)); // constants in balances pallet
```

## Tips for exploring the API (discovery)

- Use `Object.keys(api.query)`, `Object.keys(api.tx)`, `Object.keys(api.events)`, `Object.keys(api.consts)` to list available pallets.
- For a given pallet, check `Object.keys(api.tx.palletName)` or `Object.keys(api.query.palletName)` to see available calls/storage.
- The Polkadot API registry and metadata are accessible as `api.registry` and `api.runtimeVersion`.
- Use `api.createType` to construct types when you need low-level interactions.

## Safety and network notes

- Examples that sign transactions use developer keys (like `//Alice`) only on local/dev nodes. Do not use these on mainnet.
- When talking to public endpoints (e.g., `wss://rpc.polkadot.io`) be mindful of rate limits and avoid spamming transactions.

## Next steps / small improvements you might want

- Add example scripts that demonstrate one-shot reads and a transaction flow in `src/examples/`.
- Add tests that verify basic API connectivity using a mocked provider.

## Summary

Updated README: describes the purpose of the main Polkadot JS API namespaces (`api.rpc`, `api.query`, `api.tx`, `api.events`, `api.consts`) with practical usage examples. Try running `pnpm exec ts-node src/find.ts` to see the enumerated namespaces from `src/find.ts` and use the examples above to fetch headers, query storage, or construct transactions.
