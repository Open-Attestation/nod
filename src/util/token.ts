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
