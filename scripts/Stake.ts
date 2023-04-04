//This script deploy an ERC20 token contract to the sepolia network
import { ethers } from "hardhat";
import {  Stake__factory, CasinoToken__factory, Casino__factory } from "../typechain-types";
import * as dotenv from "dotenv";

dotenv.config();

const PLAY_PRICE = 0.001;
const PRIZE_POOL = 100;
const TOKEN_RATIO = 10000;
const BUY_AMOUNT = 100;
const AUTORIZED_AMOUNT = 2;

async function main() {
  const args = process.argv;
  const casinoContractAddress = args[2];
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
  const signer = wallet.connect(provider);

  const casinoFactory = new Casino__factory(signer);
  const contract = casinoFactory.attach("0x48e9D1d4a259E42bd9bd0485F4e57FEE44447163");
  
  const tokenAddress = await contract.token();
  const tokenFactory = new CasinoToken__factory(signer);
  const token = tokenFactory.attach(tokenAddress);
  
  let tokenBalanceBN;
  let tokenBalance;

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
    tokenBalanceBN = await token.balanceOf(signer.address);
    tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);
  
    const balanceBNBuy = await ethers.provider.getBalance(signer.address);
    const balanceBuy = ethers.utils.formatEther(balanceBNBuy);
    console.log(`The ${signer.address} account has ${balanceBuy} ETH\n`);
    
    const allowTx = await token
    .connect(signer)
    .approve(
      contract.address,
      ethers.utils.parseEther("10")
    );
  const allowTxReceipt = await allowTx.wait();
  console.log("Allowance confirmed at block", allowTxReceipt.blockNumber, "\n");


    //stake some tokens
    const stakingTx = await contract.stake(ethers.utils.parseEther("10"));
    console.log("stake wait");
    await stakingTx.wait();
    console.log("stake done");
    tokenBalanceBN = await token.balanceOf(signer.address);
    tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

    //stake some tokens
    const unstakeTx = await contract.unstake(ethers.utils.parseEther("20"));
    console.log("stake wait");
    await unstakeTx.wait();
    console.log("stake done");
    tokenBalanceBN = await token.balanceOf(signer.address);
    tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
