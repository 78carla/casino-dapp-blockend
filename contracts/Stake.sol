// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Stake {
    IERC20 public immutable stakingToken;

    /* ========== STATE VARIABLES ========== */
    address public owner;

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

    /* ========== CONSTRUCTOR ========== */

    constructor(address _stakingToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOwner() {
        require(msg.sender == owner, "not authorized");
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

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalStaked += _amount;
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        balanceOf[msg.sender] -= _amount;
        totalStaked -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }


    function getReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            stakingToken.transfer(msg.sender, reward);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    // function notifyRewardAmount(uint _amount) external onlyOwner updateReward(address(0)) {
    //     if (block.timestamp >= finishAt) {
    //         rewardRate = _amount / duration;
    //     } else {
    //         uint remainingRewards = (finishAt - block.timestamp) * rewardRate;
    //         rewardRate = (_amount + remainingRewards) / duration;
    //     }

    //     require(rewardRate > 0, "reward rate = 0");
    //     require(
    //         rewardRate * duration <= rewardsToken.balanceOf(address(this)),
    //         "reward amount > balance"
    //     );

    //     finishAt = block.timestamp + duration;
    //     updatedAt = block.timestamp;
    // }

}

interface IERC20 {
    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}