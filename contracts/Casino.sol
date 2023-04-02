// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

//import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CasinoToken} from "./CasinoToken.sol";

/// @title A casino contract
/// @author Team 7 - Encode Bootcampo Early
/// @notice You can use this contract for running a simple casino

contract Casino is Ownable {
    /// @notice Address of the token used as payment for the play
    CasinoToken public paymentToken;
    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio;
    /// @notice Amount of tokens required for 1 single play
    uint256 public playPrice;
    /// @notice Amount of tokens in the prize pool
    uint256 public prizePool;


    //event FlipResult(bool result, address player);


    /// @notice Constructor function
    // /// @param tokenName Name of the token used for payment
    // /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    /// @param _playPrice Amount of tokens required for placing a play that goes for the prize pool
    
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _purchaseRatio,
        uint256 _playPrice,
        uint256 _prizePool
    ) {
        paymentToken = new CasinoToken(tokenName, tokenSymbol);
        //paymentToken = new CasinoToken();
        purchaseRatio = _purchaseRatio;
        playPrice = _playPrice;
        prizePool = _prizePool;
       
    }


    /// @notice Gives tokens based on the amount of ETH sent
    function purchaseTokens() external payable {
        paymentToken.mint(msg.sender, msg.value * purchaseRatio);
    }


    function flipCoin() external{
        require (prizePool >= playPrice, "Not enough T7E in the prize pool");
        paymentToken.approve(address(this), playPrice);
        paymentToken.transferFrom(msg.sender, address(this), playPrice); // transfer T7E tokens from player to contract
        
        bool result = getRandomNumber(); // flip a coin to get the result
        //emit FlipResult(result, msg.sender); // log the result of the flip
        if (result==false) {
            // if the result is heads, transfer the payout to the player
            prizePool -= playPrice * 2;
            paymentToken.transfer(msg.sender, playPrice * 2); 
        }
        else {
            prizePool += playPrice;
        }
        
    }


    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber() public view returns (bool) {
        uint256 randomNumber;
        randomNumber = block.prevrandao;
        return randomNumber % 2 == 0 ? false: true; // return true for heads (1) and false for tails (0)
    }

    // /// @notice Withdraws `amount` from that accounts's prize pool
    // function prizeWithdraw(uint256 amount) external {
    //     require(amount <= prize[msg.sender], "Not enough prize");
    //     prize[msg.sender] -= amount;
    //     paymentToken.transfer(msg.sender, amount);
    // }

    /// @notice Withdraws `amount` from the prize pool - allowed by owner only
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= prizePool, "Not enough fees collected");
        prizePool -= amount;
        paymentToken.transfer(msg.sender, amount);
    }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}
