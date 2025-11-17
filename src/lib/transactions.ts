import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

export async function sendTransfer(
  api: ApiPromise,
  sender: KeyringPair,
  to: string,
  amount: bigint | number
) {
  return new Promise(async (resolve, reject) => {
    try {
      const tx = api.tx.balances.transferAllowDeath(to, amount);

      const unsub = await tx.signAndSend(sender, ({ status, events, dispatchError }) => {

        if (status.isInvalid || status.isDropped) {
          unsub();
          return reject(new Error("Transaction rejected by node"));
        }

        if (status.isInBlock) {
          let success = true;
          let errorMessage = null;

          events.forEach(({ event }) => {
            if (event.section === "system") {
              if (event.method === "ExtrinsicFailed") {
                success = false;

                const error = event.data[0]; 
                const jsonError = error.toJSON() as any;
                if (jsonError.isModule) {
                  const decoded = api.registry.findMetaError(jsonError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
                } else {
                  errorMessage = error.toString();
                }
              }
            }
          });

          unsub();

          if (!success) {
            return reject(new Error(`ExtrinsicFailed: ${errorMessage}`));
          }

          return resolve({
            status: "success",
            blockHash: status.asInBlock.toHex(),
            txHash: tx.hash.toHex(),
          });
        }
      });
    } catch (err: any) {
      reject(err);
    }
  });
}
