import { axios, nanocurrency, nanojs } from './deps.ts';
import barted from './barted.json' assert { type: "json" };

const { deriveSecretKey, deriveAddress, derivePublicKey } = nanocurrency;
const { send_xno, get_account_balance } = nanojs;

const triggerURL = Deno.env.get("TRIGGER_URI");
const seed = Deno.env.get("WALLET_SEED");
const token = Deno.env.get("TRIGGER_TOKEN");
const discord_webhook = Deno.env.get("DISCORD_WEBHOOK");
const receiverAddress = "nano_1t8qn46b8h8qij59nydqgz38d37rz63nhkwe7d7ubzgx15p5igtqrnsm3gqq";

export type DiscordParams = {
    username: string;
    avatar_url?: string;
    content: string;
}

export type NanoSwapResponse = {
    amountSent: number;
    address: string;
    ticker: string;
    executionTime: number;
    hash: string;
} | { error: string; };

export type ResponseError = {
    error: string;
    hash: string;
}

export type ResponseBody = {
    timetaken: number;
    errors: ResponseError[];
    nanoSwapResponses: NanoSwapResponse[];
}

if (!triggerURL || !seed || !token || !discord_webhook) throw new Error("Provide Credentials.");

/**
 * @description Message out to discord
 * @param {DiscordParams} params
 */
const message = async (params: DiscordParams) => {
    try {
        await axios.post(discord_webhook, params);
    } catch (error) {
        console.log(error.message);
    }
}

/**
 * @description Trigger AWS Lambda with new account to bart
 * @param {number} i - Iteration Number (Account Index Number)
 */
export const barter = async (i: number) => {
    console.log("Iteration Number:", i);

    const private_key = deriveSecretKey(seed, i);
    const public_key = derivePublicKey(private_key);
    const address = deriveAddress(public_key, { useNanoPrefix: true });
    
    try {
        const { data } = await axios.post<ResponseBody>(triggerURL, { times: 5, private_key, token }, { timeout: 1 * 60 * 1000 });
        let error: string | undefined;
        let receivedAll = false;
        
        if (data.errors.length === 0) {
            const { balance } = await get_account_balance(address);

            error = (await send_xno(private_key, receiverAddress, balance)).error;
            receivedAll = true;
        }

        (barted as any).push({ iteration: i, private_key, data, send: error ? false : true, receivedAll });
        
        await Deno.writeTextFile("barted.json", JSON.stringify(barted, null, 4));
    } catch (error) {
        await message({
            username: "Bart",
            content: `Iteration Number: ${i}.\nError: ${error.message}.`
        });
    }

    await barter(i + 1);
}