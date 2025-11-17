import { ApiPromise } from "@polkadot/api";
export const getBalance = async (api: ApiPromise, address: string) =>{
    const tokens = api.registry.chainTokens || ['UNIT'];
    const decimals = api.registry.chainDecimals || [12];

    const symbol = tokens[0];
    const decimal = decimals[0];

    const hasBalance = api.query.balances && api.query.balances.freeBalance;
    const hasTokens = api.query.tokens && api.query.tokens.accounts;

if (hasBalance) {
    const info = await api.query.system.account(address);
    const jsonInfo = info.toJSON() as any;
    const { data } = jsonInfo;
    const { free, reserved, frozen, flags } = data.toHuman();
    return {
      symbol,
      decimals: decimal,
      free,
      reserved,
      frozen,
      flags,
      source: "balances"
    };
  }

  if (hasTokens) {
    try {
        const assetMeta = { Token: symbol }; // generic guess
        const tokenInfo = await api.query.tokens.accounts(address, assetMeta);
        const JsonInfo  = tokenInfo.toJSON() as any;
        const {tokenData} = JsonInfo;
      return {
        symbol,
        decimals: decimal,
        free: tokenData.free.toString(),
        reserved: tokenData.reserved.toString(),
        frozen: tokenData.frozen.toString(),
        source: "tokens"
      };
    } catch {
        throw new Error("Failed to fetch balance from tokens pallet");
    }
  }

  return {
    symbol,
    decimals: decimal,
    free: "0",
    reserved: "0",
    frozen: "0",
    source: "none"
  };
}
