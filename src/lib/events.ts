
// ==========================
// Allowed Event Filters
// ==========================

export const ALLOWED_EVENT_SECTIONS = [
  "system",
  "balances",
  "staking",
  "utility",
  "multisig",
  "proxy",
  "convictionVoting",
  "referenda"
];

export const ALLOWED_EVENTS = {
  system: ["ExtrinsicSuccess", "ExtrinsicFailed"],
  balances: ["Transfer", "Reserved", "Unreserved"],
  staking: ["Bonded", "Unbonded", "Rewarded", "Slashed"],
  utility: ["BatchCompleted", "BatchInterrupted"],
  multisig: ["MultisigApproval", "MultisigExecuted", "MultisigCancelled"],
  proxy: ["ProxyExecuted"],
  convictionVoting: ["Voted", "Delegated"],
  referenda: ["Submitted", "Passed", "Rejected"]
};

//==========================
//Get ALL events in latest block
//==========================

export async function getRawEvents(api) {
    const header = await api.rpc.chain.getHeader();  
    const events =  await api.query.system.events.at(header.hash);
 
    return {
        blockNumber: header.number.toNumber(),
        events: Array.from(events) 
    }

}

//==========================
//Filter events
//==========================

export function filterEvents(blockNumber , events) {
    return events
        .map((rec, index) => {
        const { event,header} = rec;
        const section = event.section;
        const method = event.method;

        if (!ALLOWED_EVENT_SECTIONS.includes(section)) return null;

        if (
            ALLOWED_EVENTS[section] &&
            !ALLOWED_EVENTS[section].includes(method)
        ) {
            return null;
        }

        return {
            header,
            index,
            section,
            method,
            data: event.data.toHuman(),
            extrinsicIndex: event.isApplyExtrinsic
            ? event.asApplyExtrinsic.toNumber()
            : null,
        };
        })
        .filter(Boolean);
}

//==========================
//Helper filtered events 
//==========================

export async function getFilteredEvents(api) {
  const {blockNumber,events} = await getRawEvents(api);
  const filtered = filterEvents(blockNumber,events);  

  return {
    blockNumber,
    events: filtered
  };
}

//==========================
//Get latest Block Number
//==========================

export async function getLatestBlockNumber(api) {
    return  await api.system.number();
}

//==========================
//Get events by block hash
//==========================

export async function getEventsByBlockHash(api, blockHash) {
    const events =  await api.query.system.events.at(blockHash);
    const header = await api.rpc.chain.getHeader(blockHash);
    const blockNumber = header.number.toNumber();
    const filtered = await filterEvents(blockNumber,events);
    return {
        blockNumber,
        events: filtered
    };
}