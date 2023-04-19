import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Casino, Casino__factory, CasinoToken, CasinoToken__factory } from "../typechain-types";

const MINT_VALUE = ethers.utils.parseEther("0.5");

const TOKEN_RATIO = 10000;
const PLAY_PRICE = 1;
const PAYOUT_RATIO = 95;

// function convertStringArrayToBytes32(array: string[]) {
//   const bytes32Array = [];
//   for (let index = 0; index < array.length; index++) {
//     bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
//   }
//   return bytes32Array;
// }

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
        const mintTx = await casinoContract.connect(account1).purchaseTokens({value: MINT_VALUE});
        const mintTxReceipt = await mintTx.wait();
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

  describe("when an account wins a bet gambles", function () {
    let tokenBalanceAccount1BeforeMint: BigNumber;
    let ethBalanceAccount1BeforeMint: BigNumber;
    let tokenBalanceAccount1AfterMint: BigNumber;
    let ethBalanceAccount1AfterMint: BigNumber;
    let gasCosts: BigNumber;
    beforeEach(async function () {
        const mintTx = await casinoContract.connect(account1).purchaseTokens({value: MINT_VALUE});
        await mintTx.wait();
        tokenBalanceAccount1BeforeMint = await tokenContract.balanceOf(account1.address);
        ethBalanceAccount1BeforeMint = await account1.getBalance();

        const allowTx = await tokenContract.connect(account1).approve(casinoContract.address, PLAY_PRICE);
        await allowTx.wait();
        
        const gambleTx = await casinoContract.connect(account1).flipCoin(true);
        const gambleTxReceipt = await gambleTx.wait();
        gasCosts = gambleTxReceipt.gasUsed.mul(gambleTxReceipt.effectiveGasPrice);
        console.log(gasCosts);
        tokenBalanceAccount1AfterMint = await tokenContract.balanceOf(account1.address);
        ethBalanceAccount1AfterMint = await account1.getBalance();
      });
    it("receive the correct amount of tokens", async function () {
        const diff = tokenBalanceAccount1AfterMint.sub(tokenBalanceAccount1BeforeMint);        
        expect(diff).to.eq(MINT_VALUE.mul(0));
    });
    it("is charged the correct amount of ether", async function () {
        const diff = ethBalanceAccount1BeforeMint.sub(ethBalanceAccount1AfterMint);
        expect(diff).to.eq(MINT_VALUE.add(0));
    });
  });

//   describe("when an account self delegates ", function () {
//     let votePowerAccount1: BigNumber;
//     beforeEach(async function () {
//         const delegateTx = await tokenContract.connect(account1).delegate(account1.address);
//         const delegateTxReceipt = await delegateTx.wait();
//         votePowerAccount1 = await tokenContract.getVotes(account1.address);
//       });
//     it("has the correct voting power", async () => {
//         expect(votePowerAccount1).to.eq(MINT_VALUE);
//     });
//     it("compare the historical voting power before and after self delegating", async () => {
//         const currentBlock = await ethers.provider.getBlock("latest");
//         const votePowerAccount1Historically = await tokenContract.getPastVotes(account1.address, currentBlock.number-1);
//         const diff = votePowerAccount1.sub(votePowerAccount1Historically);
//         expect(diff).to.eq(MINT_VALUE);
//         expect(votePowerAccount1Historically).to.eq(0);
//     });
//   });
// });

//   describe("when an account transfer the tokens", function () {
//     // TODO
//     it("has the correct voting power", async () => {
//       throw Error("Not implemented");
//     });
//   });
//   // TODO
//   it("compare the historical voting power before and after the transfer", async () => {
//     throw Error("Not implemented");
//   });

//   describe("when an account casts their votes", function () {
//     // TODO
//     it("winning proposal is X", async () => {
//       throw Error("Not implemented");
//     });
//     it("voting power is decreased by number of votes", async () => {
//       throw Error("Not implemented");
//     });
//     });
//     it("transferring tokens does not effect the votes that have been cast", async () => {
//     throw Error("Not implemented");
//     });
  });