pragma solidity 0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBEP20.sol";
import './bCHXMapping.sol';
import './BEP20Token.sol';

contract bCHXToken is BEP20Token {
    using SafeMath for uint;
    event UnwrapChx(address bscAddress, string chxAddress, uint amount);
    event WrapChx(address bscAddress, string chxAddress, uint amount);

    bCHXMapping public addressMapping;
    uint public minWrapAmount;
    mapping (address => uint) private pendingUnwrapBalances;

    constructor(address _mappingContractAddress)
        BEP20Token("Binance-Peg CHX Token", "bCHX", 7, uint(0), uint(1689565220930844))
        public
    {
        addressMapping = bCHXMapping(_mappingContractAddress);
        minWrapAmount = uint(1000).mul(1e7);
    }

    function pendingUnwrapBalanceOf(address _bscAddress) 
        external 
        view 
        returns (uint) 
    {
        return pendingUnwrapBalances[_bscAddress];
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

        bool isSuccess = super.transfer(_recipient, _amount);

        if (isSuccess && _recipient == address(this)) {
            pendingUnwrapBalances[_msgSender()] = pendingUnwrapBalances[_msgSender()].add(_amount);
        }

        return isSuccess;
    }

    function transferFrom(address _sender, address _recipient, uint256 _amount)
        public
        override
        returns (bool)
    {
        validateAndLogUnwrap(_sender, _recipient, _amount);

        bool isSuccess = super.transferFrom(_sender, _recipient, _amount);

        if (isSuccess && _recipient == address(this)) {
            pendingUnwrapBalances[_sender] = pendingUnwrapBalances[_sender].add(_amount);
        }

        return isSuccess;
    }

    function validateAndLogUnwrap(address _sender, address _recipient, uint256 _amount) 
        private
    {
        if (_recipient == address(this)) {
            require(_amount >= minWrapAmount, "Amount must be greater than minWrapAmount");
            string memory chxAddress = addressMapping.chxAddress(_sender);
            require(bytes(chxAddress).length != 0, "Address is not mapped to CHX address");
            emit UnwrapChx(_sender, chxAddress, _amount);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wrapping logic
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function burnUnwrapedTokens(string calldata _chxAddress, uint _amount)
        external
        onlyOwner
    {
        address bscAddress = addressMapping.bscAddress(_chxAddress);
        require(bscAddress != address(0), "CHX address is not mapped to BSC address");

        pendingUnwrapBalances[bscAddress] = pendingUnwrapBalances[bscAddress].sub(_amount, "Burn amount exceeds unwraped token balance");
        _burn(address(this), _amount);
    }

    function revertUnwrapedTokens(string calldata _chxAddress, uint _revertAmount, uint _feeAmount)
        external
        onlyOwner
    {
        address bscAddress = addressMapping.bscAddress(_chxAddress);
        require(bscAddress != address(0), "CHX address is not mapped to BSC address");

        uint totalAmount = _revertAmount.add(_feeAmount);
        pendingUnwrapBalances[bscAddress] = pendingUnwrapBalances[bscAddress].sub(totalAmount, "Total amount exceeds unwraped token balance");
        _burn(address(this), _feeAmount);
        _transfer(address(this), bscAddress, _revertAmount);
    }

    function wrap(string calldata _chxAddress, uint _amount)
        external
        onlyOwner
    {
        address bscAddress = addressMapping.bscAddress(_chxAddress);
        require(bscAddress != address(0), "CHX address is not mapped to BSC address");
        emit WrapChx(bscAddress, _chxAddress, _amount);

        _mint(bscAddress, _amount);
    }

    function setMinWrapAmount(uint _amount)
        external
        onlyOwner
    {
        minWrapAmount = _amount;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Miscellaneous
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // Enable recovery of BNB sent by mistake to this contract's address.
    function drainStrayBNB(uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        payable(owner()).transfer(_amount);
        return true;
    }

    // Enable recovery of any BEP20 compatible token sent by mistake to this contract's address.
    function drainStrayTokens(IBEP20 _token, uint _amount)
        external
        onlyOwner
        returns (bool)
    {
        require(address(_token) != address(this), "bCHX cannot be drained");
        return _token.transfer(owner(), _amount);
    }
}
