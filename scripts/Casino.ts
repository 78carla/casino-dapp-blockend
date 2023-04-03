import { ethers } from "hardhat";
import * as readline from "readline";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Casino,
  CasinoToken,
  CasinoToken__factory,
  Casino__factory,
} from "../typechain-types";

import * as dotenv from "dotenv";
import { Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
dotenv.config();

let contract: Casino;
let token: CasinoToken;
//let accounts: SignerWithAddress[];

let signer;

const PLAY_PRICE = 0.001;
const PRIZE_POOL = 100;
const TOKEN_RATIO = 10000;
const BUY_AMOUNT = 1;
const AUTORIZED_AMOUNT = 2;
const WITHDRAWAL_AMOUNT = 10;
//const PAY_AMOUNT = "1";
// const GUESS = true; //true = heads, false = tails

async function main() {
  // Connect to the network
  const provider = new ethers.providers.InfuraProvider(
    "sepolia",
    process.env.INFURA_API_KEY_SEPOLIA
  );

  // Get the private key from the environment variable
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.length <= 0) {
    throw new Error("Private key missing");
  }

  //Connect to the wallet
  const wallet = new ethers.Wallet(privateKey);
  console.log("Connected to the wallet address", wallet.address);
  signer = wallet.connect(provider);

  //signer = (await ethers.getSigners())[0];
  console.log("The signer is", signer.address);

  console.log("Deploying Casino contract:");
  //const contractFactory = new Lottery__factory(accounts[0]);
  const contractFactory = new Casino__factory(signer);
  const contract = contractFactory.attach(
    "0xb9887c6F00d009A784516191F7F017973B9E4808"
  );

  const tokenAddress = await contract.paymentToken();
  const tokenFactory = new CasinoToken__factory(signer);
  token = tokenFactory.attach(tokenAddress);

  console.log(
    "The Casino contract address is:",
    contract.address,
    "and was deployed by",
    signer.address,
    "\n"
  );
  console.log(
    "The Token contract address is:",
    token.address,
    "by",
    signer.address,
    "\n"
  );

  // Get the ETH balance of the signer
  const balanceBN = await ethers.provider.getBalance(signer.address);
  const balance = ethers.utils.formatEther(balanceBN);
  console.log(`The ${signer.address} account has ${balance} ETH\n`);

  //Buy some T7E tokens
  const txBuy = await contract.connect(signer).purchaseTokens({
    value: ethers.utils.parseEther(BUY_AMOUNT.toString()).div(TOKEN_RATIO),
  });
  const receiptBuy = await txBuy.wait();
  console.log(
    `The account ${signer.address} account has bought some tokens. Tokens bought at ${receiptBuy.transactionHash} transaction hash\n`
  );

  //Check the T7E balance of the signer after the purchase
  const tokenBalanceBN = await token.balanceOf(signer.address);
  const tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
  console.log(`The ${signer.address} account has now ${tokenBalance} T7E\n`);

  //Check the ETH balance of the signer after the purchase
  const balanceBNBuy = await ethers.provider.getBalance(signer.address);
  const balanceBuy = ethers.utils.formatEther(balanceBNBuy);
  console.log(`The ${signer.address} account has now ${balanceBuy} ETH\n`);

  //The signer allows the Casino contract to spend the T7E tokens
  const allowTx = await token
    .connect(signer)
    .approve(contract.address, ethers.constants.MaxUint256);
  const allowTxReceipt = await allowTx.wait();
  console.log("Allowance confirmed at block", allowTxReceipt.blockNumber, "\n");

  //Payment function used for testing purposes
  // const payGameTx = await contract.connect(signer).payGame();
  // const payGameTxReceipt = await payGameTx.wait();
  // console.log("PayGame confirmed at block", payGameTxReceipt.blockNumber, "\n");

  //Return the pool size before the play
  const prizePoolBefore = await contract.prizePool();
  console.log(
    "The initial Prize pool contains: ",
    ethers.utils.formatEther(prizePoolBefore),
    "T7E"
  );

  //Returns the random number
  const resultTx = await contract.getRandomNumber();
  console.log("The Random number is: ", resultTx);

  //Play the game and flip the coin
  const flipTx = await contract.connect(signer).flipCoin();
  const flipTxReceipt = await flipTx.wait();
  const flipCoinResult = await contract.coin();
  console.log(
    "The Flip was confermed at block number",
    flipTxReceipt.blockNumber,
    "\n"
  );
  console.log("The Flip result is: ", flipCoinResult, "\n");

  //Return the pool size after the play
  const prizePoolAfter = await contract.prizePool();
  console.log(
    "After the Flip the Prize pool contains: ",
    ethers.utils.formatEther(prizePoolAfter),
    "T7E"
  );

  //Return the T7E balance of the signer after the play
  const tokenBalanceBNAfter = await token.balanceOf(signer.address);
  const tokenBalanceAfter = ethers.utils.formatEther(tokenBalanceBNAfter);
  console.log(
    `After the Flip the ${signer.address} account now has ${tokenBalanceAfter} T7E\n`
  );

  //Return the ETH balance of the signer after the play
  const balanceBNAfter = await ethers.provider.getBalance(signer.address);
  const balanceAfter = ethers.utils.formatEther(balanceBNAfter);
  console.log(
    `After the Flip the ${signer.address} account has ${balanceAfter} ETH\n`
  );

  //The owner can withdraw the prize pool
  // const poolTx = await contract.ownerWithdraw(ethers.utils.parseEther("10"));
  // const poolReceipt = await poolTx.wait();
  // console.log(`Withdraw confirmed (${poolReceipt.transactionHash})\n`);

  // //Return the pool size after the withdraw
  // const prizePoolAfterWithdraw = await contract.prizePool();
  // console.log(
  //   "After the Flip the Prize pool contains: ",
  //   ethers.utils.formatEther(prizePoolAfterWithdraw),
  //   "T7E"
  // );

  // async function displayPrize(index: string): Promise<string> {
  //   const prizeBN = await contract.prize(accounts[Number(index)].address);
  //   const prize = ethers.utils.formatEther(prizeBN);
  //   console.log(
  //     `The account of address ${
  //       accounts[Number(index)].address
  //     } has earned a prize of ${prize} Tokens\n`
  //   );
  //   return prize;
  // }

  // async function claimPrize(index: string, amount: string) {
  //   const tx = await contract
  //     .connect(accounts[Number(index)])
  //     .prizeWithdraw(ethers.utils.parseEther(amount));
  //   const receipt = await tx.wait();
  //   console.log(`Prize claimed (${receipt.transactionHash})\n`);
  // }

  // async function displayOwnerPool() {
  //   const balanceBN = await contract.ownerPool();
  //   const balance = ethers.utils.formatEther(balanceBN);
  //   console.log(`The owner pool has (${balance}) Tokens \n`);
  // }

  // async function burnTokens(index: string, amount: string) {
  //   const allowTx = await token
  //     .connect(accounts[Number(index)])
  //     .approve(contract.address, ethers.constants.MaxUint256);
  //   const receiptAllow = await allowTx.wait();
  //   console.log(`Allowance confirmed (${receiptAllow.transactionHash})\n`);
  //   const tx = await contract
  //     .connect(accounts[Number(index)])
  //     .returnTokens(ethers.utils.parseEther(amount));
  //   const receipt = await tx.wait();
  //   console.log(`Burn confirmed (${receipt.transactionHash})\n`);
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
