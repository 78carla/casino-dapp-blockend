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
  const contract = contractFactory.attach("0x35a04b231D685DbFA507179E7066561c2Ee86690");


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
  //async function displayBalance(address: string) {
  const balanceBN = await ethers.provider.getBalance(signer.address);
  const balance = ethers.utils.formatEther(balanceBN);
  console.log(`The ${signer.address} account has ${balance} ETH\n`);
  //}

  //Buy some T7E tokens
  // async function buyTokens(index: string, amount: string) {
  const txBuy = await contract.connect(signer).purchaseTokens({
    value: ethers.utils.parseEther(BUY_AMOUNT.toString()).div(TOKEN_RATIO),
  });
  const receiptBuy = await txBuy.wait();
  console.log(
    `Tokens bought at ${receiptBuy.transactionHash} transaction hash\n`
  );

  //Check the T7E balance of the signer
  //async function displayTokenBalance(index: string) {
  const tokenBalanceBN = await token.balanceOf(signer.address);
  const tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
  console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

  const balanceBNBuy = await ethers.provider.getBalance(signer.address);
  const balanceBuy = ethers.utils.formatEther(balanceBNBuy);
  console.log(`The ${signer.address} account has ${balanceBuy} ETH\n`);

  const random = await contract.getRandomNumber();
  console.log("The Random number is: ", random);

  //Flip the coin
  // async function bet(index: string, amount: string) {

  const allowTx = await token
    .connect(signer)
    .approve(
      contract.address,
      ethers.utils.parseEther(AUTORIZED_AMOUNT.toString())
    );
  const allowTxReceipt = await allowTx.wait();
  console.log("Allowance confirmed at block", allowTxReceipt.blockNumber, "\n");

  //Return the pool size before the play
  const prizePoolBefore = await contract.prizePool();
  console.log(
    "The Prize pool contains: ",
    ethers.utils.formatEther(prizePoolBefore),
    "T7E"
  );

  const flipTx = await contract
    .connect(signer)
    .flipCoin();
  const flipTxReceipt = await flipTx.wait();
  console.log(
    "The Flip was confermed at block number",
    flipTxReceipt.blockNumber,
    "\n"
  );

  //Return the pool size after the play
  const prizePoolAfter = await contract.prizePool();
  console.log(
    "After the Flip the Prize pool contains: ",
    ethers.utils.formatEther(prizePoolAfter),
    "T7E"
  );

  //Return the T7E balance of the signer
  const tokenBalanceBNAfter = await token.balanceOf(signer.address);
  const tokenBalanceAfter = ethers.utils.formatEther(tokenBalanceBNAfter);
  console.log(
    `After the Flip the ${signer.address} account now has ${tokenBalanceAfter} T7E\n`
  );

  //Return the ETH balance of the signer
  const balanceBNAfter = await ethers.provider.getBalance(signer.address);
  const balanceAfter = ethers.utils.formatEther(balanceBNAfter);
  console.log(
    `After the Flip the ${signer.address} account has ${balanceAfter} ETH\n`
  );

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

  // async function withdrawTokens(amount: string) {
  //   const tx = await contract.ownerWithdraw(ethers.utils.parseEther(amount));
  //   const receipt = await tx.wait();
  //   console.log(`Withdraw confirmed (${receipt.transactionHash})\n`);
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
