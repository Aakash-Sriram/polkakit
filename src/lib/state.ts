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
    const { free, reserved, frozen, flags } = data;
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
      return {
        symbol,
        decimals: decimal,
        free: JsonInfo.free?.toString() ?? "0",
        reserved: JsonInfo.reserved?.toString() ?? "0",
        frozen: JsonInfo.frozen?.toString() ?? "0",
        source: "tokens"
      };
    } catch {
        throw new Error("Failed to fetch balance from tokens pallet");
    }
  }

  else{
        return {
            symbol,
            decimals: decimal,
            free: "0",
            reserved: "0",
            frozen: "0",
            source: "none"
        };
  }
}

export const getSupportedTokens = (api: ApiPromise) => {
  const symbols = api.registry.chainTokens || ["UNIT"];
  const decimals = api.registry.chainDecimals || [12];
  return symbols.map((symbol, i) => ({
    symbol,
    decimals: decimals[i] ?? decimals[0],
  }));
};

export const getAllOrmlTokens = async (api: ApiPromise,address:string) => {
    if(!api.query.tokens || !api.query.tokens.accounts)return[];
    try {
        const entries = await api.query.tokens.metadata.entries();
        const tokens = await Promise.all(
            entries.map(async ([key, value]) => {
                const [assetKey] = key.args;
                const metaData = value.toJSON() as any;
                const balance = await api.query.tokens.accounts(address, assetKey);
                const jsonBal = balance.toJSON() as any;
                return{
                    id: assetKey.toString(),
                    name: metaData.name || "Unknown",
                    symbol: metaData.symbol || "UNK",
                    decimals: metaData.decimals || 12,
                    free: jsonBal?.free?.toString() ?? "0",
                    reserved: jsonBal?.reserved?.toString() ?? "0",
                    frozen: jsonBal?.frozen?.toString() ?? "0",
                    source: "orml"  
                };
            })
        );
        return tokens;
    }
    catch(error:any){
        console.error("Failed to fetch ORML tokens:", error?.message);
        return [];
    }
}

export const getAllPalletAssets = async (api: ApiPromise, address: string) => {
  if (!api.query.assets || !api.query.assets.metadata) return [];

  try {
    const entries = await api.query.assets.metadata.entries();
    const assets = await Promise.all(
      entries.map(async ([key, meta]) => {
        const [assetId] = key.args;
        const metadata = meta.toJSON() as any;
        const account = await api.query.assets.account(assetId, address);
        const accJSON = account.toJSON() as any;
        return {
          id: assetId.toString(),
          symbol: metadata.symbol || "ASSET",
          name: metadata.name || "Asset",
          decimals: metadata.decimals || 12,
          free: accJSON?.balance?.toString() ?? "0",
          frozen: accJSON?.frozen?.toString() ?? "0",
          reserved: accJSON?.reserved?.toString() ?? "0",
          source: "assets-pallet"
        };
      })
    );

    return assets;
  } catch (err) {
    console.error("Failed to fetch Assets pallet:", err);
    return [];
  }
};

export const getAllAssets = async (api: ApiPromise, address: string) => {
  const native = await getBalance(api, address);
  const orml = await getAllOrmlTokens(api, address);
  const palletAssets = await getAllPalletAssets(api, address);

  return {
    native,
    orml,
    palletAssets
  };
};
