import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import chromium from 'chrome-aws-lambda';
import aws from 'aws-sdk';
import { Browser } from "puppeteer-core";
import { createHash } from 'crypto';

const isDev = process.env.dev === "true";

type Body = {
    url: string | null;
    address: string | null;
    token: string | null;
}

export const handler = async ({ body }: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let browser: Browser;
    let targetURL: URL;

    const { url, address, token } = JSON.parse(body) as Body;

    try {
        if (!url || !address || !token) throw new Error('URL, Address, or token field missing');
        if (!address.startsWith("nano_") || address.length !== 65) throw new Error('Nano address invalid.');
        if (createHash('sha256').update(token).digest('hex') !== "9d8a178b8c1b8cea103082bf57616e99c82301be8f7e74717126c6f0458dbc2e") throw new Error("Token not matched");

        targetURL = new URL(url);
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

    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.type("#address", address);
        const req1 = await page.waitForResponse(res => res.url() === "https://api.nanswap.com/get-free" && res.request().method() === "POST", { timeout: 6000 });
        const res1 = await req1.json();

        await page.reload();
        await page.type("#address", address);
        const req2 = await page.waitForResponse(res => res.url() === "https://api.nanswap.com/get-free" && res.request().method() === "POST", { timeout: 6000 });
        const res2 = await req2.json();

        await page.reload();
        await page.type("#address", address);
        const req3 = await page.waitForResponse(res => res.url() === "https://api.nanswap.com/get-free" && res.request().method() === "POST", { timeout: 6000 });
        const res3 = await req3.json();
        
        const timetaken = Date.now() - startTime;

        response = {
            statusCode: 200,
            body: JSON.stringify({ response: { res1, res2, res3 }, timetaken })
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