import {ethers} from "ethers";
import {EthereumNetwork} from "./types";

let savedWeb3Provider = ethers.getDefaultProvider(EthereumNetwork.Default);
let savedWallet: ethers.Wallet | undefined;

export const setWeb3Provider = (provider: ethers.providers.BaseProvider) => {
  savedWeb3Provider = provider;
};

export const getWeb3Provider = (): ethers.providers.BaseProvider => savedWeb3Provider;

export const setWallet = (wallet: ethers.Wallet) => {
  savedWallet = wallet;
};

export const getWallet = (): ethers.Wallet => {
  if (savedWallet) {
    return savedWallet;
  }
  throw new Error("Wallet has not been set");
};
