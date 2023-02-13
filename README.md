<h1 align="center">
    <b>Barter</b>
</h1>

<img align="right" src="./assets/barter.png" height="150px">

_**Barter**_ is a free faucet scraping project for **nanocurrency**.
_**Only made for fun.**_

### Features

- Scrapes [_**nanswap.com/nano-faucet.**_](https://nanswap.com/nano-faucet)
- Deploy on AWS Lambda.
- Force _**Proxy Rotation**_ on every request.
- Receive _**xno**_ on new account in each request _(from **same wallet seed**)_.
- Receive Pending All blocks in each account.
- Forward xno from each account to _**Main Account**_.

<br />

# _**Prerequisite**_
1. Personal _**XNO Account.**_
2. Dummy _**XNO Wallet seed.**_
3. AWS Account.
4. _**Node**_, _**Deno**_ Installed.

<br />

# _**Installation**_

1.  ```sh
    # barter/
    yarn install
    ```

2.  ```sh
    # barter/getter/
    deno cache deps.ts
    ```

3.  ```sh
    # barter/trigger/
    deno cache deps.ts
    ```

<br />

# _**Running**_
1. Test Locally (Lambda).
    ```sh
    # barter/
    yarn start
    ```

2. Trigger
    ```sh
    # barter/trigger
    # Update the accourding to your need first
    deno run -A --unstable index.ts
    ```

3. Getter
    ```sh
    # barter/getter
    # Update the accourding to your need first
    deno run -A --unstable index.ts
    ```
<br />

---

<p align="center"><i><b>Made By: <a href="https://tanishqsingh.com">tanishqsingh.com</a></b></i></p>