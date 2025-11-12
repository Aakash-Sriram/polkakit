import { ApiPromise, WsProvider } from '@polkadot/api';
export const api = async () => {
    const api = await ApiPromise.create({
        provider: new WsProvider("wss://rpc.polkadot.io"),
    });
    return api;

    
}