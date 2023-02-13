import { nanocurrency, nanojs } from './deps.ts';

const { get_pending_blocks, receive_pending_block, get_account_balance, send_xno, raw_to_xno } = nanojs;
const { deriveAddress, derivePublicKey, deriveSecretKey } = nanocurrency;

const myHomeAddress = "nano_1t8qn46b8h8qij59nydqgz38d37rz63nhkwe7d7ubzgx15p5igtqrnsm3gqq";
const seed = Deno.env.get("WALLET_SEED");

if (!seed) throw new Error("Provide Credentials.");

type Account = {
    accountIndex: number;
    private_key: string;
    address: string;
}

let accounts_: Account[] = []

/**
 * @description Add multiple accounts from the wallet (seed) to an array with private_key, address, and accountIndex
 * @param {number} from - Start from Index 
 * @param {number} till - End from Index 
 */
const getter_accounts = (from: number, till = from + 1): Account[] => {
    if (from >= till) return accounts_;

    const private_key = deriveSecretKey(seed, from);
    const public_key = derivePublicKey(private_key);
    const address = deriveAddress(public_key, { useNanoPrefix: true });

    accounts_.push({ accountIndex: from, private_key, address });

    return getter_accounts(from + 1, till);
}

/**
 * @description Function to receive all the pending blocks from all the accounts of that particular seed
 * @param {number} from - Starting Index of the account
 * @param {number} shift - How many accounts you want to receive blocks concurrently
 */
export const getter = async (from: number, shift: number) => {
    accounts_ = [];
    const accounts = getter_accounts(from, from + shift);
    
    const pending_blocks = await Promise.all(
        accounts.map(async ({ address, private_key, accountIndex }) => {return{ private_key, accountIndex, blocks: (await get_pending_blocks(address)).blocks }})
    );
        
    console.log(pending_blocks);
    
    const received_block_hashes = await Promise.all(
        pending_blocks.map(
            async ({ blocks, private_key, accountIndex }) => {
                const results: { error?: string; hash?: string; }[] = [];

                for (let i = 0; i < blocks.length; i++)
                    results.push(await receive_pending_block(private_key, blocks[i]));

                return { accountIndex, done: results.length / blocks.length ,results };
            }
        )
    );
    
    console.log(received_block_hashes);

    await getter(from + shift, shift);
}

/**
 * @description Transfer all the XNOs from each account of the seed to the given address
 * @param {string} receiverAddress - Receiver Address
 * @param {string} fromAccountIndex - Start from what index of accout from wallet seed
 */
export const sendToAddress = async (receiverAddress: string, fromAccountIndex: number) => {
    console.log("Iteration Number: ", fromAccountIndex + 1);

    const private_key = deriveSecretKey(seed, fromAccountIndex);
    const public_key = derivePublicKey(private_key);
    const address = deriveAddress(public_key, { useNanoPrefix: true });

    const { balance } = await get_account_balance(address);

    if (balance.length > 1) {
        const { error, hash } = await send_xno(private_key, receiverAddress, raw_to_xno(balance));

        if (error) await sendToAddress(receiverAddress, fromAccountIndex);
        else console.log(hash);
    }
}