// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

//import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CasinoToken} from "./CasinoToken.sol";

/// @title A casino contract
/// @author Team 7 - Encode Bootcampo Early
/// @notice You can use this contract for running a simple casino

contract Casino is Ownable {
    /// @notice Contract of the token used as payment for the play
    CasinoToken public token;
    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio;


    /// @notice Amount of tokens required for 1 single play
    uint256 public playPrice; 
    // TODO: make this an input for games, maybe with Min/Max

    /// @notice Amount of tokens in the prize pool
    uint256 public prizePool; 
    //TODO: can't we just do token.balance(address(this)) or something? This would return T7E balance for casino address

    // Casino profit for staking period
    uint256 public casinoProfit;


    // Sum of (reward rate * dt * 1e18 / total supply)
    uint public rewardPerTokenStaked;
    // User address => rewardPerTokenStaked
    mapping(address => uint) public userRewardPerTokenPaid;
    // User address => rewards to be claimed
    mapping(address => uint) public rewards;

    // Total staked
    uint public totalStaked;
    // User address => staked amount
    mapping(address => uint) public balanceOf;

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
        token = new CasinoToken(tokenName, tokenSymbol);
        purchaseRatio = _purchaseRatio;
        playPrice = _playPrice;
        prizePool = _prizePool;
       
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address _account) {
        rewardPerTokenStaked = rewardPerToken();
        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStaked;
        }
        _;
    }

    /* ========== VIEWS ========== */

    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber() public view returns (bool) {
        uint256 randomNumber;
        randomNumber = block.prevrandao;
        return randomNumber % 2 == 0 ? false: true; // return true for heads (1) and false for tails (0)
    }

    function rewardPerToken() public view returns (uint256) {
        if (this.totalSupply() == 0) {
            return 0;
        }
        return casinoProfit / this.totalSupply();
    }

    function totalSupply() public view returns (uint256) {

        return (casinoProfit + totalStaked);
    }

    function earned(address _account) public view returns (uint) {
        return
            ((balanceOf[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    /* ========== MODIFIERS ========== */

    function stake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        token.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalStaked += _amount;
    }

    /// @notice Gives tokens based on the amount of ETH sent
    function purchaseTokens() external payable {
        token.mint(msg.sender, msg.value * purchaseRatio);
    }

    function flipCoin() external payable{
        require (msg.value >= playPrice, "Not enough T7E sent");
        require (prizePool >= playPrice, "Not enough T7E in the prize pool");
        require (token.approve(address(this), msg.value),"Approve failed");
        require(token.transferFrom(msg.sender, address(this), playPrice), "Payment failed"); // transfer T7E tokens from player to contract
        
        bool result = getRandomNumber(); // flip a coin to get the result
        //emit FlipResult(result, msg.sender); // log the result of the flip
        if (result==false) {
            // if the result is heads, transfer the payout to the player
            prizePool -= playPrice * 2;
            require(token.transfer(msg.sender, playPrice * 2), "Impossible to pay the win - Transfer failed"); 
        }
        else 
        prizePool += playPrice;
        
    }

    // /// @notice Withdraws `amount` from that accounts's prize pool
    // function prizeWithdraw(uint256 amount) external {
    //     require(amount <= prize[msg.sender], "Not enough prize");
    //     prize[msg.sender] -= amount;
    //     token.transfer(msg.sender, amount);
    // }

    /// @notice Withdraws `amount` from the prize pool - allowed by owner only
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= prizePool, "Not enough fees collected");
        prizePool -= amount;
        token.transfer(msg.sender, amount);
    }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        token.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}
