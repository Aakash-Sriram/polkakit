export async function subscribeNewHeads(api, onBlock) {
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
