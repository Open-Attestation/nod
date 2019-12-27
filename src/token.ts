import { Document } from "@govtechsg/open-attestation";
import { getIssuer } from "./util/token";
import { TokenRegistry } from "./registry";

interface TokenInterface {
  document: Document;
  web3Provider: any;
  getOwner(): Promise<string>;
  // transferOwnership(to: string): Promise<TransferOwnership>;
}

/**
 * Class Token to interact with ERC721 contract.
 */
export class Token implements TokenInterface {
  document: Document;

  web3Provider: any;

  tokenRegistry: TokenRegistry;

  constructor(document: Document, web3Provider?: any) {
    this.document = document;
    this.web3Provider = web3Provider;
    this.tokenRegistry = new TokenRegistry({ contractAddress: getIssuer(document).tokenRegistry, web3Provider });
  }

  public getSigner(): Promise<string> {
    return this.web3Provider.getSigner(0);
  }

  public async getOwner(): Promise<string> {
    return this.tokenRegistry.ownerOf(this.document);
  }

  // public async transferOwnership(to: string): Promise<TransferOwnership> {
  //   const from: string = await this.getOwner();
  //   const signer = await this.getSigner();
  //   const tokenId = `0x${get(this.document, "signature.targetHash")}`;
  //   trace(`transfer token ${tokenId} from ${from} to ${to}`);
  //   trace(`admin address: ${signer}`);
  //   return transferTokenOwnership(from, to, tokenId, this.getIssuer(), signer);
  // }
}
