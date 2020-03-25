import {ethers} from "ethers";
import {
  TitleEscrowOwner,
  WriteableTitleEscrowOwner,
  EthereumAccountOwner,
  isAddressTitleEscrow,
  createOwner,
} from "../src/index";
import {setWallet, setWeb3Provider} from "../src/provider";

const {expect} = require("chai").use(require("chai-as-promised"));

const TitleEscrow = artifacts.require("TitleEscrow");
const ERC721 = artifacts.require("TradeTrustERC721");
const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Owner", () => {
  let ERC721Address;
  let ERC721Instance;
  let provider;
  let owner1;
  let owner2;
  let holder1;
  let owner1Address;
  let owner2Address;
  let holder1Address;

  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
    provider = new ethers.providers.Web3Provider(web3.currentProvider);
    setWeb3Provider(provider);
    owner1 = provider.getSigner(1);
    owner2 = provider.getSigner(2);
    holder1 = provider.getSigner(3);
    owner1Address = await owner1.getAddress();
    owner2Address = await owner2.getAddress();
    holder1Address = await holder1.getAddress();
    // await ERC721Instance.safeMint(await owner1.getAddress(), SAMPLE_TOKEN_ID);
  });

  afterEach("", () => {
    setWeb3Provider(undefined);
    setWallet(undefined);
  });

  describe("Owner", () => {
    it("should have an address after being instantiated", async () => {
      const ownerInstance = new EthereumAccountOwner({address: owner1Address});
      expect(owner1Address).to.deep.equal(ownerInstance.address);
    });
  });

  describe("TitleEscrowOwner", () => {
    it("static method isTitleEscrow should correctly detect TitleEscrow contracts", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner1Address, {
        from: owner1Address,
      });

      expect(await isAddressTitleEscrow({address: escrowInstance.address})).to.deep.equal(true);
      expect(await isAddressTitleEscrow(owner1Address)).to.deep.equal(false);
    });

    it("should correctly initialise if the given address is a TitleEscrow contract", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner2Address, {
        from: owner1Address,
      });
      const titleEscrowInstance = new TitleEscrowOwner({address: escrowInstance.address});

      expect(await titleEscrowInstance.beneficiary()).to.deep.equal(owner1Address);
      expect(await titleEscrowInstance.holder()).to.deep.equal(owner2Address);
    });
    it("should return the holder correctly if it has been changed after initialisation", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner1Address, {
        from: owner1Address,
      });

      await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
      const titleEscrowInstance = new TitleEscrowOwner({address: escrowInstance.address});
      expect(await titleEscrowInstance.holder()).to.deep.equal(owner1Address);
      await escrowInstance.changeHolder(owner2Address, {from: owner1Address});
      expect(await titleEscrowInstance.holder()).to.deep.equal(owner2Address);
    });
    it("should return the approvedTransferTarget if there is one set", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner2Address, {
        from: owner1Address,
      });
      await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
      await escrowInstance.endorseTransfer(owner2Address, {from: owner1Address});
      const titleEscrowInstance = new TitleEscrowOwner({address: escrowInstance.address});
      expect(await titleEscrowInstance.endorsedTransferTarget()).to.deep.equal(owner2Address);
    });
    it("should return zero address if there is no endorsed transfer target", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner2Address, {
        from: owner1Address,
      });
      await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
      const titleEscrowInstance = new TitleEscrowOwner({address: escrowInstance.address});
      expect(await titleEscrowInstance.endorsedTransferTarget()).to.deep.equal(ZERO_ADDRESS);
    });
  });

  describe("WriteableTitleEscrowOwner", () => {
    let escrowInstance;

    beforeEach(async () => {
      escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, holder1Address, {
        from: owner1Address,
      });
      await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    });

    it("should allow the holder to change holders", async () => {
      const ownerInstanceWithHolder1 = await createOwner({address: escrowInstance.address, provider, wallet: holder1});

      await ownerInstanceWithHolder1.changeHolder(owner2Address);
      expect(await ownerInstanceWithHolder1.holder()).to.deep.equal(owner2Address);
    });

    it("should allow transfer ownership flow", async () => {
      const ownerInstanceWithWallet1 = await createOwner({address: escrowInstance.address, provider, wallet: owner1});
      await ownerInstanceWithWallet1.endorseTransfer(owner2Address);
      const ownerInstanceWithHolder1 = await createOwner({address: escrowInstance.address, provider, wallet: holder1});

      await ownerInstanceWithHolder1.transferTo(owner2Address);

      expect(await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID)).to.deep.equal(owner2Address);
    });
  });

  describe("createOwner", () => {
    it("should create an owner instance if the given address is an ethereum address", async () => {
      const ownerInstance = await createOwner({address: owner1Address});
      expect(ownerInstance instanceof EthereumAccountOwner).to.be.deep.equal(true);
      expect(ownerInstance.address).to.be.deep.equal(owner1Address);
    });
    it("should create a TitleEscrowOwner instance if the given address is a TitleEscrow and no wallet was provided", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner1Address, {
        from: owner1Address,
      });
      const ownerInstance = await createOwner({address: escrowInstance.address});
      expect(ownerInstance instanceof TitleEscrowOwner).to.be.deep.equal(true);
      expect(ownerInstance instanceof WriteableTitleEscrowOwner).to.be.deep.equal(false);
      expect(ownerInstance.address).to.be.deep.equal(escrowInstance.address);
    });
    it("should create a WriteableTitleEscrowOwner instance if the given address is a TitleEscrow and a wallet was provided", async () => {
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner1Address, {
        from: owner1Address,
      });
      const ownerInstance = await createOwner({address: escrowInstance.address, wallet: owner1});
      expect(ownerInstance instanceof WriteableTitleEscrowOwner).to.be.deep.equal(true);
      expect(ownerInstance.address).to.be.deep.equal(escrowInstance.address);
    });
  });
});
