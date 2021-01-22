const helpers = require('./helpers.js')
const e7 = helpers.e7

const WCHXMapping = artifacts.require('./wCHXMapping.sol')
const wCHXToken = artifacts.require('./wCHXToken.sol')

contract('wCHXToken', accounts => {
    const admin = accounts[0]
    const ethAddress1 = accounts[1]
    const ethAddress2 = accounts[2]
    const ethAddress3 = accounts[2]

    const chxAddress1 = "CH111111111111111111111111111111111"
    const chxAddress2 = "CH222222222222222222222222222222222"
    const chxAddress3 = "CH333333333333333333333333333333333"

    const signature1 = "signature1"
    const signature2 = "signature2"
    const signature3 = "signature3"

    let wChxToken
    let wChxMapping

    beforeEach(async () => {
        wChxMapping = await WCHXMapping.new()
        wChxToken = await wCHXToken.new(wChxMapping.address)
    })

    it('initializes correctly', async () => {
        const totalSupply = e7(0)
        const cap =  web3.utils.toBN(168956522.0930844 * Math.pow(10, 7))
        const minSwapAmount = e7(1000)
        
        assert(await wChxToken.decimals() == 7, 'Decimals mismatch')
        assert((await wChxToken.totalSupply()).eq(totalSupply), 'Total supply mismatch')
        assert((await wChxToken.balanceOf(admin)).eq(totalSupply), 'Admin balance mismatch')
        assert((await wChxToken.cap()).eq(cap), 'Cap mismatch')
        assert((await wChxToken.minSwapAmount()).eq(minSwapAmount), 'MinSwapAmount mismatch')
    })

    it('allow swap for owner', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxToken.swap(ethAddress1, tokenQty, {from: admin})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')

        assert(address1BalanceAfter.eq(tokenQty), 'Balance of address 1 mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty), 'Total supply mismatch')
    })

    it('reject swap if recipient address is not mapped', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await helpers.shouldFail(wChxToken.swap(ethAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
    })

    it('reject swap if mapping of recipient address is removed', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})
        await wChxMapping.removeMappedAddress(ethAddress1, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await helpers.shouldFail(wChxToken.swap(ethAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
    })

    it('reject swap if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await helpers.shouldFail(wChxToken.swap(ethAddress2, tokenQty, {from: ethAddress1}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await wChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('reject swap if amount grater than cap', async() => {
        // ARRANGE
        const tokenQty = e7(168956522).add(e7(1))
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await helpers.shouldFail(wChxToken.swap(ethAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await wChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('allow multiple swaps for owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.swap(ethAddress2, tokenQty2, {from: admin})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2), 'Balance of address 2 mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('reject multiple swaps if total supply would exceed cap', async() => {
        // ARRANGE
        const tokenQty1 = e7(168956522)
        const tokenQty2 = e7(1)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await helpers.shouldFail(wChxToken.swap(ethAddress2, tokenQty2, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')

        assert(address1BalanceAfter.eq(tokenQty1), 'Balance of address 1 mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow transfers between addresses', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.swap(ethAddress2, tokenQty2, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxToken.transfer(ethAddress2, tokenQty3, {from: ethAddress1})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of address 2 mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transfers between addresses even if mapping does not exist', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.swap(ethAddress2, tokenQty2, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxMapping.removeMappedAddress(ethAddress1, {from: admin})
        await wChxMapping.removeMappedAddress(ethAddress2, {from: admin})

        await wChxToken.transfer(ethAddress2, tokenQty3, {from: ethAddress1})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of owner expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transfer to contract owner if address is mapped and amount greater than minSwapAmount', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await wChxToken.transfer(admin, tokenQty3, {from: ethAddress1})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!adminBalanceAfter.eq(adminBalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(address1BalanceBefore.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(adminBalanceAfter.eq(adminBalanceBefore.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transfer to contract owner if address is not mapped', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await wChxMapping.removeMappedAddress(ethAddress1, {from: admin})

        await helpers.shouldFail(wChxToken.transfer(admin, tokenQty3, {from: ethAddress1}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transfer to contract owner if amount is smaller than minSwapAmount', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount.sub(e7(1))
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await helpers.shouldFail(wChxToken.transfer(admin, tokenQty3, {from: ethAddress1}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow transferFrom functions between addresses', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.swap(ethAddress2, tokenQty2, {from: admin})
        wChxToken.approve(ethAddress3, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxToken.transferFrom(ethAddress1, ethAddress2, tokenQty3, {from: ethAddress3})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of address 2 mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transferFrom functions between addresses even if mapping does not exist', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wChxMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.swap(ethAddress2, tokenQty2, {from: admin})
        wChxToken.approve(ethAddress3, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceBefore = await wChxToken.balanceOf(ethAddress2)

        // ACT
        await wChxMapping.removeMappedAddress(ethAddress1, {from: admin})
        await wChxMapping.removeMappedAddress(ethAddress2, {from: admin})

        await wChxToken.transferFrom(ethAddress1, ethAddress2, tokenQty3, {from: ethAddress3})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const address2BalanceAfter = await wChxToken.balanceOf(ethAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of owner expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transferFrom function to contract owner if address is mapped and amount grater than minSwapAmount', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        wChxToken.approve(ethAddress3, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await wChxToken.transferFrom(ethAddress1, admin, tokenQty3, {from: ethAddress3})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!adminBalanceAfter.eq(adminBalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(address1BalanceBefore.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(adminBalanceAfter.eq(adminBalanceBefore.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transferFrom function to contract owner if address is not mapped', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        wChxToken.approve(ethAddress3, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await wChxMapping.removeMappedAddress(ethAddress1, {from: admin})

        await helpers.shouldFail(wChxToken.transferFrom(ethAddress1, admin, tokenQty3, {from: ethAddress3}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transferFrom function to contract owner if amount smaller than minSwapAmount', async() => {
        // ARRANGE
        const minSwapAmount = await wChxToken.minSwapAmount();
        const tokenQty1 = minSwapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minSwapAmount.sub(e7(1))
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        wChxToken.approve(ethAddress3, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await helpers.shouldFail(wChxToken.transferFrom(ethAddress1, admin, tokenQty3, {from: ethAddress3}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')
        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow burning tokens if any by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.transfer(admin, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await wChxToken.burn(tokenQty3, {from: admin})

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(!adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner expected to change')

        assert(adminBalanceAfter.eq(e7(0)), 'Balance of owner mismatch')
        assert((await wChxToken.totalSupply()).eq(tokenQty1.sub(tokenQty3)), 'Total supply mismatch')
    })

    it('reject burning tokens if none by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await helpers.shouldFail(wChxToken.burn(tokenQty3, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')

        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject burning tokens if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await wChxMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        await wChxToken.swap(ethAddress1, tokenQty1, {from: admin})
        await wChxToken.transfer(admin, tokenQty3, {from: ethAddress1})

        const address1BalanceBefore = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceBefore = await wChxToken.balanceOf(admin)

        // ACT
        await helpers.shouldFail(wChxToken.burn(tokenQty3, {from: ethAddress1}))

        // ASSERT
        const address1BalanceAfter = await wChxToken.balanceOf(ethAddress1)
        const adminBalanceAfter = await wChxToken.balanceOf(admin) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(adminBalanceAfter.eq(adminBalanceBefore), 'Balance of owner not expected to change')

        assert((await wChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow setting minSwapAmount by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const minSwapAmountBefore = await wChxToken.minSwapAmount()

        // ACT
        await wChxToken.setMinSwapAmount(tokenQty1, {from: admin})

        // ASSERT
        const minSwapAmountAfter = await wChxToken.minSwapAmount()
        
        assert(!minSwapAmountAfter.eq(minSwapAmountBefore), 'MinSwapAmount expected to change')
        assert(minSwapAmountAfter.eq(tokenQty1), 'MinSwapAmount mismatch')
    })

    it('reject setting minSwapAmount if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const minSwapAmountBefore = await wChxToken.minSwapAmount()

        // ACT
        await helpers.shouldFail(wChxToken.setMinSwapAmount(tokenQty1, {from: ethAddress1}))

        // ASSERT
        const minSwapAmountAfter = await wChxToken.minSwapAmount()
        
        assert(minSwapAmountAfter.eq(minSwapAmountBefore), 'MinSwapAmount not expected to change')
    })

    /*it('gasEstimate', async() => {

        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        let swapGasEstimate = await wChxToken.swap.estimateGas(ethAddress1, tokenQty1);
        console.log(swapGasEstimate);
        //await wChxToken.transfer(admin, tokenQty3, {from: ethAddress1})
    })*/
})
