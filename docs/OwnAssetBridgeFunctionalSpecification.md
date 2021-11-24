Functional Specification of Own Asset Bridge Smart Contract
=========================================

## High-level Overview
Asset bridge is a smart contract designed to enable cross-chain transfers of tokens between WeOwn blockchain and other EVM-based blockchains: primarily Ethereum and Binance Smart Chain. Separate contract instance is deployed to every blockchain and controls bridging and transfers between WeOwn blockchain and that specific blockchain. 

Bridging is a term which means establishing relationship between ERC20 token on EVM-based blockchain (named as target blockchain for this purpose) and asset on WeOwn blockchain. Bridging and unbridging is only allowed to a governor address. Initially, it is the address controlled by WeOwn team, but with perspective to introduce distributed governance: establishing smart contract through which network participants will be able to decide which assets will be bridged and under which conditions.

Cross-chain transfer is a term which means transferring holding in bridged asset between an address on target blockchain and account on WeOwn blockchain. It is available to any holder of bridged assets on WeOwn or target blockchain. Holder of bridged asset A on WeOwn blockchain is able to transfer tokens to any address on target blockchain and holder of bridged ERC20 token on target blockchain is able to transfer tokens to any account on WeOwn blockchain.

Cross-chain transfers are performed by locking tokens on side of the bridge from which tokens are leaving. If tokens are transferred from WeOwn blockchain to target blockchain, there will be purposely dedicated account that will hold these tokens during their circulation on target blockchain. This account is controlled by sync engine and address performing cross-chain transfer needs to transfer tokens to this account. On the other side, if tokens are transferred from target blockchain, they need to be sent to bridge smart contract which will hold them locked while they circulate on WeOwn blockchain.

All governance-related activities and all cross-chain transfers are done through asset transfers on WeOwn blockchain and through interaction with this smart contract. All cross-chain transfers are captured by sync engine developed by WeOwn team which initiates counter-transfer. In order to make user experience as smooth as possible, WeOwn team developed powerful UI within [WeOwn wallet](https://wallet.weown.com).

**In order to use the bridge and to execute cross-chain transfers, users do not need to know and understand features of bridge smart contract, sync engine or bridge API. They can use self-explanatory user interface of WeOwn wallet application. In fact, that is only recommended way of interacting with the smart contract which minimizes possibilities of making mistakes and producing errors. All further explanations are intended for developers and technology enthusiasts who want to understand functioning of the asset bridge more deeply and who want to validate transparent and trustless behavior of the asset bridge.**

## Governance

Governance of the bridge assumes following activities:
1. Creating bridge between existing ERC20 token on target blockchain and asset on WeOwn blockchain. It is done by invoking contract method `bridgeErc20Token`. It requires submission of following parameters:
- `_token` - address of ERC20 token on target blockchain
- `assetHash` - hash of newly created asset on WeOwn blockchain
- `accountHash` - hash of the account on WeOwn blockchain that will hold all locked tokens on WeOwn blockchain i.e. tokens that are circulating on the target blockchain. Balance of this account will always represent tokens of that asset that are circulating on target blockchain. 
Governor needs to take care that consistency is reached. Initially, balance of mentioned account should be equal to the current total supply of ERC20 token, representing that all existing tokens are circulating on target blockchain.
Invoking this method requires that governor pays `bridgeFee` in native currency of target blockchain (i.e. ETH, BNB) which will be used to cover costs of maintaining bridge infrastructure existing outside of smart contract.

2. Creating bridge between asset existing on WeOwn blockchain and ERC20 token that will be created in this process. It is done by invoking contract method `bridgeAsset`. This method will create new ERC20 token that will be an image of WeOwn blockchain's asset on target blockchain and bridge between the asset and the token. It accepts following parameters:
- `assetHash` - hash of asset on WeOwn blockchain
- `accountHash` - hash of the account on WeOwn blockchain that will hold all locked tokens on WeOwn blockchain i.e. tokens that are circulating on the target blockchain. Balance of this account will always represent tokens of that asset that are circulating on target blockchain. 
- `assetName` - name of ERC20 token that will be created
- `assetSymbol` - symbol of ERC20 token that will be created. It needs to correspond to asset code of asset on WeOwn blockchain
- `totalSupply` - total supply of ERC20 token that will be created. It needs to correspond to total supply of asset on WeOwn blockchain
Newly created ERC20 token will be mintable, but not burnable. Reason for that is to follow attributes of assets on WeOwn blockchain whose total supply can be increased, but not decreased.
Governor needs to take care that consistency is reached. Initially, balance of mentioned account should be equal to 0, representing that all existing tokens are circulating on WeOwn blockchain.
Invoking this method requires that governor pays `bridgeFee` in native currency of target blockchain (i.e. ETH, BNB) which will be used to cover costs of maintaining bridge infrastructure existing outside of smart contract.

3. Removing bridge between asset and ERC20 token by invoking method `removeBridge`. Method requires passing ERC20 token address and requires that holding of the bridge in this token is 0 (meaning that all tokens will stay on target blockchain after bridge is removed) or equal to total supply (meaning that tokens will stay on WeOwn blockchain after bridge is removed). Essentially, bridge cannot be removed as long as tokens exist on both blockchains.

4. Minting ERC20 token created through bridging by invoking `mintErc20Token` method. As the bridge becomes owner of ERC20 token created through bridging process, this method gives capabilities to governor to increase total supply of token, when this change happens on WeOwn blockchain. This method accepts to parameters:
- `_token` - address of ERC20 token which total supply will be increased.
- `amount` - amount by which total supply increases

As mentioned in the introduction, all these activities can be done exclusively by the governor address. It is governor's task to take care of consistency, where consistency cannot be achieved automatically. Initially, it is the address controlled by WeOwn team, but with perspective to introduce distributed governance: establishing smart contract through which network participants will be able to decide which assets will be bridged and under which conditions.

## Transfers

Users who want to perform cross-chain transfers have two contract methods which they can invoke, based on direction of the cross-chain transfer. These are:
1. `transferToNativeChain` method which will initiate transfer of tokens from target blockchain to WeOwn (native) blockchain. When invoking, following parameters need to be passed:
- `_token` - address of ERC20 token which will be transferred to WeOwn blockchain
- `_recipientAccountHash`- hash of an account on WeOwn blockchain that will receive tokens
- `_amount` - amount of tokens that will be transferred
For successful transfer, several pre-conditions need to be satisfied:
- tx sender holds balance in specified token equal or greater than specified amount
- tx sender approved bridge smart contract to spend amount equal or greater than specified amount
- specified ERC20 token is bridged to asset on WeOwn blockchain
- recipient account hash exists on WeOwn blockchain. Important notice: even if this condition is not satisfied, transaction will be successful, but transfer will be later reverted by the sync engine.
When invoking this method, sender needs to pay fee in native currency of target blockchain (ETH, BNB etc.) which will be used to cover expenses of making transaction on WeOwn blockchain and to cover infrastructure costs related to this transfer. Fee paid needs to be equal or greater than `nativeTransferFee` which is stored in the smart contract and readable by the call of the function with the same name.

2. `transferFromNativeChain` method which will prepare transfer of tokens from WeOwn blockchain to target blockchain. Order of execution of steps in very important here:
- First, user needs to prepare transaction on WeOwn blockchain. Tx should consist of one action `transferAsset` in which user specifies asset and amount of tokens that needs to be transferred. `ToAccountHash` needs to be account hash which locks tokens on WeOwn blockchain for specific asset. It can be determined by calling `accountsForAssets` function from bridge smart contract and passing asset hash whose tokens will be transferred. **This transaction should be prepared, but not submitted.**
- Second, user needs to sign tx hash of this transaction by their private key.
- Third, user needs to invoke `transferFromNativeChain` method and pass tx hash from WeOwn blockchain (1st step), signature (2nd step) and intended recipient on target blockchain.
- Fourth, user needs to submit transaction prepared in 1st step to WeOwn blockchain
When sync engine detects asset transfer on WeOwn blockchain, it will find tx hash in the smart contract (this is why the order of steps is important), check signature to verify tx sender and release tokens on target blockchain to intended recipient.
When invoking `transferFromNativeChain` method, sender needs to pay fee in native currency of target blockchain (ETH, BNB etc.) which will be used to cover expenses of making transaction on target blockchain and to cover infrastructure costs related to this transfer. Fee paid needs to be equal or greater than `targetTransferFee` which is stored in the smart contract and readable by the call of the function with the same name.

## Contract management

Contract management is responsibility of contract owner and it revolves around setting fees, confirming and reverting transfers. It is done by sync engine developed by WeOwn team and performed through following contract methods:
1. `confirmTransfer` - method by which contract owner confirms validity of cross-chain transfer in direction from WeOwn blockchain to target blockchain. This method will release tokens to the recipient after sync engine detects transfer on WeOwn blockchain. Method contains following parameters:
- `_txHash` - tx containing asset transfer on WeOwn blockchain
- `_token` - address of bridged ERC20 token deducted from tx on WeOwn blockchain
- `_amount` - amount of tokens that need to be released

2. `revertTransferFromNativeChain` - method which removes information about tx, signature and recipient of cross-chain transfer originating from WeOwn blockchain from bridge smart contract. The only parameter is `_txHash`. It will be invoked in cases such as incorrect signature. Together with invoking this method, sync engine will refund asset tokens on WeOwn blockchain.

3. `revertTransferToNativeChain` - method which refunds sent ERC20 tokens to the sender in case of failed cross-chain transfer originating from target blockchain. It will be invoked in cases such as non-existing or forbidden recipient account hash. It contains following parameters:
- `_txHash` - hash of tx on target blockchain which initiated failed cross-chain transfer
- `_token` - ERC20 token which will be refunded
- `_recipient` - original sender of failed cross-chain transfer
- `_amount` - amount of tokens that will be refunded

4. `setNativeTransferFee`, `setTargetTransferFee` and `setGovernorFee` are methods used to set fees. Their purpose is explained in previous section of this document

5. `setGovernor` is method by which contract owner determines address which will serve as governor.

6. `withdrawFee` is method by which contract owner can withdraw fees collected through bridging and transfers.

7. `transferOwnership` and `renounceOwnership` are methods inherited from `Ownable` smart contract and they allow contract owner to transfer contract ownership to other address or to remove ownership completely. 

## Reading functions

Even though most of them are explained above, this is the complete list of all reading functions of bridge smart contract:
- `assetHashes` - returns asset hash for provided address of bridged ERC20 token
- `erc20Tokens` - returns ERC20 token address for provided hash of bridged asset
- `accountsForAssets`- returns account used for locking tokens of bridged asset specified by asset hash
- `owner` - bridge contract owner address
- `governor` - governor address
- `bridgeFee` - fee for creating bridge between asset and ERC20 token
- `nativeTransferFee` - fee for cross-chain transfer from target to WeOwn blockchain
- `targetTransferFee` - fee for cross-chain transfer from WeOwn to target blockchain
- `pendingCrossChainTransfers` - returns intended recipient of pending cross-chain transfer originating from WeOwn blockchain, identified by passed tx hash  
- `pendingSignedTxs` - returns signature of provided tx hash, representing cross-chain transfer originating from WeOwn blockchain