import { ethers } from "hardhat";
import {
  Casino,
  CasinoToken,
  CasinoToken__factory,
  Casino__factory,
} from "../typechain-types";

import * as dotenv from "dotenv";
dotenv.config();

let contract: Casino;
let token: CasinoToken;
//let accounts: SignerWithAddress[];

let signer;

const PLAY_PRICE = 0.001;
const PRIZE_POOL = 100;
const TOKEN_RATIO = 10000;
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
  console.log("Deploying contract ...");

  contract = await contractFactory.deploy(
    "Team7Early",
    "T7E",
    TOKEN_RATIO,
    ethers.utils.parseEther(PLAY_PRICE.toFixed(18)),
    ethers.utils.parseEther(PRIZE_POOL.toFixed(18))
  );

  const tokenAddress = await contract.paymentToken();
  const tokenFactory = new CasinoToken__factory(signer);
  token = tokenFactory.attach(tokenAddress);

  const deployTransactionReceipt = await contract.deployTransaction.wait();
  console.log(
    "The Casino contract address is:",
    contract.address,
    "and was deployed by",
    signer.address,
    "at block number",
    deployTransactionReceipt.blockNumber,
    "\n"
  );
  console.log(
    "The Token contract address is:",
    token.address,
    "by",
    signer.address,
    "\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
