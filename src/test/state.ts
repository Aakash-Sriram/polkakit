import { createProvider } from "../lib/provider";
import { getBalance } from "../lib/state";
const test1 = async () => {
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const api = await createProvider("wss://rpc.polkadot.io");
    const acc = await api.query.system.account(address);
    const JsonData = acc.toJSON();
    const {data} = JsonData as any;
    console.log("Account Data:", data);
}
// test1().catch(console.error);

const test2 = async () =>{
    const api = await createProvider("wss://rpc.polkadot.io");
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const balance =  await getBalance(api, address);
    console.log("Balance Info:", balance);
}

test2().catch(console.error);