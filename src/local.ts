import { handler } from './index';

/**
 * @description Trigger function locally
 */
(async () => {
    const event: any = {
        body: JSON.stringify({
            private_key: "",
            token: ""
        })
    }

    const { body, statusCode } = await handler(event);

    console.log({
        statusCode,
        body: JSON.parse(body)
    });
})();