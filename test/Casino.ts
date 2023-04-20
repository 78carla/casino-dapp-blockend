import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Casino, Casino__factory, CasinoToken, CasinoToken__factory } from "../typechain-types";

const MINT_VALUE = ethers.utils.parseEther("0.5");

const TOKEN_RATIO = 10000;
const PLAY_PRICE = 1;
const PAYOUT_RATIO = 95;
const STAKE_AMOUNT = ethers.utils.parseEther("2");

// function convertStringArrayToBytes32(array: string[]) {
//   const bytes32Array = [];
//   for (let index = 0; index < array.length; index++) {
//     bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
//   }
//   return bytes32Array;
// }



async function allow(contract, wallet, spender, value) {
  const tx = await contract.connect(wallet).approve(spender.address, value);
  return tx.wait();  
}

async function buyTokens(contract, wallet, value) {
  const tx = await contract.connect(wallet).purchaseTokens({value: value});
  return tx.wait();  
}

async function stakeTokens(contract, wallet, value) {
  const tx = await contract.connect(wallet).stake(value);
  return tx.wait();  
}

async function unstakeAll(contract, wallet) {
  const tx = await contract.connect(wallet).unstakeAll();
  return tx.wait();  
}

async function flipCoin(contract, wallet, value) {
  const tx = await contract.connect(wallet).flipCoin(value);
  return tx.wait();  
}


describe("Casino", function () {
    let tokenContract: CasinoToken;
    let casinoContract: Casino;
    
    let deployer: SignerWithAddress;
    let account1: SignerWithAddress;
    let account2: SignerWithAddress;
    beforeEach(async function () {
        [deployer, account1, account2] = await ethers.getSigners();

        // Deploy the Casino contract
        const contractFactory = new Casino__factory(deployer);
        casinoContract = await contractFactory.deploy(
          TOKEN_RATIO,
          ethers.utils.parseEther(PLAY_PRICE.toFixed(18)),
          PAYOUT_RATIO
        );
        const deployTxReceipt = await casinoContract.deployTransaction.wait();
        console.log(`The casino contract is deployed at block ${deployTxReceipt.blockNumber}`);

        
        const tokenContractAddress = await casinoContract.token();
        const tokenFactory = new CasinoToken__factory(deployer);
        tokenContract = tokenFactory.attach(tokenContractAddress);
        // const attachTxReceipt = await tokenContract.deployTransaction.wait();
        // console.log(`The token contract is attached at block ${attachTxReceipt.blockNumber}`);
      });

      describe("when the contracts are deployed", function () {
        it("has no staked tokens", async function () {
          const stakedAmount = await casinoContract.stakedAmount();
          expect(stakedAmount).to.eq(0);
        });

        it("has zero tokens in circulation", async function () {
          const totalSupply = await tokenContract.totalSupply();
          expect(totalSupply).to.eq(0);
        });
      
  });

  describe("when an account mints tokens", function () {
    let tokenBalanceAccount1BeforeMint: BigNumber;
    let ethBalanceAccount1BeforeMint: BigNumber;
    let tokenBalanceAccount1AfterMint: BigNumber;
    let ethBalanceAccount1AfterMint: BigNumber;
    let gasCosts: BigNumber;
    beforeEach(async function () {
        tokenBalanceAccount1BeforeMint = await tokenContract.balanceOf(account1.address);
        ethBalanceAccount1BeforeMint = await account1.getBalance();
        const mintTxReceipt = await buyTokens(casinoContract, account1, MINT_VALUE);
        gasCosts = mintTxReceipt.gasUsed.mul(mintTxReceipt.effectiveGasPrice);
        tokenBalanceAccount1AfterMint = await tokenContract.balanceOf(account1.address);
        ethBalanceAccount1AfterMint = await account1.getBalance();
      });
    it("receive the correct amount of tokens", async function () {
        const diff = tokenBalanceAccount1AfterMint.sub(tokenBalanceAccount1BeforeMint);        
        expect(diff).to.eq(MINT_VALUE.mul(TOKEN_RATIO));
    });
    it("is charged the correct amount of ether", async function () {
        const diff = ethBalanceAccount1BeforeMint.sub(ethBalanceAccount1AfterMint);
        expect(diff).to.eq(MINT_VALUE.add(gasCosts));
    });
  });

  describe("when an account makes a bet", function () {
    let tokenBalanceAccount1Before: BigNumber;
    let tokenBalanceAccount1After: BigNumber;
    let gasCosts: BigNumber;
    const payout = ethers.utils.parseEther(PLAY_PRICE.toString()).mul(2).mul(PAYOUT_RATIO).div(100);
    const playPrice = ethers.utils.parseEther(PLAY_PRICE.toString());
    beforeEach(async function () {

      // prep for gamble
        await buyTokens(casinoContract, account1, MINT_VALUE);
        await allow(tokenContract, account1, casinoContract, STAKE_AMOUNT);
        await stakeTokens(casinoContract, account1, STAKE_AMOUNT);
        await allow(tokenContract, account1, casinoContract, STAKE_AMOUNT);
        tokenBalanceAccount1Before = await tokenContract.balanceOf(account1.address);
        const gambleTxReceipt = await flipCoin(casinoContract, account1, false);
        gasCosts = gambleTxReceipt.gasUsed.mul(gambleTxReceipt.effectiveGasPrice);
        tokenBalanceAccount1After = await tokenContract.balanceOf(account1.address);
      });
      it("receive the correct amount of after win or loss", async function () {
          // if win
          if (tokenBalanceAccount1After > tokenBalanceAccount1Before) {
            console.log("WINNER");
            const diff = tokenBalanceAccount1After.sub(tokenBalanceAccount1Before);
            expect(diff).to.eq(payout.sub(playPrice));
          }
          // else lose
          else {
            console.log("LOSER");
            const diff = tokenBalanceAccount1Before.sub(tokenBalanceAccount1After);
          }
      });
  });

  describe("when the casino makes a profit", function () {
    let tokenBalanceAccount1Before: BigNumber;
    let tokenBalanceAccount1After: BigNumber;
    let casinoBalanceBefore: BigNumber;
    let casinoBalanceAfter: BigNumber;
    let gasCosts: BigNumber;
    beforeEach(async function () {

        await buyTokens(casinoContract, deployer, MINT_VALUE);
        await buyTokens(casinoContract, account1, MINT_VALUE);

        tokenBalanceAccount1Before = await tokenContract.balanceOf(account1.address);

        await allow(tokenContract, account1, casinoContract, ethers.constants.MaxUint256);
        await stakeTokens(casinoContract, account1, ethers.utils.parseEther("20"));
        
        // Move Tokens to casino contract to simulate profits.
        const fakeProfitTx = await tokenContract.connect(deployer).transfer(casinoContract.address, ethers.utils.parseEther("5"));
        const fakeProfitTxReceipt = await fakeProfitTx.wait();
        
        await unstakeAll(casinoContract, account1);
        tokenBalanceAccount1After = await tokenContract.balanceOf(account1.address);
        
      });
      it("accounts receives the right staking rewards", async function () {
        const diff = tokenBalanceAccount1After.sub(tokenBalanceAccount1Before);
        expect(diff).to.eq(ethers.utils.parseEther("5"));
      });

  });

  // TODO: implement more sophisticated staking test cases
  
  // describe("when multiple accounts make a staking profit", function () {
  //   let tokenBalanceAccount0Before: BigNumber;
  //   let tokenBalanceAccount0After: BigNumber;
  //   let tokenBalanceAccount1Before: BigNumber;
  //   let tokenBalanceAccount1After: BigNumber;
  //   let tokenBalanceAccount2Before: BigNumber;
  //   let tokenBalanceAccount2After: BigNumber;
  //   let gasCosts: BigNumber;
  //   beforeEach(async function () {

  //       await buyTokens(casinoContract, deployer, MINT_VALUE);
  //       await buyTokens(casinoContract, account1, MINT_VALUE);
  //       await buyTokens(casinoContract, account2, MINT_VALUE);

  //       tokenBalanceAccount0Before = await tokenContract.balanceOf(deployer.address);
  //       tokenBalanceAccount1Before = await tokenContract.balanceOf(account1.address);
  //       tokenBalanceAccount2Before = await tokenContract.balanceOf(account2.address);

  //       // All accounts stake tokens
  //       await allow(tokenContract, deployer, casinoContract, ethers.constants.MaxUint256);
  //       await stakeTokens(casinoContract, deployer, ethers.utils.parseEther("1"));
  //       await allow(tokenContract, account1, casinoContract, ethers.constants.MaxUint256);
  //       await stakeTokens(casinoContract, account1, ethers.utils.parseEther("5"));
  //       await allow(tokenContract, account2, casinoContract, ethers.constants.MaxUint256);
  //       await stakeTokens(casinoContract, account2, ethers.utils.parseEther("20"));

        
  //       // Move Tokens to casino contract to simulate profits.
  //       const fakeProfitTx = await tokenContract.connect(deployer).transfer(casinoContract.address, ethers.utils.parseEther("5"));
  //       const fakeProfitTxReceipt = await fakeProfitTx.wait();
  //       await unstakeAll(casinoContract, deployer);
  //       await unstakeAll(casinoContract, account1);
  //       await unstakeAll(casinoContract, account2);
  //       tokenBalanceAccount0After = await tokenContract.balanceOf(deployer.address);
  //       tokenBalanceAccount1After = await tokenContract.balanceOf(account1.address);
  //       tokenBalanceAccount2After = await tokenContract.balanceOf(account2.address);
        
  //     });
  //     it("all accounts receive the right staking rewards", async function () {
  //       console.log(tokenBalanceAccount2After);
  //       console.log(tokenBalanceAccount2Before);
  //       const diff = tokenBalanceAccount2After.sub(tokenBalanceAccount2Before);
  //       expect(diff).to.eq(0);
  //     });
  //     // it("all accounts receive the right staking rewards", async function () {
  //     //   const diff = tokenBalanceAccount1After.sub(tokenBalanceAccount1Before);
  //     //   expect(diff).to.eq(0);
  //     // });
  //     // it("all accounts receive the right staking rewards", async function () {
  //     //   const diff = tokenBalanceAccount2After.sub(tokenBalanceAccount2Before);
  //     //   expect(diff).to.eq(0);
  //     // });
  // });


  });