import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "SecretNFT";

async function resolveDeployment(taskArguments: TaskArguments, hre: any) {
  const { deployments } = hre;
  if (taskArguments.address) {
    return { address: taskArguments.address };
  }
  return deployments.get(CONTRACT_NAME);
}

task("task:address", "Prints the SecretNFT address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const deployment = await resolveDeployment(_taskArguments, hre);
  console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
});

task("task:get-token", "Reads encrypted note and controller for a token")
  .addParam("tokenId", "Token id to inspect")
  .addOptionalParam("address", "Optionally specify the SecretNFT contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = await resolveDeployment(taskArguments, hre);
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const data = await contract.getEncryptedData(taskArguments.tokenId);

    console.log(`Encrypted note: ${data[0]}`);
    const signers = await ethers.getSigners();
    const decrypted = await fhevm.userDecryptEaddress(data[1], deployment.address, signers[0]);
    console.log(`Decrypted controller (signer[0]): ${decrypted}`);
  });

task("task:mint", "Mints a new secret NFT")
  .addParam("to", "Receiver of the NFT")
  .addParam("note", "Encrypted note string")
  .addParam("controller", "Address used for encryption")
  .addOptionalParam("address", "Optionally specify the SecretNFT contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = await resolveDeployment(taskArguments, hre);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const encrypted = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .addAddress(taskArguments.controller)
      .encrypt();

    const tokenId = await contract
      .connect(signer)
      .mint.staticCall(taskArguments.to, taskArguments.note, encrypted.handles[0], encrypted.inputProof);

    const tx = await contract
      .connect(signer)
      .mint(taskArguments.to, taskArguments.note, encrypted.handles[0], encrypted.inputProof);
    console.log(`Wait for tx ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx status=${receipt?.status}`);
    console.log(`Minted token id: ${tokenId}`);
  });

task("task:update-note", "Updates encrypted note for a token")
  .addParam("tokenId", "Token id to update")
  .addParam("note", "New encrypted note string")
  .addOptionalParam("address", "Optionally specify the SecretNFT contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const deployment = await resolveDeployment(taskArguments, hre);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const tx = await contract.connect(signer).updateEncryptedNote(taskArguments.tokenId, taskArguments.note);
    console.log(`Wait for tx ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx status=${receipt?.status}`);
  });

task("task:update-controller", "Updates encrypted controller for a token")
  .addParam("tokenId", "Token id to update")
  .addParam("controller", "New controller address to encrypt")
  .addOptionalParam("address", "Optionally specify the SecretNFT contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = await resolveDeployment(taskArguments, hre);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const encrypted = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .addAddress(taskArguments.controller)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .updateEncryptedController(taskArguments.tokenId, encrypted.handles[0], encrypted.inputProof);
    console.log(`Wait for tx ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx status=${receipt?.status}`);
  });
