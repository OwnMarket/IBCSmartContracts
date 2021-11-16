pragma solidity 0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './ERC20Mintable.sol';

/**
 * @notice This contract is used to bridge WeOwn blockchain and any other blockchain running on EVM, primarily Ethereum. 
 * After establishing bridge between asset on WeOwn blockchain and ERC20 token, cross-chain transfers are enabled and
 * users can move their holding between the blockchains. 
 */
contract OwnAssetBridge is Ownable {
    using SafeMath for uint;
    enum RevertDirection{ FromNative, ToNative }

    event CrossChainTransfer(address indexed token, string recipientAccountHash, uint amount);
    event CrossChainTransfer(string txHash, address recipient);

    mapping (string => address) public erc20Tokens;
    mapping (address => string) public assetHashes;
    mapping (string => string) public accountsForAssets;
    mapping (string => address) public pendingCrossChainTransfers;
    mapping (string => string) public pendingSignedTxs;

    address public governor;
    uint public targetTransferFee;
    uint public nativeTransferFee;
    uint public bridgeFee;

    constructor(uint _bridgeFee, uint _targetTransferFee, uint _nativeTransferFee)
        public
    {
        bridgeFee = _bridgeFee;
        targetTransferFee = _targetTransferFee;
        nativeTransferFee = _nativeTransferFee;
        governor = _msgSender();
    }

    modifier onlyGovernor() {
        require(_msgSender() == governor, "Caller is not the governor");
        _;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Bridge management
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @notice Function that establishes bridge between existing ERC20 token and newly created asset on WeOwn blockchain.
     * This function can only be called by the governor and all tokens should be circulating on target blockchain, while
     * total supply is locked on WeOwn blockchain.
     */
    /// @param _token Address of ERC20 token
    /// @param _assetHash Hash of WeOwn asset
    /// @param _accountHash Hash of WeOwn account that will hold all locked tokens on WeOwn blockchain
    function bridgeErc20Token(address _token, string calldata _assetHash, string calldata _accountHash)
        external
        onlyGovernor
        payable
    {
        require(erc20Tokens[_assetHash] == address(0), "ERC20 token already exists");
        require(bytes(assetHashes[_token]).length == 0, "Asset already exists");
        require(bytes(accountsForAssets[_assetHash]).length == 0, "Account already exists");
        require(IERC20(_token).balanceOf(address(this)) == 0, "Tokens should not exist on WeOwn blockchain");
        require(msg.value >= bridgeFee, "Insufficient ETH fee is paid");

        erc20Tokens[_assetHash] = _token;
        assetHashes[_token] = _assetHash;
        accountsForAssets[_assetHash] = _accountHash;
    }

    /**
     * @notice Function that deploys new ERC20 token and establishes bridge between existing asset on WeOwn blockchain
     * and newly created ERC20 token. This function can only be called by the governor and all tokens should be 
     * circulating on WeOwn blockchain, while total supply is locked on target blockchain.
     */
    /// @param _assetHash Hash of WeOwn asset
    /// @param _accountHash Hash of WeOwn account that will hold all locked tokens on WeOwn blockchain
    /// @param _assetName Name of ERC20 token that will be deployed. Needs to correspond to the name of WeOwn asset
    /// @param _assetSymbol Symbol of ERC20 token that will be deployed. Needs to correspond to the symbol of WeOwn asset
    /// @param _totalSupply Total supply of ERC20 token that will be deployed. Needs to correspond to the total supply of WeOwn asset
    function bridgeAsset(
        string calldata _assetHash, 
        string calldata _accountHash, 
        string calldata _assetName, 
        string calldata _assetSymbol, 
        uint _totalSupply)
        external
        onlyGovernor
        payable
    {
        require(erc20Tokens[_assetHash] == address(0), "ERC20 token already exists");
        require(bytes(accountsForAssets[_assetHash]).length == 0, "Account already exists");
        require(msg.value >= bridgeFee, "Insufficient ETH fee is paid");

        address token = address(new ERC20Mintable(_assetName, _assetSymbol, _totalSupply));

        erc20Tokens[_assetHash] = token;
        assetHashes[token] = _assetHash;
        accountsForAssets[_assetHash] = _accountHash;
    }

    /**
     * @notice Function that removes bridge between ERC20 token and asset on WeOwn blockchain. This function can only 
     * be called by the governor and all tokens should be circulating on target blockchain or on WeOwn blockchain.
     */
    /// @param _token Address of ERC20 token
    function removeBridge(address _token)
        external
        onlyGovernor
    {
        string memory assetHash = assetHashes[_token];

        require(bytes(assetHash).length != 0, "Asset is not bridged");
        require(erc20Tokens[assetHash] == _token, "ERC20 token is not bridged");
        require(bytes(accountsForAssets[assetHash]).length != 0, "Account is not specified");

        uint bridgeBalance = IERC20(_token).balanceOf(address(this));
        require(bridgeBalance == 0 || bridgeBalance == IERC20(_token).totalSupply(), "Tokens can exist only on one blockchain");

        delete erc20Tokens[assetHash];
        delete assetHashes[_token];
        delete accountsForAssets[assetHash];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Cross-chain transfers
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @notice Function by which token holder on target blockchain can transfer tokens to WeOwn blockchain.
     * ERC20 token needs to be bridged to WeOwn asset and user should previously approve this contract as
     * spender of desired amount of tokens that should be cross-chain transferred.
     */
    /// @param _token Address of ERC20 token
    /// @param _recipientAccountHash Hash of WeOwn account that should receive tokens
    /// @param _amount Number of tokens that will be transferred
    function transferToNativeChain(address _token, string calldata _recipientAccountHash, uint _amount)
        external
        payable
    {
        require(msg.value >= nativeTransferFee, "Insufficient ETH fee is paid");
        require(bytes(assetHashes[_token]).length != 0, "Token is not bridged");
        require(IERC20(_token).transferFrom(_msgSender(), address(this), _amount), "Transfer failed");

        emit CrossChainTransfer(_token, _recipientAccountHash, _amount);
    }

    /**
     * @notice Function by which asset holder on WeOwn blockchain can transfer tokens to target blockchain.
     * Asset needs to be bridged to ERC20 token and asset transfer should be done on WeOwn blockchain.
     */
    /// @param _txHash Hash of tx on WeOwn blockchain which contains asset transfer
    /// @param _signature Signature of tx hash, signed by WeOwn sender address
    /// @param _recipient Address on target blockchain that should receive tokens
    function transferFromNativeChain(string calldata _txHash, string calldata _signature, address _recipient)
        external
        payable
    {
        require(msg.value >= targetTransferFee, "Insufficient ETH fee is paid");
        require(pendingCrossChainTransfers[_txHash] == address(0), "Recipient is already determined");
        require(bytes(pendingSignedTxs[_txHash]).length == 0, "Signature is already determined");

        pendingCrossChainTransfers[_txHash] = _recipient;
        pendingSignedTxs[_txHash] = _signature;

        emit CrossChainTransfer(_txHash, _recipient);
    }

    /**
     * @notice Function by which contract owner confirms cross-chain transfer from WeOwn blockchain. If the tx with
     * asset transfer on WeOwn blockchain is valid and correctly signed, tokens will be released to address on target blockchain.
     */
    /// @param _txHash Hash of tx on WeOwn blockchain which contains asset transfer
    /// @param _token Address of ERC20 token
    /// @param _amount Amount of tokens that will be released
    function confirmTransfer(string calldata _txHash, IERC20 _token, uint _amount)
        external
        onlyOwner
    {
        address recipient = pendingCrossChainTransfers[_txHash];
        require(recipient != address(0), "Recipient does not exist");

        delete pendingCrossChainTransfers[_txHash];
        delete pendingSignedTxs[_txHash];

        require(_token.transfer(recipient, _amount), "Transfer failed");
    }

    /**
     * @notice Function by which contract owner reverts cross-chain transfer from WeOwn blockchain. 
     */
    /// @param _txHash Hash of tx on WeOwn blockchain which contains asset transfer
    function revertTransferFromNativeChain(string calldata _txHash)
        external
        onlyOwner
    {
        require(pendingCrossChainTransfers[_txHash] != address(0), "Tx does not exist");

        delete pendingCrossChainTransfers[_txHash];
        delete pendingSignedTxs[_txHash];
    }

    /**
     * @notice Function by which contract owner reverts cross-chain transfer from target blockchain. 
     */
    /// @param _txHash Hash of tx on target blockchain that is reverted
    /// @param _token Address of ERC20 token
    /// @param _recipient Sender address to which tokens will be transferred back
    /// @param _amount Amount of tokens that will be transferred back to sender address
    function revertTransferToNativeChain(string calldata _txHash, IERC20 _token, address _recipient, uint _amount)
        external
        onlyOwner
    {
        require(_token.transfer(_recipient, _amount), "Transfer failed");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Owner administration
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @notice Function by which contract owner sets governor address - address that can perform bridging and unbridging
     * of ERC20 token and WeOwn asset. 
     */
    /// @param _governor New governor address
    function setGovernor(address _governor)
        external
        onlyOwner
    {
        governor = _governor;
    }

    /**
     * @notice Function by which contract owner sets fee that is paid for cross-chain transfer from WeOwn to target blockchain
     */
    /// @param _amount New fee amount
    function setTargetTransferFee(uint _amount)
        external
        onlyOwner
    {
        targetTransferFee = _amount;
    }

    /**
     * @notice Function by which contract owner sets fee that is paid for cross-chain transfer from target to WeOwn blockchain
     */
    /// @param _amount New fee amount
    function setNativeTransferFee(uint _amount)
        external
        onlyOwner
    {
        nativeTransferFee = _amount;
    }

    /**
     * @notice Function by which contract owner sets fee that is paid by governor when establishing bridge
     */
    /// @param _amount New fee amount
    function setBridgeFee(uint _amount)
        external
        onlyOwner
    {
        bridgeFee = _amount;
    }

    /**
     * @notice Function by which contract owner withdraws fee collected through bridging and cross-chain transfers
     */
    /// @param _amount Amount to be withdrawn
    function withdrawFee(uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        payable(owner()).transfer(_amount);
        return true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Miscellaneous
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // Enable recovery of any ERC20 compatible token sent by mistake to this contract's address.
    /**
     * @notice Function by which contract owner can recover any mistakenly sent ERC20 tokens to contract's address.
     * Condition is that ERC20 token is not bridged.
     */
     /// @param _token Address of ERC20 token
    /// @param _amount Amount to be withdrawn
    function drainStrayTokens(IERC20 _token, uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        require(bytes(assetHashes[address(_token)]).length == 0, "Bridged ERC20 token cannot be drained.");
        return _token.transfer(owner(), _amount);
    }
}
