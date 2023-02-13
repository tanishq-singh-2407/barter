import { handler } from './index';

(async () => {
    const event: any = {
        body: JSON.stringify({
            url: 'https://nanswap.com/nano-faucet',
            address: "nano_1t8qn46b8h8qij59nydqgz38d37rz63nhkwe7d7ubzgx15p5igtqrnsm3gqq",
            token: ""
        })
    }

    const { body, statusCode } = await handler(event);

    console.log({
        statusCode,
        body: JSON.parse(body)
    });
})();