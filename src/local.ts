import { handler } from './index';

(async () => {
    const event: any = {
        body: JSON.stringify({
            address: "nano_34mqwohmeqgpst7g8s74gkoqfkn7humcohabf9gnxqw6hi1gx8x6crox6ttj",
            token: ""
        })
    }

    const { body, statusCode } = await handler(event);

    console.log({
        statusCode,
        body: JSON.parse(body)
    });
})();