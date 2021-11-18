const helpers = require('./helpers.js')
const e18 = helpers.e18

const AssetBridge = artifacts.require('./OwnAssetBridge.sol')
const ERC20Token = artifacts.require('./ERC20Mintable.sol')

contract('OwnAssetBridge', accounts => {
    const admin = accounts[0]
    const ethAddress1 = accounts[1]
    const ethAddress2 = accounts[2]
    const ethAddress3 = accounts[3]

    let token1
    let token2
    let token3

    const asset1 = "assetHash1"
    const asset2 = "assetHash2"
    const asset3 = "assetHash3"

    const account1 = "accountHash1"
    const account2 = "accountHash2"
    const account3 = "accountHash3"

    const bridgeFee = e18(1)
    const targetTransferFee = e18(2)
    const nativeTransferFee = e18(2)

    const emptyAddress = "0x0000000000000000000000000000000000000000"

    let assetBridge
    let erc20Token

    beforeEach(async () => {
        assetBridge = await AssetBridge.new(bridgeFee, targetTransferFee, nativeTransferFee, {from: admin})
    })

    it('initializes correctly', async () => {
        assert(await assetBridge.governor() == admin, 'Governor mismatch')
        assert((await assetBridge.bridgeFee()).eq(bridgeFee), 'Bridge fee mismatch')
        assert((await assetBridge.targetTransferFee()).eq(targetTransferFee), 'Target transfer fee mismatch')
        assert((await assetBridge.nativeTransferFee()).eq(nativeTransferFee), 'Native transfer mismatch')
    })

    it('allow bridging existing ERC20', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})
        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter != tokenAddressBefore, 'Token address expected to change')
        assert(assetHashAfter != assetHashBefore, 'Asset hash expected to change')
        assert(accountHashAfter != accountHashBefore, 'Account hash expected to change')

        assert(tokenAddressAfter == token1.address, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')
    })

    it('reject bridging existing ERC20 to already bridged asset - 1', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})
        token2 = await ERC20Token.new("token2", "TKN2", e18(2000000), {from: admin})

        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token2.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token2.address, asset1, account2, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token2.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter == token1.address, 'Token address mismatch')
        assert(assetHashAfter == "", 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')
    })

    it('reject bridging existing ERC20 to already bridged asset - 2', async() => {
        // ARRANGE
        const assetName1 = "token1"
        const assetSymbol1 = "TKN1"
        const totalSupply1 = e18(1000000)

        const assetName2 = "token2"
        const assetSymbol2 = "TKN2"
        const totalSupply2 = e18(2000000)

        await assetBridge.bridgeAsset(asset1, account1, assetName1, assetSymbol1, totalSupply1, {from: admin, value: bridgeFee})
        token2 = await ERC20Token.new(assetName2, assetSymbol2, totalSupply2, {from: admin})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token2.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token2.address, asset1, account2, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token2.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(assetHashAfter == "", 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')
    })

    it('reject bridging already bridged ERC20 to asset', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})

        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset2)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset2)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token1.address, asset2, account2, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset2)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset2)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter == emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == "", 'Account hash mismatch')
    })

    it('reject bridging ERC20 to asset if tokens are already locked in the contract', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})

        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(assetBridge.address, e18(4000), {from: ethAddress1})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')
    })

    it('reject bridging ERC20 to asset if insufficient bridging fee is provided', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})

        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee.sub(e18(1))}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')
    })

    it('reject bridging ERC20 to asset if not called by governor', async() => {
        // ARRANGE
        token1 = await ERC20Token.new("token1", "TKN1", e18(1000000), {from: admin})

        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        await assetBridge.setGovernor(ethAddress1, {from: admin})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')
    })

    it('allow bridging new ERC20', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await assetBridge.bridgeAsset(asset1, account1, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(tokenAddressAfter)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        const token1 = new ERC20Token(tokenAddressAfter)
        const contractBalance = await token1.balanceOf(assetBridge.address)
        const tokenName = await token1.name()
        const tokenSymbol = await token1.symbol()
        const tokenTotalSupply = await token1.totalSupply()
        const tokenDecimals = await token1.decimals()

        assert(tokenAddressAfter != tokenAddressBefore, 'Token address expected to change')
        assert(accountHashAfter != accountHashBefore, 'Account hash expected to change')

        assert(tokenAddressAfter != emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')

        assert(contractBalance.eq(totalSupply), "Contract balance mismatch")
        assert(tokenName == assetName, "Token name mismatch")
        assert(tokenSymbol == assetSymbol, "Token symbol mismatch")
        assert(tokenTotalSupply.eq(totalSupply), "Total supply mismatch")
        assert(tokenDecimals.eq(web3.utils.toBN(18)), "Decimals mismatch")
    })

    it('reject bridging new ERC20 to already bridged asset - 1', async() => {
        // ARRANGE
        const assetName1 = "token1"
        const assetSymbol1 = "TKN1"
        const totalSupply1 = e18(1000000)

        const assetName2 = "token2"
        const assetSymbol2 = "TKN2"
        const totalSupply2 = e18(2000000)

        await assetBridge.bridgeAsset(asset1, account1, assetName1, assetSymbol1, totalSupply1, {from: admin, value: bridgeFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeAsset(asset1, account2, assetName2, assetSymbol2, totalSupply2, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(tokenAddressAfter)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        const token1 = new ERC20Token(tokenAddressAfter)
        const contractBalance = await token1.balanceOf(assetBridge.address)
        const tokenName = await token1.name()
        const tokenSymbol = await token1.symbol()
        const tokenTotalSupply = await token1.totalSupply()
        const tokenDecimals = await token1.decimals()

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter != emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')

        assert(contractBalance.eq(totalSupply1), "Contract balance mismatch")
        assert(tokenName == assetName1, "Token name mismatch")
        assert(tokenSymbol == assetSymbol1, "Token symbol mismatch")
        assert(tokenTotalSupply.eq(totalSupply1), "Total supply mismatch")
        assert(tokenDecimals.eq(web3.utils.toBN(18)), "Decimals mismatch")
    })

    it('reject bridging new ERC20 to already bridged asset - 2', async() => {
        // ARRANGE
        const assetName1 = "token1"
        const assetSymbol1 = "TKN1"
        const totalSupply1 = e18(1000000)

        const assetName2 = "token2"
        const assetSymbol2 = "TKN2"
        const totalSupply2 = e18(2000000)

        token1 = await ERC20Token.new(assetName1, assetSymbol1, totalSupply1, {from: admin})
        assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeAsset(asset1, account2, assetName2, assetSymbol2, totalSupply2, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(tokenAddressAfter)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        const tokenName = await token1.name()
        const tokenSymbol = await token1.symbol()
        const tokenTotalSupply = await token1.totalSupply()
        const tokenDecimals = await token1.decimals()

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter != emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')

        assert(tokenName == assetName1, "Token name mismatch")
        assert(tokenSymbol == assetSymbol1, "Token symbol mismatch")
        assert(tokenTotalSupply.eq(totalSupply1), "Total supply mismatch")
        assert(tokenDecimals.eq(web3.utils.toBN(18)), "Decimals mismatch")
    })

    it('reject bridging new ERC20 if insufficient bridging fee is provided', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeAsset(asset1, account1, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee.sub(e18(1))}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')
    })

    it('reject bridging new ERC20 if not called by governor', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)

        await assetBridge.setGovernor(ethAddress1, {from: admin})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.bridgeAsset(asset1, account1, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')
    })

    it('allow removing bridge if all tokens are on Ethereum', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, e18(10000), {from: admin})
        await token1.transfer(ethAddress2, e18(4000), {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await assetBridge.removeBridge(token1.address, {from: admin})

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter != tokenAddressBefore, 'Token address expected to change')
        assert(assetHashAfter != assetHashBefore, 'Asset hash expected to change')
        assert(accountHashAfter != accountHashBefore, 'Account hash expected to change')

        assert(tokenAddressAfter == emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == "", 'Asset hash mismatch')
        assert(accountHashAfter == "", 'Account hash mismatch')
    })

    it('allow removing bridge if all tokens are on native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = totalSupply.sub(tokenQty1)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        await assetBridge.transferToNativeChain(token1.address, account3,  tokenQty1, {from: ethAddress1, value: nativeTransferFee})
        await assetBridge.transferToNativeChain(token1.address, account3,  tokenQty2, {from: ethAddress2, value: nativeTransferFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await assetBridge.removeBridge(token1.address, {from: admin})

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter != tokenAddressBefore, 'Token address expected to change')
        assert(assetHashAfter != assetHashBefore, 'Asset hash expected to change')
        assert(accountHashAfter != accountHashBefore, 'Account hash expected to change')

        assert(tokenAddressAfter == emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == "", 'Asset hash mismatch')
        assert(accountHashAfter == "", 'Account hash mismatch')
    })

    it('reject removing bridge if tokens are on both chains', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = totalSupply.sub(tokenQty1)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        await assetBridge.transferToNativeChain(token1.address, account3,  tokenQty1, {from: ethAddress1, value: nativeTransferFee})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.removeBridge(token1.address, {from: admin}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter == token1.address, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')
    })

    it('reject removing bridge if not called by governor', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = totalSupply.sub(tokenQty1)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})
        await assetBridge.setGovernor(ethAddress1, {from: admin})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.removeBridge(token1.address, {from: admin}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter == token1.address, 'Token address mismatch')
        assert(assetHashAfter == asset1, 'Asset hash mismatch')
        assert(accountHashAfter == account1, 'Account hash mismatch')
    })

    it('reject removing bridge if ERC20 token is not bridged', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = totalSupply.sub(tokenQty1)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        const tokenAddressBefore = await assetBridge.erc20Tokens(asset1)
        const assetHashBefore = await assetBridge.assetHashes(token1.address)
        const accountHashBefore = await assetBridge.accountsForAssets(asset1)

        // ACT
        await helpers.shouldFail(assetBridge.removeBridge(token1.address, {from: admin}))

        // ASSERT
        const tokenAddressAfter = await assetBridge.erc20Tokens(asset1)
        const assetHashAfter = await assetBridge.assetHashes(token1.address)
        const accountHashAfter = await assetBridge.accountsForAssets(asset1)

        assert(tokenAddressAfter == tokenAddressBefore, 'Token address not expected to change')
        assert(assetHashAfter == assetHashBefore, 'Asset hash not expected to change')
        assert(accountHashAfter == accountHashBefore, 'Account hash not expected to change')

        assert(tokenAddressAfter == emptyAddress, 'Token address mismatch')
        assert(assetHashAfter == "", 'Asset hash mismatch')
        assert(accountHashAfter == "", 'Account hash mismatch')
    })

    it('allow minting token if created through bridging', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const newTotalSupply = e18(1500000)

        await assetBridge.bridgeAsset(asset1, account1, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})

        const tokenAddress = await assetBridge.erc20Tokens(asset1)
        const token1 = new ERC20Token(tokenAddress)

        const totalSupplyBefore = await token1.totalSupply()
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await assetBridge.mintErc20Token(tokenAddress, newTotalSupply.sub(totalSupply), {from: admin})

        // ASSERT
        const totalSupplyAfter = await token1.totalSupply()
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(!totalSupplyAfter.eq(totalSupplyBefore), 'Total supply expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(totalSupplyAfter.eq(newTotalSupply), 'Token total supply mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.add(newTotalSupply.sub(totalSupply))), 'Bridge balance mismatch')
    })

    it('reject minting token if not created through bridging', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const newTotalSupply = e18(1500000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await assetBridge.bridgeErc20Token(token1.address, asset1, account1, {from: admin, value: bridgeFee})

        const tokenAddress = await assetBridge.erc20Tokens(asset1)

        const totalSupplyBefore = await token1.totalSupply()
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.mintErc20Token(tokenAddress, newTotalSupply.sub(totalSupply), {from: admin}))

        // ASSERT
        const totalSupplyAfter = await token1.totalSupply()
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(totalSupplyAfter.eq(totalSupplyBefore), 'Total supply not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('reject minting token if not called by governor', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const newTotalSupply = e18(1500000)

        await assetBridge.bridgeAsset(asset1, account1, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        await assetBridge.setGovernor(ethAddress1, {from: admin})

        const tokenAddress = await assetBridge.erc20Tokens(asset1)
        const token1 = new ERC20Token(tokenAddress)

        const totalSupplyBefore = await token1.totalSupply()
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.mintErc20Token(tokenAddress, newTotalSupply.sub(totalSupply), {from: admin}))

        // ASSERT
        const totalSupplyAfter = await token1.totalSupply()
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(totalSupplyAfter.eq(totalSupplyBefore), 'Total supply not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('allow transfer to native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await assetBridge.transferToNativeChain(token1.address, account1,  tokenQty1, {from: ethAddress1, value: nativeTransferFee})
        await assetBridge.transferToNativeChain(token1.address, account2,  tokenQty2, {from: ethAddress2, value: nativeTransferFee})
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(!ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance expected to change')
        assert(!ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore.sub(tokenQty1)), 'Address 1 balance mismatch')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore.sub(tokenQty2)), 'Address 2 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.add(tokenQty1.add(tokenQty2))), 'Bridge balance mismatch')
    })

    it('reject transfer to native chain if insufficient approval', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1.sub(e18(1)), {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.transferToNativeChain(token1.address, account1,  tokenQty1, {from: ethAddress1, value: nativeTransferFee}))
        await assetBridge.transferToNativeChain(token1.address, account2,  tokenQty2, {from: ethAddress2, value: nativeTransferFee})
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(!ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance mismatch')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore.sub(tokenQty2)), 'Address 2 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.add(tokenQty2)), 'Bridge balance mismatch')
    })

    it('reject transfer to native chain if insufficient sender balance', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty1.add(tokenQty2), {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.transferToNativeChain(token1.address, account1,  tokenQty1, {from: ethAddress1, value: nativeTransferFee}))
        await assetBridge.transferToNativeChain(token1.address, account2,  tokenQty2, {from: ethAddress2, value: nativeTransferFee})
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(!ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance mismatch')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore.sub(tokenQty2)), 'Address 2 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.add(tokenQty2)), 'Bridge balance mismatch')
    })

    it('reject transfer to native chain if ERC20 token not bridged', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.transferToNativeChain(token1.address, account1,  tokenQty1, {from: ethAddress1, value: nativeTransferFee}))
        await helpers.shouldFail(assetBridge.transferToNativeChain(token1.address, account2,  tokenQty2, {from: ethAddress2, value: nativeTransferFee}))
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('reject transfer to native chain if insufficient transfer fee', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.transferToNativeChain(token1.address, account1,  tokenQty1, {from: ethAddress1, value: nativeTransferFee.sub(e18(1))}))
        await assetBridge.transferToNativeChain(token1.address, account2,  tokenQty2, {from: ethAddress2, value: nativeTransferFee})
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(!ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance mismatch')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore.sub(tokenQty2)), 'Address 2 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.add(tokenQty2)), 'Bridge balance mismatch')
    })

    it('allow transfer from native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1Before = await assetBridge.pendingSignedTxs(txHash1)
        const signature2Before = await assetBridge.pendingSignedTxs(txHash2)

        // ACT
        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1After = await assetBridge.pendingSignedTxs(txHash1)
        const signature2After = await assetBridge.pendingSignedTxs(txHash2)

        assert(recipient1After != recipient1Before, 'Recipient of tx 1 expected to change')
        assert(recipient2After != recipient2Before, 'Recipient of tx 2 expected to change')
        assert(signature1After != signature1Before, 'Signature of tx 1 expected to change')
        assert(signature2After != signature2Before, 'Signature of tx 2 expected to change')

        assert(recipient1After == ethAddress2, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(signature1After == signature1, 'Signature of tx 1 mismatch')
        assert(signature2After == signature2, 'Signature of tx 2 mismatch')
    })

    it('reject transfer from native chain if tx hash already has recipient', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash1"
        const signature1 = "signature1"
        const signature2 = "signature2"

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1Before = await assetBridge.pendingSignedTxs(txHash1)
        const signature2Before = await assetBridge.pendingSignedTxs(txHash2)

        // ACT
        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await helpers.shouldFail(assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1After = await assetBridge.pendingSignedTxs(txHash1)
        const signature2After = await assetBridge.pendingSignedTxs(txHash2)

        assert(recipient1After != recipient1Before, 'Recipient of tx 1 expected to change')
        assert(recipient2After != recipient2Before, 'Recipient of tx 2 expected to change')
        assert(signature1After != signature1Before, 'Signature of tx 1 expected to change')
        assert(signature2After != signature2Before, 'Signature of tx 2 expected to change')

        assert(recipient1After == ethAddress2, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress2, 'Recipient of tx 2 mismatch')
        assert(signature1After == signature1, 'Signature of tx 1 mismatch')
        assert(signature2After == signature1, 'Signature of tx 2 mismatch')
    })

    it('reject transfer from native chain if insufficient transfer fee is provided', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1Before = await assetBridge.pendingSignedTxs(txHash1)
        const signature2Before = await assetBridge.pendingSignedTxs(txHash2)

        // ACT
        await helpers.shouldFail(assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee.sub(e18(1))}))
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const signature1After = await assetBridge.pendingSignedTxs(txHash1)
        const signature2After = await assetBridge.pendingSignedTxs(txHash2)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After != recipient2Before, 'Recipient of tx 2 expected to change')
        assert(signature1After == signature1Before, 'Signature of tx 1 not expected to change')
        assert(signature2After != signature2Before, 'Signature of tx 2 expected to change')

        assert(recipient1After == emptyAddress, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(signature1After == '', 'Signature of tx 1 mismatch')
        assert(signature2After == signature2, 'Signature of tx 2 mismatch')
    })

    it('allow confirming transfer from native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"
        const tokenQty1 = e18(300)

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await assetBridge.confirmTransfer(txHash1, token1.address, tokenQty1, {from: admin})
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After != recipient1Before, 'Recipient of tx 1 expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(recipient1After == emptyAddress, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance mismatch')
        assert(address2BalanceAfter.eq(address2BalanceBefore.add(tokenQty1)), 'Address 2 balance mismatch')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.sub(tokenQty1)), 'Bridge balance mismatch')
    })

    it('reject confirming non-existing transfer from native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"
        const tokenQty1 = e18(300)

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.confirmTransfer(txHash1, token1.address, tokenQty1, {from: admin}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')

        assert(recipient1After == emptyAddress, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance mismatch')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance mismatch')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance mismatch')
    })

    it('reject confirming transfer from native chain if not called by contract owner', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"
        const tokenQty1 = e18(300)

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.confirmTransfer(txHash1, token1.address, tokenQty1, {from: ethAddress1}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')

        assert(recipient1After == ethAddress2, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance mismatch')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance mismatch')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance mismatch')
    })

    it('reject confirming transfer from native chain if tokens were not locked', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"
        const tokenQty1 = e18(300)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty1, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.confirmTransfer(txHash1, token1.address, tokenQty1, {from: admin}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')

        assert(recipient1After == ethAddress2, 'Recipient of tx 1 mismatch')
        assert(recipient2After == ethAddress3, 'Recipient of tx 2 mismatch')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance mismatch')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance mismatch')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance mismatch')
    })

    it('allow reverting transfer from native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2,  ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await assetBridge.revertTransferFromNativeChain(txHash1, {from: admin})
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After != recipient1Before, 'Recipient of tx 1 expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')

        assert(recipient1After == emptyAddress, 'Recipient of tx 1 mismatch')
    })

    it('reject reverting non-existing transfer from native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.revertTransferFromNativeChain(txHash1, {from: admin}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')

        assert(recipient1After == emptyAddress, 'Recipient of tx 1 mismatch')
    })

    it('reject reverting transfer from native chain if not called by owner', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const txHash1 = "txHash1"
        const txHash2 = "txHash2"
        const signature1 = "signature1"
        const signature2 = "signature2"

        await assetBridge.bridgeAsset(asset1, account3, assetName, assetSymbol, totalSupply, {from: admin, value: bridgeFee})
        token1 = new ERC20Token(await assetBridge.erc20Tokens(asset1))

        await assetBridge.transferFromNativeChain(txHash1, signature1, ethAddress2, {from: ethAddress1, value: targetTransferFee})
        await assetBridge.transferFromNativeChain(txHash2, signature2, ethAddress3, {from: ethAddress2, value: targetTransferFee})

        const recipient1Before = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2Before = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceBefore = await token1.balanceOf(ethAddress1)
        const address2BalanceBefore = await token1.balanceOf(ethAddress2)
        const address3BalanceBefore = await token1.balanceOf(ethAddress3)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.revertTransferFromNativeChain(txHash1, {from: ethAddress1}))
        
        // ASSERT
        const recipient1After = await assetBridge.pendingCrossChainTransfers(txHash1)
        const recipient2After = await assetBridge.pendingCrossChainTransfers(txHash2)
        const address1BalanceAfter = await token1.balanceOf(ethAddress1)
        const address2BalanceAfter = await token1.balanceOf(ethAddress2)
        const address3BalanceAfter = await token1.balanceOf(ethAddress3)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(recipient1After == recipient1Before, 'Recipient of tx 1 not expected to change')
        assert(recipient2After == recipient2Before, 'Recipient of tx 2 not expected to change')
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Address 1 balance not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Address 2 balance not expected to change')
        assert(address3BalanceAfter.eq(address3BalanceBefore), 'Address 3 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('allow reverting transfer to native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const txHash1 = (await assetBridge.transferToNativeChain(token1.address, account1, tokenQty1, {from: ethAddress1, value: nativeTransferFee})).tx
        const txHash2 = (await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})).tx

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await assetBridge.revertTransferToNativeChain(txHash1, token1.address, ethAddress1, tokenQty1, {from: admin})
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(!ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance expected to change')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance not expected to change')
        assert(!bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance expected to change')

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore.add(tokenQty1)), 'Address 1 balance mismatch')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance mismatch')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore.sub(tokenQty1)), 'Bridge balance mismatch')
    })

    it('reject reverting transfer to native chain if not called by the owner', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const txHash1 = (await assetBridge.transferToNativeChain(token1.address, account1, tokenQty1, {from: ethAddress1, value: nativeTransferFee})).tx
        const txHash2 = (await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})).tx

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.revertTransferToNativeChain(txHash1, token1.address, ethAddress1, tokenQty1, {from: ethAddress1}))
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('reject reverting non-existing transfer to native chain', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        const txHash2 = (await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})).tx

        const ethAddress1BalanceBefore = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceBefore = await token1.balanceOf(ethAddress2)
        const bridgeBalanceBefore = await token1.balanceOf(assetBridge.address)

        // ACT
        await helpers.shouldFail(assetBridge.revertTransferToNativeChain("fakeTxHash", token1.address, ethAddress1, tokenQty1, {from: admin}))
        
        // ASSERT
        const ethAddress1BalanceAfter = await token1.balanceOf(ethAddress1)
        const ethAddress2BalanceAfter = await token1.balanceOf(ethAddress2)
        const bridgeBalanceAfter = await token1.balanceOf(assetBridge.address)

        assert(ethAddress1BalanceAfter.eq(ethAddress1BalanceBefore), 'Address 1 balance not expected to change')
        assert(ethAddress2BalanceAfter.eq(ethAddress2BalanceBefore), 'Address 2 balance not expected to change')
        assert(bridgeBalanceAfter.eq(bridgeBalanceBefore), 'Bridge balance not expected to change')
    })

    it('allow setting governor to the owner', async() => {
        // ARRANGE
        const governorBefore = await assetBridge.governor()

        // ACT
        await assetBridge.setGovernor(ethAddress1, {from: admin})
        
        // ASSERT
        const governorAfter = await assetBridge.governor()

        assert(governorAfter != governorBefore, 'Governor expected to change')
        assert(governorAfter == ethAddress1, 'Governor address mismatch')
    })

    it('reject setting governor if not called by the owner', async() => {
        // ARRANGE
        await assetBridge.setGovernor(ethAddress1, {from: admin})
        const governorBefore = await assetBridge.governor()

        // ACT
        await helpers.shouldFail(assetBridge.setGovernor(ethAddress2, {from: ethAddress1}))
        
        // ASSERT
        const governorAfter = await assetBridge.governor()

        assert(governorAfter == governorBefore, 'Governor not expected to change')
        assert(governorAfter == ethAddress1, 'Governor address mismatch')
    })

    it('allow setting bridgeFee to the owner', async() => {
        // ARRANGE
        const newBridgeFee = e18(10)
        const bridgeFeeBefore = await assetBridge.bridgeFee()

        // ACT
        await assetBridge.setBridgeFee(newBridgeFee, {from: admin})
        
        // ASSERT
        const bridgeFeeAfter = await assetBridge.bridgeFee()

        assert(!bridgeFeeAfter.eq(bridgeFeeBefore), 'Bridge fee expected to change')
        assert(bridgeFeeAfter.eq(newBridgeFee), 'Bridge fee address mismatch')
    })

    it('reject setting bridgeFee if not called by the owner', async() => {
        // ARRANGE
        const newBridgeFee = e18(10)
        const bridgeFeeBefore = await assetBridge.bridgeFee()

        // ACT
        await helpers.shouldFail(assetBridge.setBridgeFee(newBridgeFee, {from: ethAddress1}))
        
        // ASSERT
        const bridgeFeeAfter = await assetBridge.bridgeFee()

        assert(bridgeFeeAfter.eq(bridgeFeeBefore), 'Bridge fee not expected to change')
    })

    it('allow setting targetTransferFee to the owner', async() => {
        // ARRANGE
        const newTargetTransferFee = e18(10)
        const targetTransferFeeBefore = await assetBridge.targetTransferFee()

        // ACT
        await assetBridge.setTargetTransferFee(newTargetTransferFee, {from: admin})
        
        // ASSERT
        const targetTransferFeeAfter = await assetBridge.targetTransferFee()

        assert(!targetTransferFeeAfter.eq(targetTransferFeeBefore), 'Target transfer Fee expected to change')
        assert(targetTransferFeeAfter.eq(newTargetTransferFee), 'Target transfer Fee address mismatch')
    })

    it('reject setting targetTransferFee if not called by the owner', async() => {
        // ARRANGE
        const newTargetTransferFee = e18(10)
        const targetTransferFeeBefore = await assetBridge.targetTransferFee()

        // ACT
        await helpers.shouldFail(assetBridge.setTargetTransferFee(newTargetTransferFee, {from: ethAddress1}))
        
        // ASSERT
        const targetTransferFeeAfter = await assetBridge.targetTransferFee()

        assert(targetTransferFeeAfter.eq(targetTransferFeeBefore), 'Target Transfer Fee not expected to change')
    })

    it('allow setting nativeTransferFee to the owner', async() => {
        // ARRANGE
        const newNativeTransferFee = e18(10)
        const nativeTransferFeeBefore = await assetBridge.nativeTransferFee()

        // ACT
        await assetBridge.setNativeTransferFee(newNativeTransferFee, {from: admin})
        
        // ASSERT
        const nativeTransferFeeAfter = await assetBridge.nativeTransferFee()

        assert(!nativeTransferFeeAfter.eq(nativeTransferFeeBefore), 'Native Transfer Fee expected to change')
        assert(nativeTransferFeeAfter.eq(newNativeTransferFee), 'Native Transfer Fee address mismatch')
    })

    it('reject setting nativeTransferFee if not called by the owner', async() => {
        // ARRANGE
        const newNativeTransferFee = e18(10)
        const nativeTransferFeeBefore = await assetBridge.nativeTransferFee()

        // ACT
        await helpers.shouldFail(assetBridge.setNativeTransferFee(newNativeTransferFee, {from: ethAddress1}))
        
        // ASSERT
        const nativeTransferFeeAfter = await assetBridge.nativeTransferFee()

        assert(nativeTransferFeeAfter.eq(nativeTransferFeeBefore), 'Native Transfer Fee not expected to change')
    })

    it('allow withdrawing collected fees to owner', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        await assetBridge.transferToNativeChain(token1.address, account1, tokenQty1, {from: ethAddress1, value: nativeTransferFee})
        await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})

        const bridgeFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(admin))

        // ACT
        await assetBridge.withdrawFee(bridgeFeeBalanceBefore, {from: admin})
        
        // ASSERT
        const bridgeFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(admin))

        assert(!bridgeFeeBalanceAfter.eq(bridgeFeeBalanceBefore), 'Bridge balance expected to change')
        assert(!adminFeeBalanceAfter.eq(adminFeeBalanceBefore), 'Admin balance expected to change')

        assert(bridgeFeeBalanceAfter.eq(e18(0)), 'Bridge balance after mismatch')
        assert(bridgeFeeBalanceBefore.eq(bridgeFee.add(nativeTransferFee).add(nativeTransferFee)), 'Bridge balance before mismatch')
    })

    it('reject withdrawing collected fees if not called by the owner', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        await assetBridge.transferToNativeChain(token1.address, account1, tokenQty1, {from: ethAddress1, value: nativeTransferFee})
        await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})

        const bridgeFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(admin))
        const address1EthBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(ethAddress1))

        // ACT
        await helpers.shouldFail(assetBridge.withdrawFee(bridgeFeeBalanceBefore, {from: ethAddress1}))
        
        // ASSERT
        const bridgeFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(admin))
        const address1EthBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(ethAddress1))

        assert(bridgeFeeBalanceAfter.eq(bridgeFeeBalanceBefore), 'Bridge balance not expected to change')
        assert(adminFeeBalanceAfter.eq(adminFeeBalanceBefore), 'Admin balance not expected to change')
        assert(!address1EthBalanceAfter.gt(address1EthBalanceBefore), 'Address 1 balance mismatch')
    })

    it('reject withdrawing collected fees to owner if greater than bridge balance', async() => {
        // ARRANGE
        const assetName = "token1"
        const assetSymbol = "TKN1"
        const totalSupply = e18(1000000)
        const tokenQty1 = e18(600000)
        const tokenQty2 = e18(300000)

        token1 = await ERC20Token.new(assetName, assetSymbol, totalSupply, {from: admin})
        await token1.transfer(ethAddress1, totalSupply, {from: admin})
        await token1.transfer(ethAddress2, tokenQty2, {from: ethAddress1})

        await assetBridge.bridgeErc20Token(token1.address, asset1, account3, {from: admin, value: bridgeFee})

        await token1.approve(assetBridge.address, tokenQty1, {from: ethAddress1})
        await token1.approve(assetBridge.address, tokenQty2, {from: ethAddress2})

        await assetBridge.transferToNativeChain(token1.address, account1, tokenQty1, {from: ethAddress1, value: nativeTransferFee})
        await assetBridge.transferToNativeChain(token1.address, account2, tokenQty2, {from: ethAddress2, value: nativeTransferFee})

        const bridgeFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(admin))

        // ACT
        await helpers.shouldFail(assetBridge.withdrawFee(bridgeFeeBalanceBefore.add(e18(1)), {from: admin}))
        
        // ASSERT
        const bridgeFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(assetBridge.address))
        const adminFeeBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(admin))

        assert(bridgeFeeBalanceAfter.eq(bridgeFeeBalanceBefore), 'Bridge balance not expected to change')
        assert(!adminFeeBalanceAfter.gt(adminFeeBalanceBefore), 'Admin balance mismatch')
    })
})
