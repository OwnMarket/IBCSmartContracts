# Own Inter-Blockchain Connectivity Smart Contracts

This repository contains code for Bridge-related smart contracts:
1. [wCHXToken](https://etherscan.io/token/0xd883d21af976ec9fa409c9f2944a1e7d03d21946)
2. [wCHXMapping](https://etherscan.io/address/0x766eAAbd47c53f548Cf225f8EB7AB300648FC236)
3. [bCHXToken](https://bscscan.com/address/0xd883d21af976ec9fa409c9f2944a1e7d03d21946)
4. [bCHXMapping](https://bscscan.com/address/0x766eaabd47c53f548cf225f8eb7ab300648fc236)

[wCHXMapping Functional Specification](docs/wCHXMappingFunctionalSpecification.md) document contains more details about wCHXMapping smart contract on Ethereum and its functionality.

[wCHXToken Functional Specification](docs/wCHXTokenFunctionalSpecification.md) document contains more details about wCHXToken smart contract on Ethereum and its functionality.

[bCHXMapping Functional Specification](docs/bCHXMappingFunctionalSpecification.md) document contains more details about bCHXMapping smart contract on Binance Smart Chain and its functionality.

[bCHXToken Functional Specification](docs/bCHXTokenFunctionalSpecification.md) document contains more details about bCHXToken smart contract on Binance Smart Chain and its functionality.


## Setup

Global prerequisites:

```
$ sudo npm install -g truffle
```

Repository:

```
$ git clone https://github.com/OwnMarket/IBCSmartContracts.git IBCSmartContracts
$ cd ./IBCSmartContracts/src
$ npm install
```

## Running Tests

```
$ truffle test
```
