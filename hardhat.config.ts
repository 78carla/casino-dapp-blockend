import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://sepolia.infura.io/v3/" + process.env.INFURA_API_KEY_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_API_KEY_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    maticmum: {
      url: "https://polygon-mumbai.infura.io/v3/" + process.env.INFURA_API_KEY_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  //solidity: "0.8.17",
  solidity: {
    compilers: [
      {
        version: "0.8.18",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000,
      },
    },
  },
  paths: { tests: "tests" },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY as string,
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY as string,
  // },
};

export default config;
