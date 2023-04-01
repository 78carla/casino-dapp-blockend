# Solidity Encode Bootcamp (Early) Final Project - Team 7

For running this project:

Clone this repo

Create your .env file
PRIVATE_KEY=""
INFURA_API_KEY_SEPOLIA=""
ETHERSCAN_API_KEY=""

Run:
yarn install
yarn hardhat

Add some dependancies:
yarn add mocha --dev
yarn add dotenv --dev
yarn add --dev @openzeppelin/contracts
yarn add ethers@^5.7.2
npm install --save -dev@nomiclabs/hardhat-etherscan //for verifing the contracts on the blockchain

//For deploying the contract using sepolia network
yarn hardhat run ./scripts/DeploymentERC20.ts --network sepolia

//For verifying your contract on sepolia
npx hardhat verify --network sepolia addTheSmartContractAddress "argument 1" 
