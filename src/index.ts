import { APIGatewayProxyResult } from "aws-lambda";
import chromium from 'chrome-aws-lambda';
import aws from 'aws-sdk';
import { Browser } from "puppeteer-core";

const url = "https://api.ipify.org";
const isDev = process.env.dev === "true";

export const handler = async (): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let browser: Browser;

    if (isDev) {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch();
    }
    
    if (!isDev) {
        const lambda = new aws.Lambda();
    
        await lambda.updateFunctionConfiguration({
            FunctionName: "aws-lambda-proxy-scraping",
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

        response = {
            statusCode: 200,
            body: JSON.stringify({
                ip
            })
        }
    } catch (error) {
        response = {
            statusCode: 400,
            body: JSON.stringify({
                error: error.message
            })
        }
    } finally {
        await page.close();
        await browser.close();
    }

    return response;
};