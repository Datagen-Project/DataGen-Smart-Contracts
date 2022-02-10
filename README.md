<h1 align="center">
  <a href="https://www.b-datagray.com/"> 
    <img src="https://www.b-datagray.com/static/media/illustration-elements_token-logo.99d6bc5d.svg" height="200" width="200">
  </a>
  <br>
  DataGen Token
</h1>

<h4 align="center">
  DataGen Token and initial smart contracts for the Datagen project.
</h4>

<p align="center">
  <a href="https://twitter.com/b_datagray">
    <img src="https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Fb_datagray">
  </a>
  <a href="https://github.com/Datagen-Project/DataGen-Smart-Contracts/issues">
    <img src="https://img.shields.io/github/issues/Datagen-Project/DataGen-Smart-Contracts">  
  </a>
  <a href="https://github.com/Datagen-Project/DataGen-Smart-Contracts/network/members">
    <img src="https://img.shields.io/github/forks/Datagen-Project/DataGen-Smart-Contracts">      
  </a>
  <img src="https://img.shields.io/github/stars/Datagen-Project/DataGen-Smart-Contracts">
  <a href="https://github.com/Datagen-Project/DataGen-Smart-Contracts/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/Datagen-Project/DataGen-Smart-Contracts">
  </a>
</p>


##  Overview

DataGen is a new cryptocurrency used to settle all the payments in the ecosystem. Initially it will be an ERC-20 token deployed on Polygon mainnet and later bridged to our native blockchain for in chain payments

## Getting started

You could clone the repository and try the smart contracts in your local machine, you need also to install [truffle](https://trufflesuite.com/truffle/) to interact with the code.

From your comand line:
```bash
# Clone this repository 
$ git clone gh repo clone https://github.com/Datagen-Project/DataGen-Smart-Contracts

# Go into the repository
$ cd DataGen-Smart-Contracts

# Install dependencies
$ npm install

# Install truffle 
$ npm install truffle -g
```

Download [ganache](https://trufflesuite.com/ganache/) to run a local blockchain on your machine, there is also a [cli verison of ganache](https://github.com/trufflesuite/ganache-cli-archive).

## Testing 

Run ganache and and start a local blockchain clicking on "Quickstart".

Now you could test the contracts, we suggest to test the contracts one by one.

From your comand line:

```bash
# e.g. if you want to test DataGen contract
$ truffle test test/Datagen.test.js
```
***Note***: 

- Many contracts have a comment section you must read to test them in the correct way.
- If there is a time manipulation of the blockchian in the test you need to restart the blockchain to get it pass every time you run a test, for this reason some tests need to be done one by one.

## Licensing

The code in this project is licensed under [GNU general Public License v3.0](https://github.com/Datagen-Project/DataGen-Smart-Contracts/blob/main/LICENSE.md).
