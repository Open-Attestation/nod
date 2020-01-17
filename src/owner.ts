/* eslint-disable class-methods-use-this */
/* disabled for this because there's no need to reference .this */

import {ethers} from "ethers";
import {EthereumAddress, EthereumTransactionHash} from "./types";
import {getWeb3Provider, getWallet} from "./provider";
import {getLogger} from "./util/logger";
import {abi as TitleEscrowABI} from "../build/contracts/TitleEscrow.json";

const {error} = getLogger("owner");

const NUMBER_OF_CONFIRMATIONS = 1; // number of confirmations we should wait before declaring a transaction succeeded

export const isAddressTitleEscrow = async ({
  address,
  web3Provider = getWeb3Provider()
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

  abstract async isTitleEscrow(): Promise<boolean>;
}

export class EthereumAccountOwner extends Owner {
  async isTitleEscrow() {
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
    web3Provider = getWeb3Provider()
  }: {
    address: EthereumAddress;
    web3Provider?: ethers.providers.BaseProvider;
  }) {
    super({address});
    this.web3Provider = web3Provider;
    this.contractInstance = new ethers.Contract(address, JSON.stringify(TitleEscrowABI), web3Provider);
  }

  async isTitleEscrow(): Promise<boolean> {
    return true;
  }

  public async beneficiary(): Promise<EthereumAddress> {
    return this.contractInstance.beneficiary();
  }

  public async holder(): Promise<EthereumAddress> {
    return this.contractInstance.holder();
  }
}

export class WriteableTitleEscrowOwner extends TitleEscrowOwner {
  wallet: ethers.Wallet;

  constructor({
    address,
    wallet = getWallet(),
    web3Provider = getWeb3Provider()
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

  async changeHolder(newHolder: EthereumAddress): Promise<EthereumTransactionHash> {
    const transaction = await this.contractInstance.changeHolder(newHolder);
    await transaction.wait(NUMBER_OF_CONFIRMATIONS);
    return transaction.hash;
  }

  async endorseTransfer(newBeneficiary: EthereumAddress): Promise<EthereumTransactionHash> {
    const transaction = await this.contractInstance.endorseTransfer(newBeneficiary);
    await transaction.wait(NUMBER_OF_CONFIRMATIONS);
    return transaction.hash;
  }

  async transferTo(newBeneficiary: EthereumAddress): Promise<EthereumTransactionHash> {
    const transaction = await this.contractInstance.transferTo(newBeneficiary);
    await transaction.wait(NUMBER_OF_CONFIRMATIONS);
    return transaction.hash;
  }
}

export const createOwner = async ({
  address,
  web3Provider = getWeb3Provider(),
  wallet = getWallet()
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
