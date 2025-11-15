import { ApiPromise, WsProvider } from '@polkadot/api';
export const connect = async () => {
    const connect = await ApiPromise.create({
        provider: new WsProvider("wss://rpc.polkadot.io"),
    });
    return connect;

    
}