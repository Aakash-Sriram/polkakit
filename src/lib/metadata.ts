export const getTokenMetadata =(api) =>{
  return {
    symbols: api.registry.chainTokens,
    decimals: api.registry.chainDecimals,
    existentialDeposit:
      api.consts.balances?.existentialDeposit?.toString() ?? null
  };
}

export function getNativeToken(api) {
  return {
    symbol: api.registry.chainTokens?.[0] ?? "UNKNOWN",
    decimals: api.registry.chainDecimals?.[0] ?? 12
  };
}

export function getAvailablePallets(api) {
  return {
    query: Object.keys(api.query),
    tx: Object.keys(api.tx),
    consts: Object.keys(api.consts)
  };
}

export function getRpcNamespaces(api) {
  return Object.keys(api.rpc);
}

export function getExtrinsics(api, pallet) {
  if (!api.tx[pallet]) {
    throw new Error(`Pallet ${pallet} does not exist in api.tx`);
  }
  return Object.keys(api.tx[pallet]);
}

export function getStorageEntries(api, pallet) {
  if (!api.query[pallet]) {
    throw new Error(`Pallet ${pallet} does not exist in api.query`);
  }
  return Object.keys(api.query[pallet]);
}