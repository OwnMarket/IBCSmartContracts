Functional Specification of bCHXToken Smart Contract
=========================================

## High-level Overview
bCHXToken is implemented as a standard BEP20 token contract and it inherits [BEP20](https://github.com/binance-chain/BEPs/blob/master/BEP20.md) smart contract and [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) smart contract from [OpenZeppelin](https://openzeppelin.com/). The main purpose of this smart contract is to hold information about holders and transfers of bCHX token. bCHX token is wrapped [CHX](https://github.com/OwnMarket/OwnBlockchain/blob/master/Docs/Concepts/CHX.md) token which is utility token of [WeOwn blockchain](https://github.com/OwnMarket/OwnBlockchain/tree/master/Docs). bCHX is BEP20 representation of CHX token and therefore it needs to follow certain conditions which are set by custom functions of this smart contract.

Wrapping CHX is a process of moving CHX from WeOwn blockchain to Binance Smart Chain. In that process, CHX holder needs to transfer CHX to specific CHX address which serves for collecting wrapped CHX on WeOwn blockchain. When CHX is sent there, equivalent amount of bCHX on Binance Smart Chain is minted to the BSC address of CHX holder. That BSC address is read from bCHXMapping smart contract, by finding the pair of CHX and BSC address that are mapped to each other. 

Unwrapping CHX is a process of moving CHX from Binance Smart Chain to WeOwn blockchain. In that process, bCHX holder on Binance Smart Chain needs to transfer bCHX to bCHXToken contract address. That amount of bCHX is burned and equivalent amount of CHX is transferred to holder's CHX address on WeOwn blockchain. That address is read from bCHXMapping contract, by finding the pair of CHX and BSC address that are mapped to each other. 

## CHX Wrapping 

Wrapping process can be done through WeOwn wallet which is the only recommended way or it can be done manually, by transferring CHX to dedicated CHX address: [CHPkcSPjcXq2SxKM4CFLxE57x2JEuGCrwLv] (https://explorer.weown.com/address/CHPkcSPjcXq2SxKM4CFLxE57x2JEuGCrwLv). These are pre-requisites for CHX wrapping:
1. You need to have CHX address and BSC address
2. CHX address and BSC address need to be mapped, as explained in the [functional specification](bCHXMappingFunctionalSpecification.md) of bCHXMapping contract
3. Balance of CHX address need to be greater than minimal wrap amount, which can be read from the bCHXToken smart contract, by calling function `minWrapAmount`.

When using WeOwn wallet, user is guided through the whole process and he will not be able to proceed if these requirements are not fulfilled. However, when user wraps CHX manually, they need to take care of fulfilling all these requirements. If the requirements are not met, wrap will be automatically reverted, meaning that CHX intended for wrapping will be transferred back to CHX holder.

Wrapping through WeOwn wallet can be submitted through "Bridge" quick action. User needs to accept the terms, map address if not mapped and then, proceed to the step in which they select direction (CHX -> bCHX) and determine the amount. When user confirms it, soon after all blockchain transactions are processed, bCHX should appear in their BSC wallet.

Wrapping manually means transferring CHX to this CHX address: [CHPkcSPjcXq2SxKM4CFLxE57x2JEuGCrwLv] (https://explorer.weown.com/address/CHPkcSPjcXq2SxKM4CFLxE57x2JEuGCrwLv). Soon after all blockchain transactions are processed, bCHX should appear in their BSC wallet. In case that pre-requisites are not met, the same amount of CHX would be transferred back to CHX holder.

In technical sense, when user submits transfer CHX action manually or confirms wrap through "Bridge" feature in WeOwn wallet, dedicated sync engine on WeOwn side would invoke bCHX contract method `wrap` which would mint bCHX tokens to bCHX holder.

## bCHX Unwrapping

Unwrapping process can be done through WeOwn wallet which is the only recommended way or it can be done manually, by transferring bCHX to bCHXToken contract address: [0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946] (https://bscscan.com/address/0xd883d21af976ec9fa409c9f2944a1e7d03d21946). These are pre-requisites for bCHX unwrapping:
1. You need to have CHX address and BSC address
2. CHX address and BSC address need to be mapped, as explained in the [functional specification](bCHXMappingFunctionalSpecification.md) of bCHXMapping contract
3. bCHX Balance of BSC address need to be greater than minimal wrap amount, which can be read from the bCHXToken smart contract, by calling function `minWrapAmount`.

When using WeOwn wallet, user is guided through the whole process and he will not be able to proceed if these requirements are not fulfilled. However, when user unwraps bCHX manually, they need to take care of fulfilling all these requirements. If the requirements are not met, unwrap will be automatically reverted, meaning that bCHX intended for unwrapping will be transferred back to bCHX holder.

Unwrapping through WeOwn wallet can be submitted through "Bridge" quick action. User needs to accept the terms, map address if not mapped and then, proceed to the step in which they select direction (bCHX -> CHX) and determine the amount. When user confirms it and submits Binance Smart Chain tx through MetaMask, soon after all blockchain transactions are processed, CHX should appear in their CHX wallet on WeOwn blockchain.

Wrapping manually means transferring bCHX to this Binance Smart Chain address: [0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946] (https://bscscan.com/address/0xd883d21af976ec9fa409c9f2944a1e7d03d21946), by invoking method `transfer` or `transferFrom` of bCHXToken smart contract. Soon after all blockchain transactions are processed, balance of their CHX address should be increased. In case that pre-requisites are not met, the same amount of bCHX would be transferred back to bCHX holder.

In technical sense, when user submits `transfer` or `transferFrom` transaction on Binance Smart Chain manually or confirms unwrap through "Bridge" feature in WeOwn wallet, dedicated sync engine on WeOwn side would transfer CHX from dedicated CHX address holding all wrapped CHX to CHX address read from `bCHXMapping` contract and then, sync engine would invoke bCHX contract method `burnUnwrapedTokens` which would burn bCHX tokens transferred to contract address.

In case that unwrap is done manually and that requirements are not met, bCHX intended for unwrapping will be transferred back to bCHX holder. In that case, sync engine would invoke bCHXToken contract method `revertUnwrapedTokens` which would transfer back bCHX to bCHX holder.

## Fees

Wrapping CHX means that user submits tx on WeOwn blockchain (manually or automatically in the background) and pays tx fee on WeOwn blockchain. Afterwards, WeOwn sync engine would submit Binance Smart Chain tx of invoking `wrap` method and would pay BNB fee for that tx. In opposite direction, when unwrapping bCHX, user would submit Binance Smart Chain tx (`transfer` or `transferFrom`) and pay BNB fee for that tx. Then, sync engine would first transfer CHX to the user and pay tx fee in CHX and secondly, sync engine would submit Binance Smart Chain tx of invoking method `burnUnwrapedTokens` and pay BNB fee.

BNB fees paid by WeOwn sync engine are converted in CHX (by taking current CHX/BNB price rate) and added to CHX fees paid by sync engine. Total fee amount is subtracted from wrap/unwrap amount, so user can expect to receive smaller amount of CHX or bCHX in this process. The same logic applies when wrap/unwrap is reverted. Amount that is reverted to CHX or bCHX holder would be always smaller than transferred amount. 

When using WeOwn wallet for wrapping/unwrapping, fee estimation is given. Gas consumption of `wrap` or `burnUnwrapedTokens` is multiplied by current gas price (derived from [BSCScan](https://bscscan.com/apis#proxy)) and that amount is converted to CHX using price rate derived from [CoinGecko](https://www.coingecko.com/en/coins/own/bnb). WeOwn blockchain fees are also added to that amount. Important thing to notice is that fees presented are only an estimation. Fees can be higher or lower than presented amount, as gas price or CHX/BNB price rate can change between the time of submitting wrap/unwrap and its actual processing.

## Other bCHXToken Functions
bCHX token is BEP20 token and therefore, it implements its standard writing functions:
- `approve`
- `increaseAllowance`
- `decreaseAllowance`
- `transfer`, modified when transferring bCHX to the contract address
- `transferFrom`, modified when transferring bCHX to the contract address

It also implements ERC20 standard reading functions:
- `allowance`
- `balanceOf`
- `cap`
- `decimals`
- `name`
- `symbol`
- `totalSupply`

wCHx token inherits Ownable contract and implements its functions:
- `renounceOwnership`
- `transferOwnership`
- `owner`

Other custom reading functions are:
- `addressMapping`: returns Binance Smart Chain address of `bCHXMapping` contract on which the contract depends
- `minWrapAmount`: returns minimal value of CHX that can be wrapped or unwrapped
- `pendingUnwrapBalanceOf`: returns amount of bCHX that has been submitted for unwrapping by specified BSC address. By default, it is 0. When bCHX holder transfers bCHX to contract address (unwrapping), it is increase to transferred amount. When sync engine burns bCHX or reverts transfer, pending unwrap balances decreases to 0 again.

Other custom writing functions are:
- `drainStrayBNB`: function that allows contract owner to move mistakenly sent BNB to the contract
- `drainStrayTokens`: function that allows contract owner to move mistakenly sent BEP20 tokens to the contract (all BEP20 tokens, except bCHX)
- `setMinWrapAmount`: function that allows contract owner to change the minimal amount of CHX that can be wrapped or unwrapped. On contract deployment, it was set to 1000 CHX.
