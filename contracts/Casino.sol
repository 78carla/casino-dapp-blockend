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
    /// @notice Amount of tokens required for 1 single play
    uint256 public playPrice; 
    /// @notice The price (in T7E tokens) for buying an NFT
    uint256 public nftPrice;
    /// @notice Amount of tokens staked
    uint256 public stakedAmount;

    // Sum of (reward rate * dt * 1e18 / total supply)
    uint public rewardPerTokenStaked;
    // User address => rewardPerTokenStaked
    mapping(address => uint) public userRewardPerTokenPaid;
    // User address => rewards to be claimed
    mapping(address => uint) public rewards;

    // User address => staked amount
    mapping(address => uint) public balanceOf;


    /// @notice Constructor function
    // /// @param tokenName Name of the token used for payment
    // /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    /// @param _playPrice Amount of tokens required for placing a play that goes for the prize pool
    
    constructor(
        uint256 _purchaseRatio,
        uint256 _playPrice,
        uint256 _nftPrice
    ) {
        nft = new CasinoPassport();
        token = new CasinoToken();
        purchaseRatio = _purchaseRatio;
        playPrice = _playPrice;
        nftPrice = _nftPrice;
    }

    /* ========== MODIFIERS ========== */

    modifier nftRequired() {
            require(nft.balanceOf(msg.sender) >= 0, "A casino NFT is required to play.");
        _;
    }

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
    function getRandomNumber() public view returns (uint256 randomNumber) {
        randomNumber = block.prevrandao;
    }

    function rewardPerToken() public view returns (uint256) {
        if (this.totalSupply() == 0) {
            return 0;
        }
        return (totalSupply() - stakedAmount) / stakedAmount;
    }

    function totalSupply() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function earned(address _account) public view returns (uint256) {
        return
            ((balanceOf[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        token.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        stakedAmount += _amount;
    }

    function unstake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        balanceOf[msg.sender] -= _amount;
        stakedAmount -= _amount;
        token.transfer(msg.sender, _amount);
    }

    /// @notice Gives tokens based on the amount of ETH sent
    function purchaseTokens() external payable {
        token.mint(msg.sender, msg.value * purchaseRatio);
    }

    /// @notice Gives an NFT for a fixed amount of T7E tokens
    function purchaseNft() external {
        require(token.transferFrom(msg.sender, address(this), nftPrice), "Not enough T7E balance to buy the NFT");
        nft.safeMint(msg.sender);
    }

    //Play the game - run the flip coin
    function flipCoin() external returns (string memory) {
        uint256 payoutRate = 2;
        require (totalSupply() >= playPrice, "Not enough T7E in the prize pool");
        require (token.balanceOf(msg.sender) >= playPrice, "Not enough T7E in your wallet");
        
        token.transferFrom(msg.sender, address(this), playPrice); // transfer T7E tokens from player to contract
        
        bool result = getRandomNumber() % 2 == 0 ? true: false ;

        if (result) {
            // if the result is heads, transfer the payout to the player
            token.approve(address(this), playPrice * payoutRate + 1);
            token.transfer(msg.sender, playPrice * payoutRate); 
            return "Head";
        }
        else {
            return "Tails";
        }
    }
        
    // /// @notice Withdraws `amount` from that accounts's prize pool
    // function prizeWithdraw(uint256 amount) external {
    //     require(amount <= prize[msg.sender], "Not enough prize");
    //     prize[msg.sender] -= amount;
    //     token.transfer(msg.sender, amount);
    // }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        token.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}