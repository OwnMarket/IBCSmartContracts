pragma solidity 0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Capped.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './wCHXMapping.sol';

contract wCHXToken is ERC20Capped, Ownable {
    using SafeMath for uint;
    event UnwrapChx(address ethAddress, string chxAddress, uint amount);
    event WrapChx(address ethAddress, string chxAddress, uint amount);

    wCHXMapping public addressMapping;
    uint private _minWrapAmount;
    mapping (address => uint) private _pendingUnwrapBalances;

    constructor(address _mappingContractAddress)
        ERC20("Wrapped CHX", "wCHX")
        ERC20Capped(uint(1689565220930844))
        public
    {
        addressMapping = wCHXMapping(_mappingContractAddress);
        _setupDecimals(7);
        _minWrapAmount = uint(1000).mul(1e7);
    }

    function minWrapAmount() 
        external 
        view 
        returns (uint) 
    {
        return _minWrapAmount;
    }

    function pendingUnwrapBalance(address _ethAddress) 
        external 
        view 
        returns (uint) 
    {
        return _pendingUnwrapBalances[_ethAddress];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Transfers
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function transfer(address _recipient, uint _amount)
        public
        override
        returns (bool)
    {
        validateAndLogUnwrap(_msgSender(), _recipient, _amount);

        bool transferResult = super.transfer(_recipient, _amount);

        if (transferResult && _recipient == address(this)) 
        {
            _pendingUnwrapBalances[_msgSender()] = _pendingUnwrapBalances[_msgSender()].add(_amount);
        }

        return transferResult;
    }

    function transferFrom(address _sender, address _recipient, uint256 _amount)
        public
        override
        returns (bool)
    {
        validateAndLogUnwrap(_sender, _recipient, _amount);

        bool transferResult = super.transferFrom(_sender, _recipient, _amount);

        if (transferResult && _recipient == address(this)) 
        {
            _pendingUnwrapBalances[_sender] = _pendingUnwrapBalances[_sender].add(_amount);
        }

        return transferResult;
    }

    function validateAndLogUnwrap(address _sender, address _recipient, uint256 _amount) 
        private
    {
        if (_recipient == address(this)) {
            require(_amount >= _minWrapAmount, "Amount needs to be greater than minWrapAmount");
            string memory chxAddress = addressMapping.chxAddress(_sender);
            require(bytes(chxAddress).length != 0, "Address is not mapped to CHX address");
            emit UnwrapChx(_sender, chxAddress, _amount);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wrapping logic
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function burnUnwrapedTokens(string memory _chxAddress, uint _amount)
        public
        onlyOwner
    {
        address ethAddress = addressMapping.ethAddress(_chxAddress);
        require(ethAddress != address(0), "CHX address is not mapped to ETH address");

        _pendingUnwrapBalances[ethAddress] = _pendingUnwrapBalances[ethAddress].sub(_amount, "Burn amount exceeds unwraped token balance");
        _burn(address(this), _amount);
    }

    function revertUnwrapedTokens(string memory _chxAddress, uint _revertAmount, uint _feeAmount)
        public
        onlyOwner
    {
        address ethAddress = addressMapping.ethAddress(_chxAddress);
        require(ethAddress != address(0), "CHX address is not mapped to ETH address");

        uint totalAmount = _revertAmount.add(_feeAmount);
        _pendingUnwrapBalances[ethAddress] = _pendingUnwrapBalances[ethAddress].sub(totalAmount, "Total amount exceeds unwraped token balance");
        _burn(address(this), _feeAmount);
        _transfer(address(this), ethAddress, _revertAmount);
    }

    function wrap(string memory _chxAddress, uint _amount)
        public
        onlyOwner
    {
        address ethAddress = addressMapping.ethAddress(_chxAddress);
        require(ethAddress != address(0), "CHX address is not mapped to ETH address");
        emit WrapChx(ethAddress, _chxAddress, _amount);

        _mint(ethAddress, _amount);
    }

    function setMinWrapAmount(uint _amount)
        public
        onlyOwner
    {
        _minWrapAmount = _amount;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Miscellaneous
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // Enable recovery of ether sent by mistake to this contract's address.
    function drainStrayEther(uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        payable(owner()).transfer(_amount);
        return true;
    }

    // Enable recovery of any ERC20 compatible token sent by mistake to this contract's address.
    function drainStrayTokens(IERC20 _token, uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        require(address(_token) != address(this), "wCHXToken cannot be drained");
        return _token.transfer(owner(), _amount);
    }
}
