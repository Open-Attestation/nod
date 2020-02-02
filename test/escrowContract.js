import {ethers} from "ethers";
import {TitleEscrowOwner, TitleEscrow} from "../src/index";
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
    setWeb3Provider(provider);
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
      const ownerInstanceWithHolder1 = await new TitleEscrow({wallet: owner2});
      const {address} = await ownerInstanceWithHolder1.deployEscrowContract(
        ERC721Address,
        owner1Address,
        holder1Address
      );

      await ERC721Instance.safeMint(address, SAMPLE_TOKEN_ID);
      const titleEscrowInstance = new TitleEscrowOwner({address});

      expect(await titleEscrowInstance.address).to.deep.equal(address);
      expect(await titleEscrowInstance.holder()).to.deep.equal(holder1Address);
      expect(await titleEscrowInstance.beneficiary()).to.deep.equal(owner1Address);
    });

    it("should throw an error if there is no saved wallet and no wallet was provided in constructor", async () => {
      await expect(() => new TitleEscrow({})).to.throw(
        /TitleEscrow requires a wallet to be supplied at initialization/
      );
    });

    it("should throw error if no registry provider", async () => {
      const ownerInstanceWithHolder1 = await new TitleEscrow({wallet: owner2});
      const errorDeployTxn = ownerInstanceWithHolder1.deployEscrowContract(
        undefinedAddress,
        owner1Address,
        holder1Address
      );
      await expect(errorDeployTxn).to.be.rejectedWith(/Please provide the registry address/);
    });

    it("should throw error if no beneficiary or holder address", async () => {
      const ownerInstanceWithHolder1 = await new TitleEscrow({wallet: owner2});
      const errorDeployTxn = ownerInstanceWithHolder1.deployEscrowContract(
        ERC721Address,
        undefinedAddress,
        holder1Address
      );
      await expect(errorDeployTxn).to.be.rejectedWith(/Escrow contract requires beneficiary and holder address/);
    });
  });
});
