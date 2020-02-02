import {ethers} from "ethers";
import {EthereumAddress} from "./types";
import {getWallet} from "./provider";
import {abi as TitleEscrowABI, bytecode as TitleEscrowBytecode} from "../build/contracts/TitleEscrow.json";

export class TitleEscrow {
  wallet: ethers.Wallet;

  constructor({wallet = getWallet()}: {wallet: ethers.Wallet | undefined}) {
    if (!wallet) {
      throw new Error("TitleEscrow requires a wallet to be supplied at initialization");
    }
    this.wallet = wallet;
  }

  async deployEscrowContract(
    registryAddress: EthereumAddress,
    beneficiaryAddress: EthereumAddress,
    holderAddress: EthereumAddress
  ) {
    if (!registryAddress) throw new Error("Please provide the registry address");
    if (!beneficiaryAddress || !holderAddress)
      throw new Error("Escrow contract requires beneficiary and holder address");

    const factory = new ethers.ContractFactory(JSON.stringify(TitleEscrowABI), TitleEscrowBytecode, this.wallet);
    const contract = await factory.deploy(registryAddress, beneficiaryAddress, holderAddress);
    await contract.deployed();

    return {address: contract.address, hash: contract.deployTransaction.hash};
  }
}
