import {getDefaultProvider, Wallet, providers} from "ethers";
import {EthereumNetwork} from "./types";

let savedWeb3Provider = getDefaultProvider(EthereumNetwork.Default);
let savedWallet: Wallet | undefined;

export const setWeb3Provider = (provider: providers.BaseProvider) => {
  savedWeb3Provider = provider;
};

export const getWeb3Provider = (): providers.BaseProvider => savedWeb3Provider;

export const setWallet = (wallet: Wallet) => {
  savedWallet = wallet;
};

export const getWallet = (): Wallet => {
  if (savedWallet) {
    return savedWallet;
  }
  throw new Error("Wallet has not been set");
};
