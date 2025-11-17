import { ApiPromise } from "@polkadot/api";

export async function getBlockDetails(api:ApiPromise, blockHash:string):Promise<{
  number:number,
  hash:string,
  parentHash:string,
  timestamp:string | null,
  extrinsics:any
}> {
  const block = await api.rpc.chain.getBlock(blockHash);
  const header = block.block.header;
  const extrinsics = block.block.extrinsics;

  let timestamp = null;

  for (const ext of extrinsics) {
    if (ext.method.section === "timestamp" && ext.method.method === "set") {
      timestamp = new Date(parseInt(ext.method.args[0].toString(), 10)).toISOString();
    }
  }

  const decoded = extrinsics.map((ext, index) => ({
    index,
    section: ext.method.section,
    call: ext.method.method,
    args: ext.method.args.map((a) => a.toHuman())
  }));

  return {
    number: header.number.toNumber(),
    hash: header.hash.toString(),
    parentHash: header.parentHash.toString(),
    timestamp,
    extrinsics: decoded
  };
}
export async function getBlockDetailsByNumber(api:ApiPromise, number:number) {
  const hash = await api.rpc.chain.getBlockHash(number);
  return getBlockDetails(api, hash.toHex());
}

export async function getLatestBlockDetails(api:ApiPromise) {
  const header = await api.rpc.chain.getHeader();
  return getBlockDetails(api, header.hash.toHex());
}

export async function subscribeNewHeads(api:ApiPromise, onBlock:any) {
  return api.rpc.chain.subscribeNewHeads((header) => {
    const block = {
      number: header.number.toNumber(),
      hash: header.hash.toHex(),
      parentHash: header.parentHash.toHex(),
      stateRoot: header.stateRoot.toHex(),
      extrinsicsRoot: header.extrinsicsRoot.toHex(),
      raw: header
    };

    onBlock(block);
  });
}

export const getChainInfo = async(api:ApiPromise):Promise<{
chain:string,
nodeName:string,
nodeVersion:string,
chainType:string,
health:any}> =>{
  const chain = await api.rpc.system.chain();
  const Name = await api.rpc.system.name();
  const nodeVersion = await api.rpc.system.version();
  const chainType = await api.rpc.system.chainType();
  const health = await api.rpc.system.health();
  return {
    chain: chain.toString(),
    nodeName: Name.toString(),
    nodeVersion: nodeVersion.toString(),
    chainType: chainType.toString(),
    health: health.toHuman()
  };
}

