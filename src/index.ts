import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import chromium from 'chrome-aws-lambda';
import aws from 'aws-sdk';
import { Browser } from "puppeteer-core";

const url = "https://api.ipify.org";
const isDev = process.env.dev === "true";

export const handler = async ({ body }: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let browser: Browser;

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
        await page.goto(url, { waitUntil: "domcontentloaded" });

        const ip = await page.$eval('body', el => el.textContent);
        const responseTime = Date.now() - startTime;

        response = {
            statusCode: 200,
            body: JSON.stringify({ ip, responseTime })
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;

        response = {
            statusCode: 400,
            body: JSON.stringify({ error: error.message, responseTime })
        }
    } finally {
        await page.close();
        await browser.close();
    }

    return response;
};