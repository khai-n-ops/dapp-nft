const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkshopNFT", function () {
  let nft;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const WorkshopNFT = await ethers.getContractFactory("WorkshopNFT");
    nft = await WorkshopNFT.deploy("Workshop NFT", "WNFT", 10, 0);
    await nft.waitForDeployment();
    await nft.setBaseURI("ipfs://QmTest/");
  });

  it("should mint NFT with token ID starting at 1", async function () {
    await nft.connect(user).mint({ value: 0 });
    expect(await nft.ownerOf(1)).to.equal(user.address);
    expect(await nft.totalSupply()).to.equal(1);
  });

  it("should return correct tokenURI", async function () {
    await nft.connect(user).mint({ value: 0 });
    expect(await nft.tokenURI(1)).to.equal("ipfs://QmTest/1.json");
  });

  it("should reject mint when max supply reached", async function () {
    for (let i = 0; i < 10; i++) {
      await nft.connect(user).mint({ value: 0 });
    }
    await expect(nft.connect(user).mint({ value: 0 })).to.be.revertedWith("Max supply reached");
  });
});
