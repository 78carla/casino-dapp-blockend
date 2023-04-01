//This script deploy an ERC20 token contract to the sepolia network
import { ethers } from "hardhat";
import {  Staking__factory, CasinoToken__factory, Casino__factory } from "../typechain-types";
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


  const stakingFactory = new Staking__factory(signer);
  const contract = stakingFactory.attach("0x03b2EA9031AfAC3E879887D632542165F22954BE");
  
  const tokenAddress = await contract.stakingToken();
  const tokenFactory = new CasinoToken__factory(signer);
  const token = tokenFactory.attach(tokenAddress);

    //Check the T7E balance of the signer
  //async function displayTokenBalance(index: string) {
    const tokenBalanceBN = await token.balanceOf(signer.address);
    const tokenBalance = ethers.utils.formatEther(tokenBalanceBN);
    console.log(`The ${signer.address} account has ${tokenBalance} T7E\n`);

    //stake some tokens

    contract.connect(wallet).stake(12);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
