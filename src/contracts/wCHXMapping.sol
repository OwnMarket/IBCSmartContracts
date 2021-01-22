pragma solidity 0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract wCHXMapping is Ownable {
    event AddressMapped(address indexed ethAddress, string chxAddress, string signature);
    event AddressMappingRemoved(address indexed ethAddress, string chxAddress, string signature);

    mapping (address => string) private _mappedEthAddresses;
    mapping (string => address) private _mappedChxAddresses;
    mapping (string => string) private _mappedSignatures;

    constructor()
        public
    {
    }

    function chxAddress(address _ethAddress)
        external
        view
        returns (string memory) 
    {
        return _mappedEthAddresses[_ethAddress];
    }

    function ethAddress(string calldata _chxAddress)
        external
        view
        returns (address) 
    {
        return _mappedChxAddresses[_chxAddress];
    }

    function signature(string calldata _chxAddress)
        external
        view
        returns (string memory) 
    {
        return _mappedSignatures[_chxAddress];
    }

    function mapAddress(string calldata _chxAddress, string calldata _signature)
        external
    {
        address _ethAddress = _msgSender();

        require(bytes(_mappedEthAddresses[_ethAddress]).length == 0);
        require(_mappedChxAddresses[_chxAddress] == address(0));
        require(bytes(_mappedSignatures[_chxAddress]).length == 0);
        _checkChxAddress(_chxAddress);

        _mappedEthAddresses[_ethAddress] = _chxAddress;
        _mappedChxAddresses[_chxAddress] = _ethAddress;
        _mappedSignatures[_chxAddress] = _signature;

        emit AddressMapped(_ethAddress, _chxAddress, _signature);
    }

    function removeMappedAddress(address _ethAddress)
        external
        onlyOwner
    {
        _removeAddress(_ethAddress);
    }

    function _removeAddress(address _ethAddress)
        private
    {
        string memory _chxAddress = _mappedEthAddresses[_ethAddress];
        require(bytes(_chxAddress).length != 0);

        string memory _signature = _mappedSignatures[_chxAddress];
        require(_mappedChxAddresses[_chxAddress] != address(0));
        require(bytes(_signature).length != 0);
        require(_mappedChxAddresses[_chxAddress] == _ethAddress);
        

        delete _mappedEthAddresses[_ethAddress];
        delete _mappedChxAddresses[_chxAddress];
        delete _mappedSignatures[_chxAddress];
        
        emit AddressMappingRemoved(_ethAddress, _chxAddress, _signature);
    }

    function _checkChxAddress(string memory _chxAddress)
        private 
    {
        bytes memory _strBytes = bytes(_chxAddress);

        bytes memory _begining = new bytes(2);
        _begining[0] = _strBytes[0];
        _begining[1] = _strBytes[1];
        require(keccak256(abi.encodePacked(string(_begining))) == keccak256(abi.encodePacked("CH")), "CHX address is incorrect");

        bytes1 _lastChar = _strBytes[_strBytes.length - 1];
        require(
            (_lastChar >= 0x30 && _lastChar <= 0x39) || 
            (_lastChar >= 0x41 && _lastChar <= 0x5A) || 
            (_lastChar >= 0x61 && _lastChar <= 0x7A),
            "CHX address ends with incorrect character"
        );
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
