//This script deploy an ERC20 token contract to the sepolia network
import { ethers } from "hardhat";
import { CasinoToken__factory } from "../typechain-types";
import * as dotenv from "dotenv";

dotenv.config();

const MINT_AMOUT = 0;

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
  const myERC20ContractFactory = new CasinoToken__factory(signer);
  const myERC20Contract = await myERC20ContractFactory.deploy(
    "Team7Early",
    "T7E"
  );

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
  //console.log("The initial Total Supply:", totalSypply.toString());

  //Mint 1000 tokens to the deployer
  // const mintTx = await myERC20Contract.mint(signer.address, MINT_AMOUT);
  // await mintTx.wait();
  // const totalSupply = await myERC20Contract.totalSupply();
  // console.log("The new Total Supply is:", totalSupply.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
