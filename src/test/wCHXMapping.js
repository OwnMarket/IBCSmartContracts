const helpers = require('./helpers.js')

const WCHXMapping = artifacts.require('./wCHXMapping.sol')

contract('wCHXMapping', accounts => {
    const admin = accounts[0]
    const ethAddress1 = accounts[1]
    const ethAddress2 = accounts[2]

    const chxAddress1 = "CH11111111111111111111111111111111"
    const chxAddress2 = "CH22222222222222222222222222222222"
    const chxAddress3 = "CH33333333333333333333333333333333"

    const signature1 = "signature1"
    const signature2 = "signature2"
    const signature3 = "signature3"

    let wCHXMapping

    beforeEach(async () => {
        wCHXMapping = await WCHXMapping.new()
    })

    it('initializes correctly', async () => {
        assert.equal(await wCHXMapping.owner(), admin, 'Owner address mismatch')
    })

    it('sets mapped address', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)
        
        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        // ACT
        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.notEqual(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 expected to change')
        assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
        assert.notEqual(signature1After, signature1Before, 'Mapped signature 1 expected to change')

        assert.equal(chxAddress1After, chxAddress1, 'Mapped chx address 1 mismatch')
        assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
        assert.equal(signature1After, signature1, 'Mapped signature 1 mismatch')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

    it('sets mapped address for all senders', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        // ACT
        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})
        await wCHXMapping.mapAddress(chxAddress2, signature2, {from: ethAddress2})

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.notEqual(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 expected to change')
        assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
        assert.notEqual(signature1After, signature1Before, 'Mapped signature 1 expected to change')

        assert.equal(chxAddress1After, chxAddress1, 'Mapped chx address 1 mismatch')
        assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
        assert.equal(signature1After, signature1, 'Mapped signature 1 mismatch')

        assert.notEqual(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 expected to change')
        assert.notEqual(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 expected to change')
        assert.notEqual(signature2After, signature2Before, 'Mapped signature 2 expected to change')

        assert.equal(chxAddress2After, chxAddress2, 'Mapped chx address 2 mismatch')
        assert.equal(ethAddress2After, ethAddress2, 'Mapped eth address 2 mismatch')
        assert.equal(signature2After, signature2, 'Mapped signature 2 mismatch')
    })

    it('rejects address mapping if already exists', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        // ACT
        await helpers.shouldFail(wCHXMapping.mapAddress(chxAddress3, signature3, {from: ethAddress1}))

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.notEqual(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 expected to change')
        assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
        assert.notEqual(signature1After, signature1Before, 'Mapped signature expected to change')

        assert.equal(chxAddress1After, chxAddress1, 'Mapped chx address 1 mismatch')
        assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
        assert.equal(signature1After, signature1, 'Mapped signature 1 mismatch')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

    it('removes address mapping if called by contract owner', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        // ACT
        await wCHXMapping.removeMappedAddress(ethAddress1, {from: admin})

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
        assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
        assert.equal(signature1After, signature1Before, 'Mapped signature 1 not expected to change')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

    it('rejects address mapping removal if not called by contract owner', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        // ACT
        await helpers.shouldFail(wCHXMapping.removeMappedAddress(ethAddress1, {from: ethAddress1}))
        await helpers.shouldFail(wCHXMapping.removeMappedAddress(ethAddress1, {from: ethAddress2}))

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.notEqual(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 expected to change')
        assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
        assert.notEqual(signature1After, signature1Before, 'Mapped signature 1 expected to change')

        assert.equal(chxAddress1After, chxAddress1, 'Mapped chx address 1 mismatch')
        assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
        assert.equal(signature1After, signature1, 'Mapped signature 1 mismatch')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

    it('rejects address mapping removal by contract owner if address mapping does not exist', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        // ACT
        await helpers.shouldFail(wCHXMapping.removeMappedAddress(ethAddress1, {from: admin}))

        // ASSERT
        const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

        const signature1After = await wCHXMapping.signature(chxAddress1)
        const signature2After = await wCHXMapping.signature(chxAddress2)

        assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
        assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
        assert.equal(signature1After, signature1Before, 'Mapped signature 1 not expected to change')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

    it('accepts repeated address mapping if previously removed by contract owner', async () => {
        // ARRANGE
        const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
        const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

        const signature1Before = await wCHXMapping.signature(chxAddress1)
        const signature2Before = await wCHXMapping.signature(chxAddress2)

        await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

        // ACT
        await wCHXMapping.removeMappedAddress(ethAddress1, {from: admin})
        await wCHXMapping.mapAddress(chxAddress3, signature3, {from: ethAddress1})

        // ASSERT
        const chxAddress3After = await wCHXMapping.chxAddress(ethAddress1)
        const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

        const ethAddress1After = await wCHXMapping.ethAddress(chxAddress3)
        const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)
        const ethAddress3After = await wCHXMapping.ethAddress(chxAddress1)

        const signature3After = await wCHXMapping.signature(chxAddress3)
        const signature2After = await wCHXMapping.signature(chxAddress2)
        const signature1After = await wCHXMapping.signature(chxAddress1)

        assert.notEqual(chxAddress3After, chxAddress1Before, 'Mapped chx address 1 expected to change')
        assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
        assert.notEqual(signature3After, signature1Before, 'Mapped signature 1 expected to change')

        assert.equal(chxAddress3After, chxAddress3, 'Mapped chx address 1 mismatch')
        assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
        assert.equal(signature3After, signature3, 'Mapped signature 1 mismatch')

        assert.equal(signature1After, signature1Before, 'Signature from chx address 1 should not exist')
        assert.equal(ethAddress3After, ethAddress1Before, 'Eth address from chx address 1 should not exist')

        assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
        assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
        assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
    })

/*it('removes address mapping if called by address owner', async () => {
    // ARRANGE
    const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

    const signature1Before = await wCHXMapping.signature(chxAddress1)
    const signature2Before = await wCHXMapping.signature(chxAddress2)

    await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

    // ACT
    await wCHXMapping.removeMappedAddress({from: ethAddress1})

    // ASSERT
    const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

    const signature1After = await wCHXMapping.signature(chxAddress1)
    const signature2After = await wCHXMapping.signature(chxAddress2)

    assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
    assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
    assert.equal(signature1After, signature1Before, 'Mapped signature 1 not expected to change')

    assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
    assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
    assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
})

it('rejects address mapping removal by address owner if address mapping does not exist', async () => {
    // ARRANGE
    const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

    const signature1Before = await wCHXMapping.signature(chxAddress1)
    const signature2Before = await wCHXMapping.signature(chxAddress2)

    // ACT
    await helpers.shouldFail(wCHXMapping.removeMappedAddress({from: ethAddress1}))

    // ASSERT
    const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

    const signature1After = await wCHXMapping.signature(chxAddress1)
    const signature2After = await wCHXMapping.signature(chxAddress2)

    assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
    assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
    assert.equal(signature1After, signature1Before, 'Mapped signature 1 not expected to change')

    assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
    assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
    assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
})

it('accepts repeated address mapping if previously removed by address owner', async () => {
    // ARRANGE
    const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

    const signature1Before = await wCHXMapping.signature(chxAddress1)
    const signature2Before = await wCHXMapping.signature(chxAddress2)

    await wCHXMapping.mapAddress(chxAddress1, signature1, {from: ethAddress1})

    // ACT
    await wCHXMapping.removeMappedAddress({from: ethAddress1})
    await wCHXMapping.mapAddress(chxAddress3, signature3, {from: ethAddress1})

    // ASSERT
    const chxAddress3After = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1After = await wCHXMapping.ethAddress(chxAddress3)
    const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)
    const ethAddress3After = await wCHXMapping.ethAddress(chxAddress1)

    const signature3After = await wCHXMapping.signature(chxAddress3)
    const signature2After = await wCHXMapping.signature(chxAddress2)
    const signature1After = await wCHXMapping.signature(chxAddress1)

    assert.notEqual(chxAddress3After, chxAddress1Before, 'Mapped chx address 1 expected to change')
    assert.notEqual(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 expected to change')
    assert.notEqual(signature3After, signature1Before, 'Mapped signature 1 expected to change')

    assert.equal(chxAddress3After, chxAddress3, 'Mapped chx address 1 mismatch')
    assert.equal(ethAddress1After, ethAddress1, 'Mapped eth address 1 mismatch')
    assert.equal(signature3After, signature3, 'Mapped signature 1 mismatch')

    assert.equal(signature1After, signature1Before, 'Signature from chx address 1 should not exist')
    assert.equal(ethAddress3After, ethAddress1Before, 'Eth address from chx address 1 should not exist')

    assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
    assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
    assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
})*/

it('rejects address mapping if chxAddress does not start with "CH"', async () => {
    // ARRANGE
    const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

    const signature1Before = await wCHXMapping.signature(chxAddress1)
    const signature2Before = await wCHXMapping.signature(chxAddress2)

    // ACT
    await helpers.shouldFail(wCHXMapping.mapAddress("CF11111111111111111111111111111111", signature1, {from: ethAddress1}))
    await helpers.shouldFail(wCHXMapping.mapAddress("FH11111111111111111111111111111111", signature1, {from: ethAddress2}))

    // ASSERT
    const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

    const signature1After = await wCHXMapping.signature(chxAddress1)
    const signature2After = await wCHXMapping.signature(chxAddress2)

    assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
    assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
    assert.equal(signature1After, signature1Before, 'Mapped signature not expected to change')

    assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
    assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
    assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
})

it('rejects address mapping if chxAddress ends with character not [A-Z][a-z]0-9]', async () => {
    // ARRANGE
    const chxAddress1Before = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2Before = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1Before = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2Before = await wCHXMapping.ethAddress(chxAddress2)

    const signature1Before = await wCHXMapping.signature(chxAddress1)
    const signature2Before = await wCHXMapping.signature(chxAddress2)

    // ACT
    await helpers.shouldFail(wCHXMapping.mapAddress("CH1111111111111111111111111111111 ", signature1, {from: ethAddress1}))
    await helpers.shouldFail(wCHXMapping.mapAddress("CH1111111111111111111111111111111.", signature1, {from: ethAddress2}))
    await helpers.shouldFail(wCHXMapping.mapAddress("CH1111111111111111111111111111111/", signature1, {from: ethAddress2}))
    await helpers.shouldFail(wCHXMapping.mapAddress("CH1111111111111111111111111111111\\", signature1, {from: ethAddress2}))

    // ASSERT
    const chxAddress1After = await wCHXMapping.chxAddress(ethAddress1)
    const chxAddress2After = await wCHXMapping.chxAddress(ethAddress2)

    const ethAddress1After = await wCHXMapping.ethAddress(chxAddress1)
    const ethAddress2After = await wCHXMapping.ethAddress(chxAddress2)

    const signature1After = await wCHXMapping.signature(chxAddress1)
    const signature2After = await wCHXMapping.signature(chxAddress2)

    assert.equal(chxAddress1After, chxAddress1Before, 'Mapped chx address 1 not expected to change')
    assert.equal(ethAddress1After, ethAddress1Before, 'Mapped eth address 1 not expected to change')
    assert.equal(signature1After, signature1Before, 'Mapped signature not expected to change')

    assert.equal(chxAddress2After, chxAddress2Before, 'Mapped chx address 2 not expected to change')
    assert.equal(ethAddress2After, ethAddress2Before, 'Mapped eth address 2 not expected to change')
    assert.equal(signature2After, signature2Before, 'Mapped signature 2 not expected to change')
})

})
