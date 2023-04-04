import { ethers } from "hardhat";
import { VRFv2Consumer, VRFv2Consumer__factory } from "../typechain-types";

import * as dotenv from "dotenv";
import { cleanData } from "jquery";
dotenv.config();

//let contract: VRFv2Consumer;
let signer;

const LINKADDRESS = "0x779877a7b0d9e8603169ddbd7836e478b4624789";
const WRAPPERADDRESS = "0xab18414cd93297b0d12ac29e63ca20f515b3db46";

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

  console.log("Deploying VRFv2DirectFundingConsumer contract:");

  const VRFv2ConsumerFactory = new VRFv2Consumer__factory(signer);

  console.log("Deploying contract ...");

  const subscriptionKey = process.env.CHAINLINK_SUBSCRIPTION_KEY;
  const contract = await VRFv2ConsumerFactory.deploy(subscriptionKey);

  await contract.deployed();
  const deployTransactionReceipt = await contract.deployTransaction.wait();

  console.log(
    "The VRFv2 contract address is:",
    contract.address,
    "was deployed by",
    signer.address,
    "at block",
    deployTransactionReceipt.blockNumber,
    "\n"
  );

  console.log(
    "Verify the VRFv2 contract with this command:",
    "\n",
    "npx hardhat verify --network sepolia",
    contract.address,
    "<subscription key>"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
