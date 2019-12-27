import * as ethers from "ethers";
import { getProvider } from "../../util/provider";
import { abi as tokenRegistryAbi } from "../../../build/contracts/ERC721MintableFull.json";

interface TokenRegistryContract {
  contractAddress: string;
  signer?: string;
}
export const tokenRegistryContract = ({ contractAddress, signer }: TokenRegistryContract) => {
  return new ethers.Contract(contractAddress, tokenRegistryAbi, signer || getProvider());
};
