import { get } from "lodash";
import { Document, getData } from "@govtechsg/open-attestation";

import { Issuer, TransferOwnership } from "../types";
import { tokenRegistryContract } from "../common/smartContract/tokenRegistryContract";

const getTokenRegistryContractInstance = (issuer: Issuer, signer?: string) => {
  return tokenRegistryContract({ contractAddress: issuer.tokenRegistry, signer });
};

export const getOwnerOf = async (tokenId: string, issuer: Issuer): Promise<string> => {
  const tokenRegistryContractInstance = getTokenRegistryContractInstance(issuer);
  return tokenRegistryContractInstance.ownerOf(tokenId);
};

export const transferTokenOwnership = async (
  from: string,
  to: string,
  tokenId: string,
  issuer: Issuer,
  signer: string
): Promise<TransferOwnership> => {
  const tokenRegistryContractInstancesWithSigner = getTokenRegistryContractInstance(issuer, signer);
  const tx = await tokenRegistryContractInstancesWithSigner.transferFrom(from, to, tokenId);
  return { txHash: tx.hash, token: tokenId, owner: to };
};

export const getBatchMerkleRoot = (document: Document) => {
  return `0x${get(document, "signature.merkleRoot")}`;
};

export const getIssuer = (document: Document): Issuer => {
  const data = getData(document);
  if (!(data.issuers.length === 1)) throw new Error("Token must have exactly one token registry contract");
  if (!data.issuers[0].tokenRegistry) throw new Error("Token must have token registry in it");
  return data.issuers[0];
}