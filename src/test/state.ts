import { createProvider } from "../lib/provider";
import { 
    getPortfolio, 
    getAllOrmlTokens, 
    getAllPalletAssets, 
    getBalance, 
    getSupportedTokens } from "../lib/state";
import { ApiPromise } from "@polkadot/api";
const ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const RPC = "wss://rpc.polkadot.io";
const test1 = async () => {
    const api = await createProvider(RPC);
    const acc = await api.query.system.account(ADDRESS);
    const JsonData = acc.toJSON();
    const {data} = JsonData as any;
    console.log("Account Data:", data);
}
// test1().catch(console.error);

const test2 = async () =>{
    const api = await createProvider(RPC);
    const balance =  await getBalance(api, ADDRESS);
    console.log("Balance Info:", balance);
}

// test2().catch(console.error);

const test3 = async () =>{
    const api = await createProvider(RPC);
    const tokens = getSupportedTokens(api);
    console.log("Supported Tokens:", tokens);
}

// test3().catch(console.error);

const testOrml = async (api:ApiPromise) => {

    const tokens = await getAllOrmlTokens(api, ADDRESS);
    console.log("\nORML Tokens");
    console.log(tokens);
    await api.disconnect();
};

const testPalletAssets = async (api:ApiPromise) => {

    const assets = await getAllPalletAssets(api, ADDRESS);
    console.log("\nPallet Assets");
    console.log(assets);
    await api.disconnect();
};


const testAll = async (api:ApiPromise) => {

    const portfolio = await getPortfolio(api, ADDRESS);
    console.log("\nFull Asset");
    console.log(JSON.stringify(portfolio, null, 2));
    await api.disconnect();

};


(async ()=>{
    const api = await createProvider(RPC);
    testOrml(api).catch(console.error);
    testPalletAssets(api).catch(console.error);
    testAll(api).catch(console.error);

    }
)();