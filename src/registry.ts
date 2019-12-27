import { Document } from "@govtechsg/open-attestation";
import { BaseProvider } from "ethers/providers";
import ethers from "ethers";
import { getBatchMerkleRoot } from "./util/token";
import { abi as TokenRegistryABI } from "../build/contracts/ERC721MintableFull.json";

export class TokenRegistry {
  web3Provider: BaseProvider;

  address: string;

  contractInstance: any;

  constructor({ contractAddress, web3Provider }: { contractAddress: string; web3Provider: BaseProvider }) {
    this.web3Provider = web3Provider;
    this.address = contractAddress;
    // doing JSON.stringify below because of ethers.js type issue: https://github.com/ethers-io/ethers.js/issues/602
    this.contractInstance = new ethers.Contract(contractAddress, JSON.stringify(TokenRegistryABI), web3Provider);
  }

  async mint(document: Document) {
    const tokenId = getBatchMerkleRoot(document);
    return this.contractInstance.safeMint(tokenId);
  }

  async ownerOf(document: Document) {
    const tokenId = getBatchMerkleRoot(document);
    return this.contractInstance.ownerOf(tokenId);
  }

  async transferTo(document: Document, newOwner: string) {
    const tokenId = getBatchMerkleRoot(document);
    const currentOwner = await this.ownerOf(document);
    return this.contractInstance.safeTransferFrom(currentOwner, newOwner, tokenId);
  }
}
