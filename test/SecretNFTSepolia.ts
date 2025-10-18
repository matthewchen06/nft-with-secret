import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers, fhevm } from "hardhat";
import { SecretNFT } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("SecretNFTSepolia", function () {
  let signers: Signers;
  let contract: SecretNFT;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("SecretNFT");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("SecretNFT", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const [alice, bob] = await ethers.getSigners();
    signers = { alice, bob };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("mints and transfers secret NFT", async function () {
    steps = 8;
    this.timeout(4 * 40000);

    progress("Encrypting controller address for mint...");
    const mintCipher = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    progress("Simulating mint to determine tokenId...");
    const tokenId = await contract
      .connect(signers.alice)
      .callStatic.mint(signers.alice.address, "network-note", mintCipher.handles[0], mintCipher.inputProof);

    progress("Executing mint transaction...");
    let tx = await contract
      .connect(signers.alice)
      .mint(signers.alice.address, "network-note", mintCipher.handles[0], mintCipher.inputProof);
    await tx.wait();

    progress("Validating encrypted payload decrypts for owner...");
    const mintedData = await contract.getEncryptedData(tokenId);
    const decryptedMintAddress = await fhevm.userDecryptEaddress(mintedData[1], contractAddress, signers.alice);
    expect(ethers.getAddress(decryptedMintAddress)).to.equal(signers.alice.address);

    progress("Encrypting controller address for transfer update...");
    const updateCipher = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .addAddress(signers.bob.address)
      .encrypt();

    progress("Updating encrypted controller to Bob...");
    tx = await contract
      .connect(signers.alice)
      .updateEncryptedController(tokenId, updateCipher.handles[0], updateCipher.inputProof);
    await tx.wait();

    progress("Transferring token to Bob...");
    tx = await contract.connect(signers.alice).transferFrom(signers.alice.address, signers.bob.address, tokenId);
    await tx.wait();

    progress("Ensuring Bob can decrypt controller ciphertext...");
    const finalData = await contract.getEncryptedData(tokenId);
    const decrypted = await fhevm.userDecryptEaddress(finalData[1], contractAddress, signers.bob);
    expect(ethers.getAddress(decrypted)).to.equal(signers.bob.address);
  });
});
