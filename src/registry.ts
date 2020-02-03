import {WrappedDocument} from "@govtechsg/open-attestation";
import {Contract, getDefaultProvider, providers, Wallet} from "ethers";
import {getBatchMerkleRoot} from "./util/token";
import {abi as TokenRegistryABI} from "../build/contracts/TradeTrustERC721.json";
import {EthereumAddress, EthereumNetwork, EthereumTransactionHash} from "./types";
import {waitForTransaction} from "./util/transaction";
import {getWeb3Provider} from "./provider";

export class TokenRegistry {
  web3Provider: providers.BaseProvider;

  address: string;

  contractInstance: Contract;

  /**
   * Creates a TokenRegistry instance with the specified address and ethersjs signer
   * @param instanceParameters
   * @param instanceParameters.contractAddress - Address that the TokenRegistry is located at
   * @param instanceParameters.web3Provider - An ethers.js signer instance with read/write access
   * @param instanceParameters.network - Ethereum network name
   */
  constructor({
    contractAddress,
    web3Provider = getWeb3Provider(),
    wallet,
    network = EthereumNetwork.Ropsten // Default to Ropsten since we currently only operate on Ropsten
  }: {
    contractAddress: EthereumAddress;
    web3Provider?: providers.BaseProvider;
    wallet?: Wallet;
    network?: EthereumNetwork;
  }) {
    this.web3Provider = web3Provider || getDefaultProvider(network);
    this.address = contractAddress;
    // doing JSON.stringify below because of ethers.js type issue: https://github.com/ethers-io/ethers.js/issues/602
    this.contractInstance = new Contract(contractAddress, JSON.stringify(TokenRegistryABI), web3Provider);
    if (wallet) {
      this.contractInstance = this.contractInstance.connect(wallet);
    }
  }

  async mint(document: WrappedDocument, ownerAddress: EthereumAddress) {
    const tokenId = getBatchMerkleRoot(document);
    return waitForTransaction(this.contractInstance["safeMint(address,uint256)"](ownerAddress, tokenId));
  }

  async ownerOf(document: WrappedDocument) {
    const tokenId = getBatchMerkleRoot(document);
    return this.contractInstance.ownerOf(tokenId);
  }

  async transferTo(document: WrappedDocument, newOwnerAddress: EthereumAddress): Promise<EthereumTransactionHash> {
    const tokenId = getBatchMerkleRoot(document);
    const currentOwner = await this.ownerOf(document);
    return waitForTransaction(
      this.contractInstance["safeTransferFrom(address,address,uint256)"](currentOwner, newOwnerAddress, tokenId)
    );
  }
}
