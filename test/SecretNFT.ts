import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { SecretNFT, SecretNFT__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SecretNFT")) as SecretNFT__factory;
  const contract = (await factory.deploy()) as SecretNFT;

  return { contract, contractAddress: await contract.getAddress() };
}

describe("SecretNFT", function () {
  let signers: Signers;
  let contract: SecretNFT;
  let contractAddress: string;

  before(async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    signers = { deployer, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  async function encryptAddress(inputSigner: string, payload: string) {
    return fhevm.createEncryptedInput(contractAddress, inputSigner).addAddress(payload).encrypt();
  }

  it("mints token and stores encrypted payload", async function () {
    const cipher = await encryptAddress(signers.alice.address, signers.alice.address);

    const tokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "ciphertext-note", cipher.handles[0], cipher.inputProof);

    const tx = await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "ciphertext-note", cipher.handles[0], cipher.inputProof);
    await tx.wait();

    const data = await contract.getEncryptedData(tokenId);
    expect(data[0]).to.equal("ciphertext-note");

    const clearAddress = await fhevm.userDecryptEaddress(data[1], contractAddress, signers.alice);
    expect(ethers.getAddress(clearAddress)).to.equal(signers.alice.address);
  });

  it("only owner can update encrypted note", async function () {
    const cipher = await encryptAddress(signers.alice.address, signers.alice.address);
    const tokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "initial", cipher.handles[0], cipher.inputProof);
    await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "initial", cipher.handles[0], cipher.inputProof);

    await expect(contract.connect(signers.bob).updateEncryptedNote(tokenId, "modified")).to.be.revertedWith(
      "Not token owner",
    );

    await contract.connect(signers.alice).updateEncryptedNote(tokenId, "modified");
    const data = await contract.getEncryptedData(tokenId);
    expect(data[0]).to.equal("modified");
  });

  it("updates encrypted controller and grants ACL to owner", async function () {
    const initialCipher = await encryptAddress(signers.alice.address, signers.alice.address);
    const tokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "note", initialCipher.handles[0], initialCipher.inputProof);
    await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "note", initialCipher.handles[0], initialCipher.inputProof);

    const newCipher = await encryptAddress(signers.alice.address, signers.bob.address);
    await contract
      .connect(signers.alice)
      .updateEncryptedController(tokenId, newCipher.handles[0], newCipher.inputProof);

    const data = await contract.getEncryptedData(tokenId);
    const clear = await fhevm.userDecryptEaddress(data[1], contractAddress, signers.alice);
    expect(ethers.getAddress(clear)).to.equal(signers.bob.address);
  });

  it("grants ACL to new owner after transfer", async function () {
    const cipher = await encryptAddress(signers.alice.address, signers.alice.address);
    const tokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "note", cipher.handles[0], cipher.inputProof);
    await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "note", cipher.handles[0], cipher.inputProof);

    await contract.connect(signers.alice).transferFrom(signers.alice.address, signers.bob.address, tokenId);

    const data = await contract.getEncryptedData(tokenId);
    const clear = await fhevm.userDecryptEaddress(data[1], contractAddress, signers.bob);
    expect(ethers.getAddress(clear)).to.equal(signers.alice.address);
  });

  it("enumerates tokens for each owner", async function () {
    const firstCipher = await encryptAddress(signers.alice.address, signers.alice.address);
    const firstTokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "first", firstCipher.handles[0], firstCipher.inputProof);
    await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "first", firstCipher.handles[0], firstCipher.inputProof);

    const secondCipher = await encryptAddress(signers.alice.address, signers.alice.address);
    const secondTokenId = await contract
      .connect(signers.alice)
      .mint.staticCall(signers.alice.address, "second", secondCipher.handles[0], secondCipher.inputProof);
    await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "second", secondCipher.handles[0], secondCipher.inputProof);

    const aliceTokens = await contract.tokensOfOwner(signers.alice.address);
    expect(aliceTokens).to.deep.equal([firstTokenId, secondTokenId]);

    await contract.connect(signers.alice).transferFrom(signers.alice.address, signers.bob.address, firstTokenId);

    const updatedAliceTokens = await contract.tokensOfOwner(signers.alice.address);
    expect(updatedAliceTokens).to.deep.equal([secondTokenId]);

    const bobTokens = await contract.tokensOfOwner(signers.bob.address);
    expect(bobTokens).to.deep.equal([firstTokenId]);
  });
});
