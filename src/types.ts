export enum EthereumNetwork {
  Homestead = "homestead",
  Default = "ropsten", // Ropsten is the default for now as we currently only operate on ropsten
  Main = "homestead",
  Ropsten = "ropsten",
}

export type EthereumAddress = string;
export type EthereumTransactionHash = string | undefined;
