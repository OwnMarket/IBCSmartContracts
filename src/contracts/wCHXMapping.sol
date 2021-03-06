pragma solidity 0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract wCHXMapping is Ownable {
    event AddressMapped(address indexed ethAddress, string chxAddress, string signature);
    event AddressMappingRemoved(address indexed ethAddress, string chxAddress, string signature);

    mapping (address => string) private ethToChxAddresses;
    mapping (string => address) private chxToEthAddresses;
    mapping (string => string) private chxToSignatures;

    constructor()
        public
    {
    }

    function chxAddress(address _ethAddress)
        external
        view
        returns (string memory) 
    {
        return ethToChxAddresses[_ethAddress];
    }

    function ethAddress(string calldata _chxAddress)
        external
        view
        returns (address) 
    {
        return chxToEthAddresses[_chxAddress];
    }

    function signature(string calldata _chxAddress)
        external
        view
        returns (string memory) 
    {
        return chxToSignatures[_chxAddress];
    }

    function mapAddress(string calldata _chxAddress, string calldata _signature)
        external
    {
        address _ethAddress = _msgSender();

        require(bytes(ethToChxAddresses[_ethAddress]).length == 0);
        require(chxToEthAddresses[_chxAddress] == address(0));
        require(bytes(chxToSignatures[_chxAddress]).length == 0);
        checkChxAddress(_chxAddress);
        checkSignature(_signature);

        ethToChxAddresses[_ethAddress] = _chxAddress;
        chxToEthAddresses[_chxAddress] = _ethAddress;
        chxToSignatures[_chxAddress] = _signature;

        emit AddressMapped(_ethAddress, _chxAddress, _signature);
    }

    function removeMappedAddress(address _ethAddress)
        external
        onlyOwner
    {
        string memory _chxAddress = ethToChxAddresses[_ethAddress];
        require(bytes(_chxAddress).length != 0);

        string memory _signature = chxToSignatures[_chxAddress];
        require(bytes(_signature).length != 0);
        require(chxToEthAddresses[_chxAddress] == _ethAddress);
        
        delete ethToChxAddresses[_ethAddress];
        delete chxToEthAddresses[_chxAddress];
        delete chxToSignatures[_chxAddress];
        
        emit AddressMappingRemoved(_ethAddress, _chxAddress, _signature);
    }

    function isAlphanumericChar(bytes1 _char)
        private
        pure
        returns (bool)
    {
        return (_char >= 0x30 && _char <= 0x39) || 
            (_char >= 0x41 && _char <= 0x5A) || 
            (_char >= 0x61 && _char <= 0x7A);
    }

    function checkChxAddress(string memory _chxAddress)
        private 
        pure
    {
        bytes memory _strBytes = bytes(_chxAddress);
        bytes memory _prefix = bytes("CH");
        require(_strBytes[0] == _prefix[0] && _strBytes[1] == _prefix[1], "Invalid CHX address");

        bytes1 _lastChar = _strBytes[_strBytes.length - 1];
        require(isAlphanumericChar(_lastChar), "CHX address ends with incorrect character");
    }

    function checkSignature(string memory _signature)
        private 
        pure
    {
        bytes memory _strBytes = bytes(_signature);

        bytes1 _firstChar = _strBytes[0];
        require(isAlphanumericChar(_firstChar), "Signature ends with incorrect character");

        bytes1 _lastChar = _strBytes[_strBytes.length - 1];
        require(isAlphanumericChar(_lastChar), "Signature ends with incorrect character");
    }

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
