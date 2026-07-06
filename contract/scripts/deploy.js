const hre = require("hardhat");

async function main() {
  const NAME = "Workshop NFT";
  const SYMBOL = "WNFT";
  const MAX_SUPPLY = 100;
  const MINT_PRICE = 0; // 0 ETH — miễn phí cho workshop testnet

  const WorkshopNFT = await hre.ethers.getContractFactory("WorkshopNFT");
  const nft = await WorkshopNFT.deploy(NAME, SYMBOL, MAX_SUPPLY, MINT_PRICE);

  await nft.waitForDeployment();
  const address = await nft.getAddress();

  console.log("Deploying WorkshopNFT...");
  console.log("WorkshopNFT deployed to:", address);
  console.log("");
  console.log("Verify command:");
  console.log(
    `npx hardhat verify --network sepolia ${address} "${NAME}" "${SYMBOL}" ${MAX_SUPPLY} ${MINT_PRICE}`
  );
  console.log("");
  console.log("Next steps:");
  console.log("1. Upload metadata to IPFS");
  console.log("2. Set METADATA_BASE_URI in .env");
  console.log("3. Run: npm run set-uri:sepolia");
  console.log("4. Copy contract address to dapp/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
