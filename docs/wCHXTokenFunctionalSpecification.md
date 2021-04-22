Functional Specification of wCHXToken Smart Contract
=========================================

## High-level Overview
wCHXToken is implemented as a standard [ERC20] token contract and it inherits [ERC20Capped](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Capped.sol) and [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) smart contracts from [OpenZeppelin](https://openzeppelin.com/). The main purpose of this smart contract is to hold information about holders and transfers of wCHX token. wCHX token is wrapped [CHX](https://github.com/OwnMarket/OwnBlockchain/blob/master/Docs/Concepts/CHX.md) token which is utility token of [WeOwn blockchain](https://github.com/OwnMarket/OwnBlockchain/tree/master/Docs). wCHX is ERC20 representation of CHX token and therefore it needs to follow certain conditions which are set by custom functions of this smart contract.

Wrapping CHX is a process of moving CHX from WeOwn blockchain to Ethereum. In that process, CHX holder needs to transfer CHX to specific CHX address which serves for collecting wrapped CHX on WeOwn blockchain. When CHX is sent there, equivalent amount of wCHX on Ethereum is minted to the ETH address of CHX holder. That ETH address is read from wCHXMapping smart contract, by finding the pair of CHX and ETH address that are mapped to each other. 

Unwrapping CHX is a process of moving CHX from Ethereum to WeOwn blockchain. In that process, wCHX holder on Ethereum needs to transfer wCHX to wCHXToken contract address. That amount of wCHX is burned and equivalent amount of CHX is transferred to holder's CHX address on WeOwn blockchain. That address is read from wCHXMapping contract, by finding the pair of CHX and ETH address that are mapped to each other. 

## CHX Wrapping 

Wrapping process can be done through WeOwn wallet which is the only recommended way or it can be done manually, by transferring CHX to dedicated CHX address: [CHXhwGQecv9oThxD9ZnWWENVc26N1X5FJAQ] (https://explorer.weown.com/address/CHXhwGQecv9oThxD9ZnWWENVc26N1X5FJAQ). These are pre-requisites for CHX wrapping:
1. You need to have CHX address and ETH address
2. CHX address and ETH address need to be mapped, as explained in the [functional specification](wCHXMappingFunctionalSpecification.md) of wCHXMapping contract
3. Balance of CHX address need to be greater than minimal wrap amount, which can be read from the wCHXToken smart contract, by calling function `minWrapAmount`.

When using WeOwn wallet, user is guided through the whole process and he will not be able to proceed if these requirements are not fulfilled. However, when user wraps CHX manually, they need to take care of fulfilling all these requirements. If the requirements are not met, wrap will be automatically reverted, meaning that CHX intended for wrapping will be transferred back to CHX holder.

Wrapping through WeOwn wallet can be submitted through "Bridge" quick action. User needs to accept the terms, map address if not mapped and then, proceed to the step in which they select direction (CHX -> wCHX) and determine the amount. When user confirms it, soon after all blockchain transactions are processed, wCHX should appear in their ETH wallet.

Wrapping manually means transferring CHX to this CHX address: [CHXhwGQecv9oThxD9ZnWWENVc26N1X5FJAQ] (https://explorer.weown.com/address/CHXhwGQecv9oThxD9ZnWWENVc26N1X5FJAQ). Soon after all blockchain transactions are processed, wCHX should appear in their ETH wallet. In case that pre-requisites are not met, the same amount of CHX would be transferred back to CHX holder.

In technical sense, when user submits transfer CHX action manually or confirms wrap through "Bridge" feature in WeOwn wallet, dedicated sync engine on WeOwn side would invoke wCHX contract method `wrap` which would mint wCHX tokens to wCHX holder.

## wCHX Unwrapping

Unwrapping process can be done through WeOwn wallet which is the only recommended way or it can be done manually, by transferring wCHX to wCHXToken contract address: [0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946] (https://etherscan.io/address/0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946). These are pre-requisites for wCHX unwrapping:
1. You need to have CHX address and ETH address
2. CHX address and ETH address need to be mapped, as explained in the [functional specification](wCHXMappingFunctionalSpecification.md) of wCHXMapping contract
3. wCHX Balance of ETH address need to be greater than minimal wrap amount, which can be read from the wCHXToken smart contract, by calling function `minWrapAmount`.

When using WeOwn wallet, user is guided through the whole process and he will not be able to proceed if these requirements are not fulfilled. However, when user unwraps wCHX manually, they need to take care of fulfilling all these requirements. If the requirements are not met, unwrap will be automatically reverted, meaning that wCHX intended for unwrapping will be transferred back to wCHX holder.

Unwrapping through WeOwn wallet can be submitted through "Bridge" quick action. User needs to accept the terms, map address if not mapped and then, proceed to the step in which they select direction (wCHX -> CHX) and determine the amount. When user confirms it and submits Ethereum tx through MetaMask, soon after all blockchain transactions are processed, CHX should appear in their CHX wallet on WeOwn blockchain.

Wrapping manually means transferring wCHX to this Ethereum address: [0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946] (https://etherscan.io/address/0xD883D21AF976Ec9fA409c9f2944A1E7D03D21946), by invoking method `transfer` or `transferFrom` of wCHXToken smart contract. Soon after all blockchain transactions are processed, balance of their CHX address should be increased. In case that pre-requisites are not met, the same amount of wCHX would be transferred back to wCHX holder.

In technical sense, when user submits `transfer` or `transferFrom` transaction on Ethereum manually or confirms unwrap through "Bridge" feature in WeOwn wallet, dedicated sync engine on WeOwn side would transfer CHX from dedicated CHX address holding all wrapped CHX to CHX address read from `wCHXMapping` contract and then, sync engine would invoke wCHX contract method `burnUnwrapedTokens` which would burn wCHX tokens transferred to contract address.

In case that unwrap is done manually and that requirements are not met, wCHX intended for unwrapping will be transferred back to wCHX holder. In that case, sync engine would invoke wCHXToken contract method `revertUnwrapedTokens` which would transfer back wCHX to wCHX holder.

## Fees

Wrapping CHX means that user submits tx on WeOwn blockchain (manually or automatically in the background) and pays tx fee on WeOwn blockchain. Afterwards, WeOwn sync engine would submit Ethereum tx of invoking `wrap` method and would pay ETH fee for that tx. In opposite direction, when unwrapping wCHX, user would submit Ethereum tx (`transfer` or `transferFrom`) and pay ETH fee for that tx. Then, sync engine would first transfer CHX to the user and pay tx fee in CHX and secondly, sync engine would submit Ethereum tx of invoking method `burnUnwrapedTokens` and pay ETH fee.

ETH fees paid by WeOwn sync engine are converted in CHX (by taking current CHX/ETH price rate) and added to CHX fees paid by sync engine. Total fee amount is subtracted from wrap/unwrap amount, so user can expect to receive smaller amount of CHX or wCHX in this process. The same logic applies when wrap/unwrap is reverted. Amount that is reverted to CHX or wCHX holder would be always smaller than transferred amount. 

When using WeOwn wallet for wrapping/unwrapping, fee estimation is given. Gas consumption of `wrap` or `burnUnwrapedTokens` is multiplied by current gas price for fast tx processing (derived from [ETH gas station](https://ethgasstation.info/)) and that amount is converted to CHX using price rate derived from [CoinGecko](https://www.coingecko.com/en/coins/own/eth). WeOwn blockchain fees are also added to that amount. Important thing to notice is that fees presented are only an estimation. Fees can be higher or lower than presented amount, as gas price or CHX/ETH price rate can change between the time of submitting wrap/unwrap and its actual processing.

## Other wCHXToken Functions
wCHX token is ERC20 token and therefore, it implements its standard writing functions:
- `approve`
- `increaseAllowance`
- `decreaseAllowance`
- `transfer`, modified when transferring wCHX to the contract address
- `transferFrom`, modified when transferring wCHX to the contract address

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
- `addressMapping`: returns Ethereum address of `wCHXMapping` contract on which the contract depends
- `minWrapAmount`: returns minimal value of CHX that can be wrapped or unwrapped
- `pendingUnwrapBalanceOf`: returns amount of wCHX that has been submitted for unwrapping by specified Ethereum address. By default, it is 0. When wCHX holder transfers wCHX to contract address (unwrapping), it is increase to transferred amount. When sync engine burns wCHX or reverts transfer, pending unwrap balances decreases to 0 again.

Other custom writing functions are:
- `drainStrayEther`: function that allows contract owner to move mistakenly sent ETH to the contract
- `drainStrayTokens`: function that allows contract owner to move mistakenly sent ERC20 tokens to the contract (all ERC20 tokens, except wCHX)
- `setMinWrapAmount`: function that allows contract owner to change the minimal amount of CHX that can be wrapped or unwrapped. On contract deployment, it was set to 1000 CHX.
