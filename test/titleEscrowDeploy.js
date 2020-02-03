import {ethers} from "ethers";
import {WriteableTitleEscrowOwner} from "../src/index";
import {setWallet, setWeb3Provider} from "../src/provider";

const {expect} = require("chai").use(require("chai-as-promised"));

const ERC721 = artifacts.require("TradeTrustERC721");
const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

describe("Owner", () => {
  let ERC721Address;
  let ERC721Instance;
  let provider;
  let owner1;
  let owner2;
  let holder1;
  let owner1Address;
  let holder1Address;
  let undefinedAddress;

  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
    provider = new ethers.providers.Web3Provider(web3.currentProvider);
    owner1 = provider.getSigner(1);
    owner2 = provider.getSigner(2);
    holder1 = provider.getSigner(3);
    owner1Address = await owner1.getAddress();
    holder1Address = await holder1.getAddress();
  });

  afterEach("", () => {
    setWeb3Provider(undefined);
    setWallet(undefined);
  });

  describe("Deploy Contract", () => {
    it("should deploy the contract with passed params", async () => {
      const titleEscrowInstance = await WriteableTitleEscrowOwner.deployEscrowContract({
        registryAddress: ERC721Address,
        beneficiaryAddress: owner1Address,
        holderAddress: holder1Address,
        wallet: owner2,
        web3Provider: provider
      });

      expect(await titleEscrowInstance.contractInstance.status()).to.deep.equal(0);
      await ERC721Instance.safeMint(titleEscrowInstance.address, SAMPLE_TOKEN_ID);

      expect(await titleEscrowInstance.holder()).to.deep.equal(holder1Address);
      expect(await titleEscrowInstance.beneficiary()).to.deep.equal(owner1Address);
      expect(await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID)).to.deep.equal(titleEscrowInstance.address);
      expect(await titleEscrowInstance.contractInstance.status()).to.deep.equal(1);
    });

    it("should throw an error if there is no saved wallet and no wallet was provided in constructor", async () => {
      const errorDeployTxn = WriteableTitleEscrowOwner.deployEscrowContract({
        registryAddress: ERC721Address,
        beneficiaryAddress: owner1Address,
        holderAddress: holder1Address
      });
      await expect(errorDeployTxn).to.be.rejectedWith(/Deploying contract requires a wallet to be supplied/);
    });

    it("should throw an error if there is no saved web3 provider and no provider was provided in constructor", async () => {
      const errorDeployTxn = WriteableTitleEscrowOwner.deployEscrowContract({
        registryAddress: ERC721Address,
        beneficiaryAddress: owner1Address,
        holderAddress: holder1Address,
        wallet: owner2
      });
      await expect(errorDeployTxn).to.be.rejectedWith(/Deploying contract requires the web3 provider/);
    });

    it("should throw error if no registry provider", async () => {
      const errorDeployTxn = WriteableTitleEscrowOwner.deployEscrowContract({
        registryAddress: undefinedAddress,
        beneficiaryAddress: owner1Address,
        holderAddress: holder1Address,
        wallet: owner2,
        web3Provider: provider
      });
      await expect(errorDeployTxn).to.be.rejectedWith(/Please provide the registry address/);
    });

    it("should throw error if no beneficiary or holder address", async () => {
      const errorDeployTxn = WriteableTitleEscrowOwner.deployEscrowContract({
        registryAddress: ERC721Address,
        beneficiaryAddress: owner1Address,
        holderAddress: undefinedAddress,
        wallet: owner2,
        web3Provider: provider
      });
      await expect(errorDeployTxn).to.be.rejectedWith(/Escrow contract requires beneficiary and holder address/);
    });
  });
});
