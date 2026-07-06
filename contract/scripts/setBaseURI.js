const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const baseURI = process.env.METADATA_BASE_URI;

  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS in .env");
  }
  if (!baseURI) {
    throw new Error("Set METADATA_BASE_URI in .env (e.g. ipfs://QmXxx/)");
  }

  const nft = await hre.ethers.getContractAt("WorkshopNFT", contractAddress);
  const tx = await nft.setBaseURI(baseURI);
  await tx.wait();

  console.log("Base URI set to:", baseURI);
  console.log("Token 1 URI will be:", `${baseURI}1.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
