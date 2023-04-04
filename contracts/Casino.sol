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
    /// @notice Amount of tokens in the prize pool
    uint256 public prizePool;


    /// @notice The maximum bet size, als a percentage of the prizePool
    uint256 public maxBetPercentage;

    string public coin;

    /// @notice Constructor function
    // /// @param tokenName Name of the token used for payment
    // /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid    
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _purchaseRatio,
        uint256 _prizePool,
        uint256 _maxBetPercentage
    ) {
        paymentToken = new CasinoToken(tokenName, tokenSymbol);
        //paymentToken = new CasinoToken();
        purchaseRatio = _purchaseRatio;
        prizePool = _prizePool;
        maxBetPercentage = _maxBetPercentage;
       
    }

    //Mint some T7E tokens for the contract - it is the initial prizePool
    function depositToken () external{
        paymentToken.mint(address(this), prizePool);
    }

    /// @notice Gives tokens based on the amount of ETH sent
    function purchaseTokens() external payable {
        paymentToken.mint(msg.sender, msg.value * purchaseRatio);
    }

    function calculateMaxBetSize() public view returns (uint256) {
        return prizePool * 100 / maxBetPercentage;
    }

    //Pay function used for testing purposes
    // function payGame() external returns (bool){
    //     uint256 maxValue = type(uint256).max;
    //     paymentToken.approve(address(this), maxValue);
    //     paymentToken.transferFrom(msg.sender, address(this), playPrice);
    //     prizePool += playPrice;
    //     return payStatus = true;
    // }

    //Play the game - run the flip coin
    function flipCoin(uint256 playPrice) external returns (string memory) {
        uint256 maxValue = type(uint256).max;
        uint maxBetSize = calculateMaxBetSize();

        require (maxBetSize >= playPrice, "playPrice is higher than the maximum bet size.");
        require (paymentToken.balanceOf(msg.sender) >= playPrice, "Not enough T7E in your wallet");
        
        paymentToken.approve(address(this), maxValue);
        paymentToken.transferFrom(msg.sender, address(this), playPrice); // transfer T7E tokens from player to contract
        prizePool += playPrice;
        
        bool result = getRandomNumber(); // flip a coin to get the result

        if (result==true) {
            // if the result is heads, transfer the payout to the player
            prizePool -= playPrice * 2;
            paymentToken.transfer(msg.sender, playPrice * 2); 
            return coin = "Heads"; 
            
        }
        else{
            return coin = "Tails";   
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