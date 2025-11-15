export async function getBlockDetails(api, blockHash) {
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
    hash: header.hash.toHex(),
    parentHash: header.parentHash.toHex(),
    timestamp,
    extrinsics: decoded
  };
}

export async function getBlockDetailsByNumber(api, number) {
  const hash = await api.rpc.chain.getBlockHash(number);
  return getBlockDetails(api, hash.toHex());
}

export async function getLatestBlockDetails(api) {
  const header = await api.rpc.chain.getHeader();
  return getBlockDetails(api, header.hash.toHex());
}
