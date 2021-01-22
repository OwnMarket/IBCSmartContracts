pragma solidity 0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Capped.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './wCHXMapping.sol';

contract wCHXToken is ERC20Capped, Ownable {
    using SafeMath for uint;
    event SwapToChx(address ethAddress, string chxAddress);

    wCHXMapping public addressMapping;
    uint private _minSwapAmount;

    constructor(address mappingContractAddress)
        ERC20("Wrapped CHX", "wCHX")
        ERC20Capped(uint(1689565220930844))
        public
    {
        addressMapping = wCHXMapping(mappingContractAddress);
        _setupDecimals(7);
        _minSwapAmount = uint(1000).mul(1e7);
    }

    function minSwapAmount() public view returns (uint) {
        return _minSwapAmount;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Transfers
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function transfer(address recipient, uint amount)
        public
        override
        returns (bool)
    {
        require(recipient != address(this));
        if(recipient == owner()) {
            require(amount >= _minSwapAmount, "Amount needs to be greater than minSwapAmount");
            string memory chxAddress = addressMapping.chxAddress(_msgSender());
            require(bytes(chxAddress).length != 0);
            emit SwapToChx(_msgSender(), chxAddress);
        }
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        public
        override
        returns (bool)
    {
        require(recipient != address(this));
        if(recipient == owner()) {
            require(amount >= _minSwapAmount, "Amount needs to be greater than minSwapAmount");
            string memory chxAddress = addressMapping.chxAddress(sender);
            require(bytes(chxAddress).length != 0);
            emit SwapToChx(sender, chxAddress);
        }

        return super.transferFrom(sender, recipient, amount);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Burning, swapping and setting minSwapAmount
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function burn(uint amount)
        public
        onlyOwner
    {
        _burn(owner(), amount);
    }

    function swap(address recipient, uint amount)
        public
        onlyOwner
    {
        string memory chxAddress = addressMapping.chxAddress(recipient);
        require(bytes(chxAddress).length != 0);

        _mint(owner(), amount);
        transfer(recipient, amount);
    }

    function setMinSwapAmount(uint amount)
        public
        onlyOwner
    {
        _minSwapAmount = amount;
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
