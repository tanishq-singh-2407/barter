import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { get_account_keys, Account, receive_pending_block, send_xno } from '@tanishq-singh/nanojs';
import chromium from 'chrome-aws-lambda';
import aws from 'aws-sdk';
import { Browser } from "puppeteer-core";
import { createHash } from 'crypto';

const isDev = process.env.dev === "true";
const targetURL = "https://nanswap.com/nano-faucet";

type Body = {
    private_key?: string;
    token?: string;
    times?: number;
}

type NanoSwapResponse = {
    amountSent: number;
    address: string;
    ticker: string;
    executionTime: number;
    hash: string;
} | { error: string; };

export const handler = async ({ body }: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let browser: Browser;
    let account: Account;
    let token: string | null;
    let times: number | null;
    
    try {
        const body_json = JSON.parse(body) as Body;
        account = { ...get_account_keys(body_json.private_key), index: 0 };
        token = body_json.token;
        times = body_json.times ?? 5;

        if (createHash('sha256').update(token).digest('hex') !== "9d8a178b8c1b8cea103082bf57616e99c82301be8f7e74717126c6f0458dbc2e") throw new Error("Token not matched");
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    const startTime = Date.now();

    if (isDev) {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch();
    }
    
    if (!isDev) {
        const lambda = new aws.Lambda();
    
        await lambda.updateFunctionConfiguration({
            FunctionName: "barter",
            Environment: {
                Variables: {}
            }
        }).promise();
        
        browser = await chromium.puppeteer
            .launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true
            });
    }
    
    const page = await browser.newPage();
    const nanoSwapResponses: NanoSwapResponse[] = [];

    try {
        for (let i = 0; i < times; i++) {
            if (i === 0)
                await page.goto(targetURL, { waitUntil: "networkidle2" });
            else
                await page.reload();
            
            await page.type("#address", account.address);
            const req = await page.waitForResponse(res => res.url() === "https://api.nanswap.com/get-free" && res.request().method() === "POST", { timeout: 6000 });
            nanoSwapResponses.push(await req.json() as NanoSwapResponse);
        }
        
        const errors = [];
        
        for (let i = 0; i < nanoSwapResponses.length; i++) {
            const res = nanoSwapResponses[i];
            
            if (!('error' in res)) {
                const { error } = await receive_pending_block(account.private_key, res.hash);
                
                if (error)
                    errors.push({ error, hash: res.hash, private_key: account.private_key });
            }
        }
        
        const timetaken = Date.now() - startTime;

        response = {
            statusCode: 200,
            body: JSON.stringify({ timetaken, errors, nanoSwapResponses })
        }
    } catch (error) {
        const timetaken = Date.now() - startTime;

        response = {
            statusCode: 400,
            body: JSON.stringify({ error: error.message, timetaken })
        }
    } finally {
        await page.close();
        await browser.close();
    }

    return response;
};