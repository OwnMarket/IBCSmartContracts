pragma solidity 0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract ERC20Mintable is ERC20, Ownable {
    using SafeMath for uint;

    constructor (string memory name_, string memory symbol_, uint totalSupply_) 
        ERC20(name_, symbol_)
        public 
    {
        _mint(_msgSender(), totalSupply_);
    }

    function mint(address to, uint256 amount) 
        public
        onlyOwner
        returns(bool)
    {
        _mint(to, amount);
        return true;
    }
}