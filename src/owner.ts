/* eslint-disable class-methods-use-this */
/* disabled for this because there's no need to reference .this */

import {ethers} from "ethers";
import {EthereumAddress, EthereumTransactionHash} from "./types";
import {getWeb3Provider, getWallet} from "./provider";
import {getLogger} from "./util/logger";
import {abi as TitleEscrowABI, bytecode as TitleEscrowBytecode} from "../build/contracts/TitleEscrow.json";
import {waitForTransaction} from "./util/transaction";

const {error} = getLogger("owner");

export const isAddressTitleEscrow = async ({
  address,
  web3Provider = getWeb3Provider(),
}: {
  address: EthereumAddress;
  web3Provider?: ethers.providers.BaseProvider;
}) => {
  try {
    const MaybeTitleEscrowContract = new ethers.Contract(address, JSON.stringify(TitleEscrowABI), web3Provider);
    return await MaybeTitleEscrowContract.supportsInterface("0xad3fae94");
  } catch (e) {
    error(e);
  }
  return false;
};

export abstract class Owner {
  address: string;

  constructor({address}: {address: EthereumAddress}) {
    this.address = address;
  }

  abstract isTitleEscrow(): boolean;
}

export class EthereumAccountOwner extends Owner {
  isTitleEscrow() {
    return false;
  }
}
export class TitleEscrowOwner extends Owner {
  web3Provider: ethers.providers.BaseProvider;

  contractInstance: ethers.Contract;

  // This constructor does not check if the target address is a TitleEscrow as we cannot await methods in the constructor
  // Use the createOwner method below if you are not sure if the target is a TitleEscrow contract
  constructor({
    address,
    web3Provider = getWeb3Provider(),
  }: {
    address: EthereumAddress;
    web3Provider?: ethers.providers.BaseProvider;
  }) {
    super({address});
    this.web3Provider = web3Provider;
    this.contractInstance = new ethers.Contract(address, JSON.stringify(TitleEscrowABI), web3Provider);
  }

  isTitleEscrow(): boolean {
    return true;
  }

  public async beneficiary(): Promise<EthereumAddress> {
    return this.contractInstance.beneficiary();
  }

  public async holder(): Promise<EthereumAddress> {
    return this.contractInstance.holder();
  }

  public async endorsedTransferTarget(): Promise<EthereumAddress> {
    return this.contractInstance.approvedTransferTarget();
  }
}

export class WriteableTitleEscrowOwner extends TitleEscrowOwner {
  wallet: ethers.Wallet;

  constructor({
    address,
    wallet = getWallet(),
    web3Provider = getWeb3Provider(),
  }: {
    address: EthereumAddress;
    web3Provider: ethers.providers.BaseProvider;
    wallet: ethers.Wallet | undefined;
  }) {
    super({address, web3Provider});
    if (!wallet) {
      throw new Error("WriteableTitleEscrowOwner requires a wallet to be supplied at initialisation");
    }
    this.wallet = wallet;
    this.contractInstance = new ethers.Contract(address, JSON.stringify(TitleEscrowABI), wallet);
  }

  static async deployEscrowContract({
    registryAddress,
    beneficiaryAddress,
    holderAddress,
    wallet = getWallet(),
    web3Provider = getWeb3Provider(),
  }: {
    registryAddress: EthereumAddress;
    beneficiaryAddress: EthereumAddress;
    holderAddress: EthereumAddress;
    wallet: ethers.Wallet | undefined;
    web3Provider: ethers.providers.BaseProvider;
  }) {
    if (!wallet) throw new Error("Deploying contract requires a wallet to be supplied");
    if (!web3Provider) throw new Error("Deploying contract requires the web3 provider");
    if (!registryAddress) throw new Error("Please provide the registry address");
    if (!beneficiaryAddress || !holderAddress)
      throw new Error("Escrow contract requires beneficiary and holder address");

    const factory = new ethers.ContractFactory(JSON.stringify(TitleEscrowABI), TitleEscrowBytecode, wallet);
    const contract = await factory.deploy(registryAddress, beneficiaryAddress, holderAddress);
    await contract.deployed();

    return new TitleEscrowOwner({address: contract.address, web3Provider});
  }

  async changeHolder(newHolder: EthereumAddress): Promise<EthereumTransactionHash> {
    return waitForTransaction(await this.contractInstance.changeHolder(newHolder));
  }

  async endorseTransfer(newBeneficiary: EthereumAddress): Promise<EthereumTransactionHash> {
    return waitForTransaction(this.contractInstance.endorseTransfer(newBeneficiary));
  }

  async transferTo(newBeneficiary: EthereumAddress): Promise<EthereumTransactionHash> {
    return waitForTransaction(this.contractInstance.transferTo(newBeneficiary));
  }
}

export const createOwner = async ({
  address,
  web3Provider = getWeb3Provider(),
  wallet = getWallet(),
}: {
  address: EthereumAddress;
  web3Provider?: ethers.providers.BaseProvider;
  wallet?: ethers.Wallet;
}) => {
  if (await isAddressTitleEscrow({address, web3Provider})) {
    if (wallet) {
      return new WriteableTitleEscrowOwner({address, web3Provider, wallet});
    }
    return new TitleEscrowOwner({address, web3Provider});
  }
  return new EthereumAccountOwner({address});
};
