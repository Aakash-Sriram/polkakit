import { ApiPromise, WsProvider } from '@polkadot/api';

let provider: ApiPromise | null = null;
let endpoint: string | null = null;

// --------------------------
// Create a brand-new provider instance
// --------------------------
export const createProvider = async (RPC_URL: string) => {
    const ws = new WsProvider(RPC_URL);
    const api = await ApiPromise.create({ provider: ws });
    await api.isReady;
    return api;
};

// --------------------------
// Get provider (cached)
// --------------------------
export const connect = async (RPC_URL: string) => {
    if (provider && endpoint === RPC_URL) {
        return provider;
    }

    endpoint = RPC_URL;
    provider = await createProvider(RPC_URL);
    return provider;             
};

// --------------------------
// For internal consumers
// --------------------------
export const getProviderInstance = async (RPC_URL?: string) => {
    if (provider) return provider;

    if (!RPC_URL) {
        throw new Error("Provider not initialized. Call connect(RPC_URL) first.");
    }

    return await connect(RPC_URL);
};

// --------------------------
// Disconnect provider cleanly
// --------------------------
export const disconnect = async () => {
    if (provider) {
        await provider.disconnect();
        provider = null;
        endpoint = null;
    }
};
