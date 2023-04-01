//This script deploy an ERC20 token contract to the sepolia network
import { ethers } from "hardhat";
import {  Staking__factory } from "../typechain-types";
import * as dotenv from "dotenv";

dotenv.config();

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
  const signer = wallet.connect(provider);

  //const signer = (await ethers.getSigners())[0];

  //Deploy the smart contract
  console.log("Deploying Token contract:");
  const myStakingContractFactory = new Staking__factory(signer);
  const contract = await myStakingContractFactory.deploy("0x787395e31EcA63A2828B17f5454275122537ea46");
  await contract.deployed();

  const deployTxReceipt = await contract.deployTransaction.wait();
  console.log(
    `The token contract "MyERC20" is deployed to: ${contract.address}, at block, ${deployTxReceipt.blockNumber}`
  );

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
