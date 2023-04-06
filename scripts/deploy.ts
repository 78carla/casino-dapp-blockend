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

const BUY_AMOUNT = 100;
const STAKE_AMOUNT = 10;

const PLAY_PRICE = 1;
const TOKEN_RATIO = 10000;
const PAYOUT_RATIO = 95;

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

    //Buy some T7E tokens
    // async function buyTokens(index: string, amount: string) {
      const txBuy = await contract.connect(signer).purchaseTokens({
        value: ethers.utils.parseEther(BUY_AMOUNT.toString()).div(TOKEN_RATIO),
      });
      const receiptBuy = await txBuy.wait();
      console.log(
        `Tokens bought at ${receiptBuy.transactionHash} transaction hash\n`
      );

  //The signer allows the Casino contract to spend the T7E tokens
  const allowTx = await token
    .connect(signer)
    .approve(contract.address, ethers.constants.MaxUint256);
  const allowTxReceipt = await allowTx.wait();
  console.log("Allowance confirmed at block", allowTxReceipt.blockNumber, "\n");


    //stake some tokens
    console.log("staking tokens");
    const stakingTx = await contract.stake(ethers.utils.parseEther(STAKE_AMOUNT.toString()));
    await stakingTx.wait();
    const tokenBalanceBN = await contract.totalSupply();
    const tokenBalance = ethers.utils.formatEther(tokenBalanceBN);

    console.log(`The casino contract with address ${contract.address} has ${tokenBalance} T7E\n`);

  console.log(
    `Verify the Token contract with this command: \n
    npx hardhat verify --network sepolia ${token.address} 
    `
  );

  console.log(
    `Verify the NFT contract with this command: \n
    npx hardhat verify --network sepolia ${nft.address} 
    `
  );
  console.log(
    `Verify the Casino contract with this command: \n
    npx hardhat verify --network sepolia ${
      contract.address
    } "${TOKEN_RATIO}" "${ethers.utils.parseEther(
      PLAY_PRICE.toFixed(18)
    )}" "${PAYOUT_RATIO}"
    `
  );

  

  //Play the game and flip the coin
  const flipTx3 = await contract.connect(signer).flipCoinWinning();
  console.log("FLIP WAIT ");
  const flipTxReceipt3 = await flipTx3.wait();
  console.log(
    "The Flip was confermed at block number",
    flipTxReceipt3.blockNumber,
    "\n"
  );

  //unstake some tokens
  console.log("unstaking tokens");
  // const unstakingTx = await contract.unstake(ethers.utils.parseEther(STAKE_AMOUNT.toString()));
  const unstakingTx = await contract.unstakeAll();
  await unstakingTx.wait();


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});