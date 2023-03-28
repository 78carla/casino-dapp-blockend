// contracts/MyERC20.sol
//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
contract MyERC20 is ERC20, AccessControl{

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    constructor () ERC20 ("Team7Early", "T7E") { 
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE){
        _mint(to, amount);
    }
    
}


