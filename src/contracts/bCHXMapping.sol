pragma solidity 0.6.0;

import "../interfaces/IBEP20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract bCHXMapping is Ownable {
    event AddressMapped(address indexed bscAddress, string chxAddress, string signature);
    event AddressMappingRemoved(address indexed bscAddress, string chxAddress, string signature);

    mapping (address => string) private bscToChxAddresses;
    mapping (string => address) private chxToBscAddresses;
    mapping (string => string) private chxToSignatures;

    constructor()
        public
    {
    }

    function chxAddress(address _bscAddress)
        external
        view
        returns (string memory) 
    {
        return bscToChxAddresses[_bscAddress];
    }

    function bscAddress(string calldata _chxAddress)
        external
        view
        returns (address) 
    {
        return chxToBscAddresses[_chxAddress];
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
        address _bscAddress = _msgSender();

        require(bytes(bscToChxAddresses[_bscAddress]).length == 0);
        require(chxToBscAddresses[_chxAddress] == address(0));
        require(bytes(chxToSignatures[_chxAddress]).length == 0);
        checkChxAddress(_chxAddress);
        checkSignature(_signature);

        bscToChxAddresses[_bscAddress] = _chxAddress;
        chxToBscAddresses[_chxAddress] = _bscAddress;
        chxToSignatures[_chxAddress] = _signature;

        emit AddressMapped(_bscAddress, _chxAddress, _signature);
    }

    function removeMappedAddress(address _bscAddress)
        external
        onlyOwner
    {
        string memory _chxAddress = bscToChxAddresses[_bscAddress];
        require(bytes(_chxAddress).length != 0);

        string memory _signature = chxToSignatures[_chxAddress];
        require(bytes(_signature).length != 0);
        require(chxToBscAddresses[_chxAddress] == _bscAddress);
        
        delete bscToChxAddresses[_bscAddress];
        delete chxToBscAddresses[_chxAddress];
        delete chxToSignatures[_chxAddress];
        
        emit AddressMappingRemoved(_bscAddress, _chxAddress, _signature);
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
        return _token.transfer(owner(), _amount);
    }
}
