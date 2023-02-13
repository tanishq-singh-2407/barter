import { axios, nanocurrency } from './deps.ts';
import barted from './barted.json' assert { type: "json" };

const { deriveAddress, derivePublicKey, deriveSecretKey } = nanocurrency;

const triggerURL = Deno.env.get("TRIGGER_URI");
const seed = Deno.env.get("WALLET_SEED");
const token = Deno.env.get("TRIGGER_TOKEN");
const discord_webhook = Deno.env.get("DISCORD_WEBHOOK");

type DiscordParams = {
    username: string;
    avatar_url?: string;
    content: string;
}

if (!triggerURL || !seed || !token || !discord_webhook) throw new Error("Provide Credentials.");

const message = async (params: DiscordParams) => {
    try {
        await axios.post(discord_webhook, params)
    } catch (error) {
        console.log(error.message);
    }
}

const barter = async (i: number) => {
    console.log("Iteration Number:", i);

    const private_key = deriveSecretKey(seed, i);
    const public_key = derivePublicKey(private_key);
    const address = deriveAddress(public_key, { useNanoPrefix: true });
    
    try {
        const { data } = await axios.post(triggerURL, { times: 5, address, token }, { timeout: 1 * 60 * 1000 });
        (barted as any).push({ iteration: i, address, private_key, public_key, data });
        
        await Deno.writeTextFile("barted.json", JSON.stringify(barted, null, 4));
    } catch (error) {
        await message({
            username: "Bart",
            content: `Iteration Number: ${i}.\nError: ${error.message}.`
        });
    }

    await barter(i + 1);
}

await barter(0);