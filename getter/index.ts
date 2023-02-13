import { nanocurrency, nanojs } from './deps.ts';

const { get_pending_blocks, receive_pending_block, get_account_balance, send_xno, raw_to_xno } = nanojs;
const { deriveAddress, derivePublicKey, deriveSecretKey } = nanocurrency;

const iPhoneAddress = "nano_1t8qn46b8h8qij59nydqgz38d37rz63nhkwe7d7ubzgx15p5igtqrnsm3gqq";
const seed = Deno.env.get("WALLET_SEED");

if (!seed) throw new Error("Provide Credentials.");

const getter = async (from: number, till = from + 1) => {
    if (from >= till) Deno.exit();

    const private_key = deriveSecretKey(seed, from);
    const public_key = derivePublicKey(private_key);
    const address = deriveAddress(public_key, { useNanoPrefix: true });

    const { blocks } = await get_pending_blocks(address);
    
    for (let i = 0; i < blocks.length; i++) {
        console.log(`Account Index: ${from}, Block Number: ${i + 1}/${blocks.length}`);
        
        const pendingBlockHash = blocks[i];
        const { error, hash: receivePendingBlockHash } = await receive_pending_block(private_key, pendingBlockHash);

        console.log({ accountIndex: from, pendingBlockHash, receivePendingBlockHash, error });
    }

    const { balance } = await get_account_balance(address);
    const xno = raw_to_xno(balance);

    if (parseFloat(xno) > 0) {
        const { error, hash: sendXNOBlockHash } = await send_xno(private_key, iPhoneAddress, xno);

        if (error) console.log(error);
            
        console.log({ accountIndex: from, sendXNOBlockHash });
    }

    await getter(from + 1, till);
}

await getter(10, 60);