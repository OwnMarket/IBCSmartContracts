Functional Specification of bCHXMapping Smart Contract
=========================================

## High-level Overview

bCHXMapping smart contract is used to establish permanent relationship between CHX address on WeOwn native blockchain and BSC address on Binance Smart Chain. This is pre-requisite for bridge features and for moving CHX from one blockchain to another. Only when a pair of CHX and BSC addresses is written in this smart contract, actions of wrapping (moving CHX from WeOwn blockchain to Binance Smart Chain) and unwrapping (moving CHX from Binance Smart Chain to WeOwn blockchain) are permitted.

Important thing to have in mind is that one CHX address can only be mapped to one BSC address and vice versa.


## Mapping Through Wallet

Mapping process should be performed using the [Own wallet](https://wallet.weown.com). With the release 2.2, "Bridge" feature is introduced as a quick action. Clicking on quick action button and accepting the terms, would lead a user to the screen in which they should perform mapping. User should have installed [Metamask plugin](https://metamask.io/) when performing mapping. CHX address is taken from WeOwn wallet and BSC address is taken from MetaMask. Currently selected pair of addresses will be clearly written. Wallet would ask the user to submit Binance Smart Chain transaction through Metamask and that transaction invocation of the function `mapAddress` of `bCHXMapping` contract. After tx is successfully processed, mapping of CHX and BSC addresses is stored in this smart contract.


## Mapping Manually

Alternative to automated mapping process through WeOwn wallet is to perform mapping by submitting tx directly to `mapAddress` function. As a pre-requisite, you need to have CHX address and BSC address which you want to map. This set of instructions should be followed to perform manual mapping:

1. Go to WeOwn wallet, click on Advanced options -> Message signing -> Signing
2. Paste your BSC address you want to map to current CHX address and click “Sign message” button
3. Copy and save signature from the pop-up
4. Go to bCHXMapping contract through [BscScan](https://bscscan.com/address/0x766eaabd47c53f548cf225f8eb7ab300648fc236#writeContract)
5. Click on Contract -> Write Contract tab
6. Click on “Connect to Web3” button and select MetaMask on the pop-up. Instead of “Connect to Web3” button, you should see your BSC address. Currently selected MetaMask address is taken. If you want to change it, click on “Reset” button, open MetaMask plugin and select desired BSC address and repeat this step. Make sure BSC address is the same from step 2
7. Click on mapAddress function and enter CHX address from step 2 in the first field and signature from step 3 in second field
8. MetaMask plugin should open and you should click Confirm button to send BSC transaction

Alternative to usage of BscScan and MetaMask plugin is to use [MyEtherWallet](https://www.myetherwallet.com) or any other Binance Smart Chain wallet that helps you prepare, sign and send Binance Smart Chain transactions which interact with smart contracts.


## Mapping Removal

User cannot remove address mapping, as it could open frontrunning vulnerabilities in `bCHXToken` smart contract which heavily relies on this specific contract. If user is mistakenly mapped incorrect addresses, then they should create new CHX and new BSC address and perform correct mapping.

If there is really justified reason why address mapping should be removed, then that action can only be performed by contract owner which is WeOwn team. In this case, you should contact us via support@weown.com email and explain why you cannot simply create new address pair and move CHX holding there. If the reason is justified, support team would ask you to send small amount of CHX and BNB from both addresses to prove your ownership and we would remove it by invoking function `removeMappedAddress`.


## Other contract functions


### Reading contract 
- `chxAddress`: function that returns CHX address for given BSC address
- `bscAddress`: function that returns BSC address for given CHX address
- `signature`: function that returns signature for given CHX address (signed BSC address though WeOwn wallet, as a proof of ownership over CHX address)
- `owner`: function that returns address of contract owner. Function from base contract `Ownable`.

### Writing contract
- `drainStrayBNB`: function that allows contract owner to move mistakenly sent BNB to the contract
- `drainStrayTokens`: function that allows contract owner to move mistakenly sent BEP20 tokens to the contract
- `renounceOwnership`: function that allows contract owner to renounce ownership over the contract. Function from base contract `Ownable`.
- `transferOwnership`: function that allows contract owner to transfer ownership over the contract to some other BSC address. Function from base contract `Ownable`.