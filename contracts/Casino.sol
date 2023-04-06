// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

//import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CasinoToken} from "./CasinoToken.sol";
import {CasinoPassport} from "./CasinoPassport.sol";

/// @title A casino contract
/// @author Team 7 - Encode Bootcampo Early
/// @notice You can use this contract for running a simple casino

contract Casino is Ownable {

    /// @notice Address of the token used as payment for the play
    CasinoToken public token;
    /// @notice Address of the NFT required toplay
    CasinoPassport public nft;

    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio;
    /// @notice Payout ratio of winning bets.
    uint256 public payoutRatio;
    /// @notice Amount of tokens required for 1 single play
    uint256 public betSize; 
    /// @notice Amount of tokens staked
    uint256 public stakedAmount;

    // User address => staked amount
    mapping(address => uint256) public balanceOf;

    // User address => Balances at moment of staking
    mapping(address => uint256) public totalSupplyWhenStaked;
    mapping(address => uint256) public stakedAmountWhenStaked;

    /// @notice Constructor function
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    /// @param _betSize Amount of tokens required for placing a play that goes for the prize pool
    /// @param _payoutRatio Return To Player (RTP) percentage. 
    
    constructor(
        uint256 _purchaseRatio,
        uint256 _betSize,
        uint256 _payoutRatio
    ) {
        nft = new CasinoPassport();
        token = new CasinoToken();
        purchaseRatio = _purchaseRatio;
        betSize = _betSize;
        payoutRatio = _payoutRatio;
    }

    /* ========== MODIFIERS ========== */

    modifier nftRequired {
            require(nft.balanceOf(msg.sender) > 0, "A casino NFT is required to play.");
        _;
    }

    /* ========== VIEWS ========== */

    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber() public view returns (uint256 randomNumber) {
        randomNumber = block.prevrandao;
    }
    
    function calculatePayout(uint256 _value, uint256 _multiplier) private view returns (uint256) {
        return (_value * _multiplier * payoutRatio) / 100;
    }

    function balanceOfWithRewards(address account) public view returns (uint256 balance) {
        if (stakedAmount == 0) {
            return 0;
        }
        balance =  (this.totalSupply() * balanceOf[account] / stakedAmount);
    }

    function totalSupply() public view returns (uint256) {
        return token.balanceOf(address(this));
    }


    /* ========== STAKING FUNCTIONS ========== */

    function stake(uint _amount) external {
        require(_amount > 0, "amount = 0");
        require(balanceOfWithRewards(msg.sender) >= balanceOf[msg.sender], "Cannot stake with negative pending rewards");

        // Add any pending rewards to the staking amount. 
        uint256 pendingRewards = balanceOfWithRewards(msg.sender) - balanceOf[msg.sender];
        uint256 amount = _amount + pendingRewards;

        // // Log the totalSupply without the msg.sender's current stake and pending rewards
        totalSupplyWhenStaked[msg.sender] = totalSupply() - balanceOf[msg.sender] - pendingRewards;
        // // Log the stakedAmount without the msg.sender's current stake
        stakedAmountWhenStaked[msg.sender] = stakedAmount - balanceOf[msg.sender];

        token.transferFrom(msg.sender, address(this), amount);
        balanceOf[msg.sender] += amount;
        stakedAmount += amount;
    }

    function unstake(uint256 _amount) external {
        require(balanceOfWithRewards(msg.sender) >= balanceOf[msg.sender], "Cannot unstake with negative pending rewards");

        // Add any pending rewards to the unstaking amount. 
        uint256 pendingRewards = balanceOfWithRewards(msg.sender) - balanceOf[msg.sender];
        uint256 amountWithRewards = _amount + pendingRewards;


        // // Log the totalSupply without the msg.sender's current stake and pending rewards
        totalSupplyWhenStaked[msg.sender] = totalSupply() - balanceOf[msg.sender] - pendingRewards;
        // // Log the stakedAmount without the msg.sender's current stake
        stakedAmountWhenStaked[msg.sender] = stakedAmount - balanceOf[msg.sender];

        token.approve(address(this), amountWithRewards);
        token.transfer(msg.sender, amountWithRewards);
        balanceOf[msg.sender] -= _amount;
        stakedAmount -= _amount;
    }

    function unstakeAll() external {
        uint256 amount = balanceOfWithRewards(msg.sender);
        token.approve(address(this), amount);
        token.transfer(msg.sender, amount);
        stakedAmount -= balanceOf[msg.sender];
        balanceOf[msg.sender] = 0;
    }

    /// @notice Gives tokens based on the amount of ETH sent
    function purchaseTokens() external payable {
        token.mint(msg.sender, msg.value * purchaseRatio);
    }

    /// @notice Gives an NFT for a fixed amount of T7E tokens
    function purchaseNft() external {
        nft.safeMint(msg.sender);
    }

    //Play the game - run the flip coin
    function flipCoin(bool _heads) external returns (string memory)  {
        uint256 multiplier = 2;
        require (totalSupply() >= betSize, "Not enough T7E in the prize pool");
        require (token.balanceOf(msg.sender) >= betSize, "Not enough T7E in your wallet");
        
        token.transferFrom(msg.sender, address(this), betSize); // transfer T7E tokens from player to contract

        bool result = getRandomNumber() % 2 == 0 ? true: false ;

        if (result == _heads) {
            uint256 payout = calculatePayout(betSize, multiplier);
            // if the result is heads, transfer the payout to the player
            token.approve(address(this), payout + betSize);
            token.transfer(msg.sender, payout); 
        }
        return result ? "Heads" : "Tails";
    }
    
    // //Play the game - run the flip coin
    // function flipCoin(bool _heads, uint256 _betSize) external nftRequired returns (string memory)  {
    //     uint256 multiplier = 2;
    //     require (totalSupply() >= _betSize, "Not enough T7E in the prize pool");
    //     require (token.balanceOf(msg.sender) >= _betSize, "Not enough T7E in your wallet");
        
    //     token.transferFrom(msg.sender, address(this), _betSize); // transfer T7E tokens from player to contract
        
    //     bool result = getRandomNumber() % 2 == 0 ? _heads: !_heads ;

    //     if (result) {
    //         uint256 payout = calculatePayout(_betSize, multiplier);
    //         // if the result is heads, transfer the payout to the player
    //         token.approve(address(this), payout + _betSize);
    //         token.transfer(msg.sender, payout); 
    //     }
    //     return result ? "Heads" : "Tails";
    // }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 _amount) external {
        require(_amount > 0, "amount = 0");
        token.burnFrom(msg.sender, _amount);
        payable(msg.sender).transfer(_amount / purchaseRatio);
    }
}