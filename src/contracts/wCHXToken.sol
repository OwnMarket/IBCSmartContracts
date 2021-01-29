pragma solidity 0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Capped.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './wCHXMapping.sol';

contract wCHXToken is ERC20Capped, Ownable {
    using SafeMath for uint;
    event UnwrapChx(address ethAddress, string chxAddress, uint amount);

    wCHXMapping public addressMapping;
    uint private _minWrapAmount;

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
        public 
        view 
        returns (uint) 
    {
        return _minWrapAmount;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Transfers
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function transfer(address _recipient, uint _amount)
        public
        override
        returns (bool)
    {
        require(_recipient != address(this));
        if (_recipient == owner()) {
            require(_amount >= _minWrapAmount, "Amount needs to be greater than minWrapAmount");
            string memory chxAddress = addressMapping.chxAddress(_msgSender());
            require(bytes(chxAddress).length != 0, "Address is not mapped to chxAddress");
            emit UnwrapChx(_msgSender(), chxAddress, _amount);
        }

        return super.transfer(_recipient, _amount);
    }

    function transferFrom(address _sender, address _recipient, uint256 _amount)
        public
        override
        returns (bool)
    {
        require(_recipient != address(this));
        if (_recipient == owner()) {
            require(_amount >= _minWrapAmount, "Amount needs to be greater than minWrapAmount");
            string memory chxAddress = addressMapping.chxAddress(_sender);
            require(bytes(chxAddress).length != 0, "Address is not mapped to chxAddress");
            emit UnwrapChx(_sender, chxAddress, _amount);
        }

        return super.transferFrom(_sender, _recipient, _amount);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wrapping logic
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function burn(uint _amount)
        public
        onlyOwner
    {
        _burn(owner(), _amount);
    }

    function wrap(address _recipient, uint _amount)
        public
        onlyOwner
    {
        string memory chxAddress = addressMapping.chxAddress(_recipient);
        require(bytes(chxAddress).length != 0, "Address is not mapped to chxAddress");

        _mint(owner(), _amount);
        transfer(_recipient, _amount);
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
        return _token.transfer(owner(), _amount);
    }
}
