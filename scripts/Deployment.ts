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

const MINT_AMOUT = 1000;
const PLAY_PRICE = 0.001;
const PRIZE_POOL = 100;
const TOKEN_RATIO = 10000;

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

  //Deploy the token contract
  console.log("Deploying Token contract:");
  const myERC20ContractFactory = new CasinoToken__factory(signer);
  const myERC20Contract = await myERC20ContractFactory.deploy();
  await myERC20Contract.deployed();

  const deployTxReceipt = await myERC20Contract.deployTransaction.wait();
  console.log(
    `The token contract "MyERC20" is deployed to: ${myERC20Contract.address}, at block, ${deployTxReceipt.blockNumber}`
  );

  //This part can be removed and adapted with the project requirements.
  // Get the contract name, symbol and total supply
  const constractName = await myERC20Contract.name();
  const constractSymbol = await myERC20Contract.symbol();
  const totalSypply = await myERC20Contract.totalSupply();

  console.log("The contract name is:", constractName);
  console.log("The contract symbol is:", constractSymbol);
  console.log("The initial Total Supply:", totalSypply.toString());

  //Mint 1000 tokens to the deployer
  const mintTx = await myERC20Contract.mint(signer.address, MINT_AMOUT);
  await mintTx.wait();
  const totalSupply = await myERC20Contract.totalSupply();
  console.log("The new Total Supply is:", totalSupply.toString());

  console.log("Deploying Casino contract:");
  //const contractFactory = new Lottery__factory(accounts[0]);
  const contractFactory = new Casino__factory(signer);
  console.log("Deploying contract ...");

  contract = await contractFactory.deploy(
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
