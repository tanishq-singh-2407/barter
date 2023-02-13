import { handler } from './index';

(async () => {
    const event: any = {
        body: "j"
    }

    console.log(await handler(event));
})();