export async function accountInfo(api,accountId ){
    return api.query.system.account(accountId);
}