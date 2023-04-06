import { ethers } from "hardhat";
import {
  Casino,
  CasinoToken,
  CasinoPassport,
  Casino__factory,
  CasinoToken__factory,
  CasinoPassport__factory
} from "../typechain-types";

import * as dotenv from "dotenv";
dotenv.config();

let contract: Casino;
let token: CasinoToken;
let nft: CasinoPassport;
//let accounts: SignerWithAddress[];

let signer;

const VERIFY_COMMAND = "\n npx hardhat verify --network "
const NETWORK_NAME = "maticmum"

const PLAY_PRICE = 1;
const TOKEN_RATIO = 10000;
const PAYOUT_RATIO = 95;

async function main() {
  // Connect to the network
  const provider = new ethers.providers.InfuraProvider(
    NETWORK_NAME,
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
    TOKEN_RATIO,
    ethers.utils.parseEther(PLAY_PRICE.toFixed(18)),
    PAYOUT_RATIO
  );

  const tokenAddress = await contract.token();
  const tokenFactory = new CasinoToken__factory(signer);
  token = tokenFactory.attach(tokenAddress);

  const nftAddress = await contract.nft();
  const nftFactory = new CasinoPassport__factory(signer);
  nft = nftFactory.attach(nftAddress);


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
    "and was deployed by",
    signer.address,
    "\n"
  );
  console.log(
    "The NFT contract address is:",
    nft.address,
    "and was deployed by",
    signer.address,
    "\n"
  );

  console.log(
    `Verify the token contract using: ${VERIFY_COMMAND} ${NETWORK_NAME} ${token.address} `
  );

  console.log(
    `Verify the nft  contract using: ${VERIFY_COMMAND} ${NETWORK_NAME} ${nft.address} `
  );
  console.log(
    `Verify the casino contract using: ${VERIFY_COMMAND} ${NETWORK_NAME} "${TOKEN_RATIO}" "${ethers.utils.parseEther(PLAY_PRICE.toFixed(18))}" "${PAYOUT_RATIO}"
    `
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});