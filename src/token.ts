import {WrappedDocument} from "@govtechsg/open-attestation";
import {getDefaultProvider, providers, Wallet} from "ethers";
import {getIssuer} from "./util/token";
import {TokenRegistry} from "./registry";
import {EthereumAddress, EthereumNetwork, EthereumTransactionHash} from "./types";
import {getWeb3Provider, getWallet} from "./provider";
import {createOwner, Owner, TitleEscrowOwner, WriteableTitleEscrowOwner} from "./owner";

/**
 * Class Token to read info from ERC721 contract.
 */
export class ReadOnlyToken {
  document: WrappedDocument;

  web3Provider: providers.BaseProvider;

  tokenRegistry: TokenRegistry;

  constructor({
    document,
    web3Provider = getWeb3Provider(),
    network = EthereumNetwork.Ropsten // Default to Ropsten since we currently only operate on Ropsten
  }: {
    document: WrappedDocument;
    web3Provider?: providers.BaseProvider;
    network?: EthereumNetwork;
  }) {
    this.document = document;
    this.web3Provider = web3Provider || getDefaultProvider(network);
    this.tokenRegistry = new TokenRegistry({
      contractAddress: getIssuer(document).tokenRegistry,
      web3Provider: this.web3Provider
    });
  }

  public async getOwner(): Promise<Owner | TitleEscrowOwner> {
    const ownerAddress = await this.tokenRegistry.ownerOf(this.document);
    return createOwner({address: ownerAddress, web3Provider: this.web3Provider});
  }
}

export class WriteableToken extends ReadOnlyToken {
  wallet: Wallet;

  constructor({
    document,
    web3Provider = getWeb3Provider(),
    wallet = getWallet(),
    network = EthereumNetwork.Ropsten // Default to Ropsten since we currently only operate on Ropsten
  }: {
    document: WrappedDocument;
    web3Provider?: providers.BaseProvider;
    wallet: Wallet | undefined;
    network?: EthereumNetwork;
  }) {
    super({document, web3Provider, network});

    if (!wallet) {
      throw new Error("WriteableToken requires a wallet to be supplied at initialisation");
    }
    this.wallet = wallet;
    this.tokenRegistry = new TokenRegistry({
      contractAddress: getIssuer(this.document).tokenRegistry,
      web3Provider: this.web3Provider,
      wallet
    });
  }

  public async getOwner(): Promise<Owner | WriteableTitleEscrowOwner> {
    const ownerAddress = await this.tokenRegistry.ownerOf(this.document);
    return createOwner({address: ownerAddress, web3Provider: this.web3Provider, wallet: this.wallet});
  }

  async transferOwnership(to: EthereumAddress) {
    return this.tokenRegistry.transferTo(this.document, to);
  }

  async surrender(): Promise<EthereumTransactionHash> {
    const tokenOwner = await this.getOwner();
    if (tokenOwner instanceof WriteableTitleEscrowOwner) {
      return tokenOwner.transferTo(this.tokenRegistry.address);
    }
    return this.tokenRegistry.transferTo(this.document, this.tokenRegistry.address);
  }
}
