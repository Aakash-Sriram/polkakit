import { ApiPromise, WsProvider } from '@polkadot/api';
export const connect = async (RPC_URL:string) => {
    const connect = await ApiPromise.create({
        provider: new WsProvider(RPC_URL),
    });
    return connect; 
}