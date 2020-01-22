import {ContractTransaction} from "ethers";
import {NUMBER_OF_CONFIRMATIONS} from "./constants";

export const waitForTransaction = async (transaction: Promise<ContractTransaction>) => {
  const tx = await transaction;
  await tx.wait(NUMBER_OF_CONFIRMATIONS);
  return tx.hash;
};
