export async function getChainInfo(api) {
  const chain = await api.rpc.system.chain();
  const nodeName = await api.rpc.system.name();
  const nodeVersion = await api.rpc.system.version();
  const chainType = await api.rpc.system.chainType();

  return {
    chain: chain.toString(),
    nodeName: nodeName.toString(),
    nodeVersion: nodeVersion.toString(),
    chainType: chainType.toString()
  };
}
