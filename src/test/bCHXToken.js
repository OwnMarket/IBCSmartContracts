const helpers = require('./helpers.js')
const e7 = helpers.e7

const bCHXMapping = artifacts.require('./bCHXMapping.sol')
const bCHXToken = artifacts.require('./bCHXToken.sol')

contract('bCHXToken', accounts => {
    const admin = accounts[0]
    const bscAddress1 = accounts[1]
    const bscAddress2 = accounts[2]
    const bscAddress3 = accounts[2]

    const chxAddress1 = "CH111111111111111111111111111111111"
    const chxAddress2 = "CH222222222222222222222222222222222"
    const chxAddress3 = "CH333333333333333333333333333333333"

    const signature1 = "signature1"
    const signature2 = "signature2"
    const signature3 = "signature3"

    let bChxToken
    let bChxMapping

    beforeEach(async () => {
        bChxMapping = await bCHXMapping.new()
        bChxToken = await bCHXToken.new(bChxMapping.address)
    })

    it('initializes correctly', async () => {
        const totalSupply = e7(0)
        const cap =  web3.utils.toBN(168956522.0930844 * Math.pow(10, 7))
        const minWrapAmount = e7(1000)
        
        assert(await bChxToken.decimals() == 7, 'Decimals mismatch')
        assert((await bChxToken.totalSupply()).eq(totalSupply), 'Total supply mismatch')
        assert((await bChxToken.balanceOf(admin)).eq(totalSupply), 'Admin balance mismatch')
        assert((await bChxToken.cap()).eq(cap), 'Cap mismatch')
        assert((await bChxToken.minWrapAmount()).eq(minWrapAmount), 'MinWrapAmount mismatch')
    })

    it('allow wrap for owner', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxToken.wrap(chxAddress1, tokenQty, {from: admin})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')

        assert(address1BalanceAfter.eq(tokenQty), 'Balance of address 1 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty), 'Total supply mismatch')
    })

    it('reject wrap if recipient address is not mapped', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await helpers.shouldFail(bChxToken.wrap(chxAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await bChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('reject wrap if mapping of recipient address is removed', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})
        await bChxMapping.removeMappedAddress(bscAddress1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await helpers.shouldFail(bChxToken.wrap(chxAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await bChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('reject wrap if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty = e7(2000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await helpers.shouldFail(bChxToken.wrap(chxAddress2, tokenQty, {from: bscAddress1}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await bChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('reject wrap if amount grater than cap', async() => {
        // ARRANGE
        const tokenQty = e7(168956522).add(e7(1))
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await helpers.shouldFail(bChxToken.wrap(chxAddress1, tokenQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')
        assert((await bChxToken.totalSupply()).eq(e7(0)), 'Total supply mismatch')
    })

    it('allow multiple wraps for owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2), 'Balance of address 2 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('reject multiple wraps if total supply would exceed cap', async() => {
        // ARRANGE
        const tokenQty1 = e7(168956522)
        const tokenQty2 = e7(1)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await helpers.shouldFail(bChxToken.wrap(chxAddress2, tokenQty2, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 not expected to change')

        assert(address1BalanceAfter.eq(tokenQty1), 'Balance of address 1 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow transfers between addresses', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxToken.transfer(bscAddress2, tokenQty3, {from: bscAddress1})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of address 2 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transfers between addresses even if mapping does not exist', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxMapping.removeMappedAddress(bscAddress1, {from: admin})
        await bChxMapping.removeMappedAddress(bscAddress2, {from: admin})

        await bChxToken.transfer(bscAddress2, tokenQty3, {from: bscAddress1})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of owner expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transfer to contract if address is mapped and amount greater than minWrapAmount', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract address expected to change')
        assert(!address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 expected to change')

        assert(address1BalanceAfter.eq(address1BalanceBefore.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(contractBalanceAfter.eq(contractBalanceBefore.add(tokenQty3)), 'Balance of contract mismatch')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore.add(tokenQty3)), 'Balance of contract mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transfer to contract if address is not mapped', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxMapping.removeMappedAddress(bscAddress1, {from: admin})

        await helpers.shouldFail(bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transfer to contract if amount is smaller than minWrapAmount', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount.sub(e7(1))
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)   
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow transferFrom functions between addresses', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})
        bChxToken.approve(bscAddress3, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxToken.transferFrom(bscAddress1, bscAddress2, tokenQty3, {from: bscAddress3})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2)
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 2 expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of address 2 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transferFrom functions between addresses even if mapping does not exist', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(3000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})
        bChxToken.approve(bscAddress3, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress2)

        // ACT
        await bChxMapping.removeMappedAddress(bscAddress1, {from: admin})
        await bChxMapping.removeMappedAddress(bscAddress2, {from: admin})

        await bChxToken.transferFrom(bscAddress1, bscAddress2, tokenQty3, {from: bscAddress3})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress2) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!address2BalanceAfter.eq(address2BalanceBefore), 'Balance of owner expected to change')

        assert(address1BalanceAfter.eq(tokenQty1.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(address2BalanceAfter.eq(tokenQty2.add(tokenQty3)), 'Balance of owner mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('allow transferFrom function to contract if address is mapped and amount grater than minWrapAmount', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        bChxToken.approve(bscAddress3, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxToken.transferFrom(bscAddress1, bChxToken.address, tokenQty3, {from: bscAddress3})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract expected to change')
        assert(!address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 expected to change')

        assert(address1BalanceAfter.eq(address1BalanceBefore.sub(tokenQty3)), 'Balance of address 1 mismatch')
        assert(contractBalanceAfter.eq(contractBalanceBefore.add(tokenQty3)), 'Balance of contract mismatch')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore.add(tokenQty3)), 'Pending unwrap balance of address 1 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transferFrom function to contract owner if address is not mapped', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        bChxToken.approve(bscAddress3, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxMapping.removeMappedAddress(bscAddress1, {from: admin})

        await helpers.shouldFail(bChxToken.transferFrom(bscAddress1, bChxToken.address, tokenQty3, {from: bscAddress3}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject transferFrom function to contract owner if amount smaller than minWrapAmount', async() => {
        // ARRANGE
        const minWrapAmount = await bChxToken.minWrapAmount();
        const tokenQty1 = minWrapAmount.mul(web3.utils.toBN(2))
        const tokenQty3 = minWrapAmount.sub(e7(1))
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        bChxToken.approve(bscAddress3, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.transferFrom(bscAddress1, bChxToken.address, tokenQty3, {from: bscAddress3}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address) 
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')
        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow burning tokens if any by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxToken.burnUnwrapedTokens(chxAddress1, tokenQty3, {from: admin})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(!contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract expected to change')
        assert(!address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 expected to change')

        assert(contractBalanceAfter.eq(e7(0)), 'Balance of contract mismatch')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore.sub(tokenQty3)), 'Pending unwrap balance of address 1 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.sub(tokenQty3)), 'Total supply mismatch')
    })

    it('reject burning tokens if none by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.burnUnwrapedTokens(chxAddress1, tokenQty3, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject burning tokens if pedning unwrap balance too low', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(1500)
        const tokenQty3 = e7(1000)
        const tokenQty4 = e7(1200)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})
        await bChxToken.transfer(bChxToken.address, tokenQty4, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.burnUnwrapedTokens(chxAddress1, tokenQty3.add(e7(1)), {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('reject burning tokens if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.burnUnwrapedTokens(chxAddress1, tokenQty3, {from: bscAddress1}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow reverting tokens if any by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        const revertQty = e7(700)
        const feeQty = e7(300)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await bChxToken.revertUnwrapedTokens(chxAddress1, revertQty, feeQty, {from: admin})

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(!address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 expected to change')
        assert(!contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract expected to change')
        assert(!address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 expected to change')

        assert(address1BalanceAfter.eq(address1BalanceBefore.add(revertQty)), 'Balance of address 1 mismatch')
        assert(contractBalanceAfter.eq(e7(0)), 'Balance of contract mismatch')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore.sub(revertQty.add(feeQty))), 'Pending unwrap balance of address 1 mismatch')
        assert((await bChxToken.totalSupply()).eq(tokenQty1.sub(tokenQty3).add(revertQty)), 'Total supply mismatch')
    })

    it('reject reverting tokens if none by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const revertQty = e7(700)
        const feeQty = e7(300)
        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.revertUnwrapedTokens(chxAddress1, revertQty, feeQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject reverting tokens if fee amount too high', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(1500)
        const tokenQty3 = e7(1000)
        const tokenQty4 = e7(1200)
        const revertQty = e7(700)
        const feeQty = e7(300)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})
        await bChxToken.transfer(bChxToken.address, tokenQty4, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.revertUnwrapedTokens(chxAddress1, revertQty, feeQty.add(e7(1)), {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('reject reverting tokens if revert amount too high', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty2 = e7(1500)
        const tokenQty3 = e7(1000)
        const tokenQty4 = e7(1200)
        const revertQty = e7(700)
        const feeQty = e7(300)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})
        await bChxMapping.mapAddress(chxAddress2, signature2, {from: bscAddress2})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.wrap(chxAddress2, tokenQty2, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})
        await bChxToken.transfer(bChxToken.address, tokenQty4, {from: bscAddress2})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.revertUnwrapedTokens(chxAddress1, revertQty.add(e7(1)), feeQty, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const address2BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1) 
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(address2BalanceAfter.eq(address2BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1.add(tokenQty2)), 'Total supply mismatch')
    })

    it('reject reverting tokens if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)
        const revertQty = e7(700)
        const feeQty = e7(300)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.revertUnwrapedTokens(chxAddress1, revertQty, feeQty, {from: bscAddress1}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('reject draining bCHX', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const tokenQty3 = e7(1000)

        await bChxMapping.mapAddress(chxAddress1, signature1, {from: bscAddress1})

        await bChxToken.wrap(chxAddress1, tokenQty1, {from: admin})
        await bChxToken.transfer(bChxToken.address, tokenQty3, {from: bscAddress1})

        const address1BalanceBefore = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceBefore = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceBefore = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)

        // ACT
        await helpers.shouldFail(bChxToken.drainStrayTokens(bChxToken.address, tokenQty3, {from: admin}))

        // ASSERT
        const address1BalanceAfter = await bChxToken.balanceOf(bscAddress1)
        const contractBalanceAfter = await bChxToken.balanceOf(bChxToken.address)
        const address1PendingUnwrapBalanceAfter = await bChxToken.pendingUnwrapBalanceOf(bscAddress1)  
        
        assert(address1BalanceAfter.eq(address1BalanceBefore), 'Balance of address 1 not expected to change')
        assert(contractBalanceAfter.eq(contractBalanceBefore), 'Balance of contract not expected to change')
        assert(address1PendingUnwrapBalanceAfter.eq(address1PendingUnwrapBalanceBefore), 'Pending unwrap balance of address 1 not expected to change')

        assert((await bChxToken.totalSupply()).eq(tokenQty1), 'Total supply mismatch')
    })

    it('allow setting minWrapAmount by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const minWrapAmountBefore = await bChxToken.minWrapAmount()

        // ACT
        await bChxToken.setMinWrapAmount(tokenQty1, {from: admin})

        // ASSERT
        const minWrapAmountAfter = await bChxToken.minWrapAmount()
        
        assert(!minWrapAmountAfter.eq(minWrapAmountBefore), 'MinWrapAmount expected to change')
        assert(minWrapAmountAfter.eq(tokenQty1), 'MinWrapAmount mismatch')
    })

    it('reject setting minWrapAmount if not called by contract owner', async() => {
        // ARRANGE
        const tokenQty1 = e7(2000)
        const minWrapAmountBefore = await bChxToken.minWrapAmount()

        // ACT
        await helpers.shouldFail(bChxToken.setMinWrapAmount(tokenQty1, {from: bscAddress1}))

        // ASSERT
        const minWrapAmountAfter = await bChxToken.minWrapAmount()
        
        assert(minWrapAmountAfter.eq(minWrapAmountBefore), 'MinWrapAmount not expected to change')
    })   
})
