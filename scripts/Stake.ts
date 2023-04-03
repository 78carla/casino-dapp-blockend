//This script deploy an ERC20 token contract to the sepolia network
import { ethers } from "hardhat";
import {  Stake__factory, CasinoToken__factory, Casino__factory } from "../typechain-types";
import * as dotenv from "dotenv";

dotenv.config();

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
  const contract = casinoFactory.attach("0x2b4a05ce864d4Db391cd00bdFfD02c2138BD3D3b");
  
  const tokenAddress = await contract.token();
  const tokenFactory = new CasinoToken__factory(signer);
  const token = tokenFactory.attach(tokenAddress);

    //Check the T7E balance of the signer
  //async function displayTokenBalance(index: string) {
    const tokenBalanceBN = await token.balanceOf(signer.address);
    const tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

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
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
