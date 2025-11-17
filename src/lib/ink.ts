import { ApiPromise } from "@polkadot/api";
import type { AbiMessage, ContractCallOutcome } from "@polkadot/api-contract/types";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { KeyringPair } from "@polkadot/keyring/types";

export class InkContract {
  public api: ApiPromise;
  public abi: Abi;
  public contract: ContractPromise;
  public address: string;

  constructor(api: ApiPromise, metadata: any, address: string) {
    this.api = api;
    this.abi = new Abi(metadata, api.registry.getChainProperties());
    this.contract = new ContractPromise(api, this.abi, address);
    this.address = address;
  }

  /** ---------------------------
   *  Query (read-only, dry-run)
   *  --------------------------*/
  async query(sender: string, message: string, ...args: any[]):Promise<any> {
    const msg = this.abi.findMessage(message);
    if (!msg) throw new Error(`Message '${message}' not found in ABI`);

    const result = await this.contract.query[message](sender, {}, ...args);

    if (result.result.isErr) {
      throw new Error("Query failed: " + result.result.asErr.toString());
    }

    return result.output?.toHuman();
  }

  /** ---------------------------
   *  Execute (transaction)
   *  --------------------------*/
  async tx(sender: KeyringPair, message: string, value = 0, ...args: any[]) {
    const msg = this.abi.findMessage(message);
    if (!msg) throw new Error(`Message '${message}' not found in ABI`);

    return new Promise(async (resolve, reject) => {
      try {
        const tx = this.contract.tx[message](
          {
            value,
            gasLimit: -1,
            storageDepositLimit: null,
          },
          ...args
        );

        const unsub = await tx.signAndSend(sender, (result) => {

          if (result.status.isInBlock) {
            unsub();
            resolve({
              status: "in-block",
              blockHash: result.status.asInBlock.toHex(),
              events: result.events.map(e => ({
                section: e.event.section,
                method: e.event.method,
                data: e.event.data.toHuman()
              }))
            });
          }

          if (result.status.isDropped || result.status.isInvalid) {
            unsub();
            reject(new Error("Contract transaction dropped/invalid"));
          }
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }
}

/** Helper to load contract easily */
export function createInkContract(
  api: ApiPromise,
  metadata: any,
  address: string
) {
  return new InkContract(api, metadata, address);
}
