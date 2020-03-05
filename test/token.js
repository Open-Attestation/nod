import {providers} from "ethers";
import {wrapDocument, getData} from "@govtechsg/open-attestation";
import {WriteableToken, ReadOnlyToken} from "../src/index";
import {setWallet, setWeb3Provider} from "../src/provider";
import {getBatchMerkleRoot} from "../src/util/token";
import ropstenTokenDocument from "../fixtures/tokenRopstenValid.json";

const {expect} = require("chai").use(require("chai-as-promised"));

const ERC721 = artifacts.require("TradeTrustERC721");
const TitleEscrow = artifacts.require("TitleEscrow");

describe("Token", () => {
  let ERC721Instance;
  let ERC721Address;
  let provider;
  let carrierWallet;
  let owner1;
  let owner2;
  let sampleDocument;

  const replaceTokenRegistry = (document, newTokenRegistryAddress) => {
    const unwrappedDocument = getData(document);
    unwrappedDocument.issuers[0].tokenRegistry = newTokenRegistryAddress;
    return wrapDocument(unwrappedDocument);
  };

  /**
   * Helper method to generate a new token id
   */
  const rewrapDocument = document => {
    return wrapDocument(getData(document));
  };

  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
    provider = new providers.Web3Provider(web3.currentProvider);
    carrierWallet = provider.getSigner(0);
    owner1 = provider.getSigner(1);
    owner2 = provider.getSigner(2);
    sampleDocument = replaceTokenRegistry(ropstenTokenDocument, ERC721Address);
    await ERC721Instance.safeMint(await owner1.getAddress(), getBatchMerkleRoot(sampleDocument));
  });

  afterEach("", () => {
    setWeb3Provider(undefined);
    setWallet(undefined);
  });

  describe("ReadOnlyToken", () => {
    it("should work without a wallet for read operations", async () => {
      const token = new ReadOnlyToken({document: sampleDocument, web3Provider: provider});
      const tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner1.getAddress());
    });
    it("should use a saved provider if it exists", async () => {
      setWeb3Provider(provider);
      const token = new ReadOnlyToken({document: sampleDocument});
      const tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner1.getAddress());
    });
  });

  describe("WriteableToken", () => {
    it("should be able to transfer ownership with a wallet", async () => {
      const token = new WriteableToken({document: sampleDocument, web3Provider: provider, wallet: owner1});

      let tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner1.getAddress());
      await token.transferOwnership(await owner2.getAddress());

      tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner2.getAddress());
    });

    it("should surrender using the TokenRegistry transfer method if owner is an EOA that is in the provided wallet", async () => {
      const token = new WriteableToken({document: sampleDocument, web3Provider: provider, wallet: owner1});
      await token.surrender();
      await expect(token.getOwner()).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721: owner query for nonexistent token/
      );
    });
    it("should surrender using the TitleEscrow transfer method if owner is a title escrow", async () => {
      const owner1Address = await owner1.getAddress();
      const escrowInstance = await TitleEscrow.new(ERC721Address, owner1Address, owner1Address, {
        from: owner1Address
      });

      const token = new WriteableToken({document: sampleDocument, web3Provider: provider, wallet: owner1});
      await token.transferOwnership(escrowInstance.address);
      expect((await token.getOwner()).address).to.deep.equal(escrowInstance.address);
      await token.surrender();
      await expect(token.getOwner()).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721: owner query for nonexistent token/
      );
    });
    it("should use a pre-supplied wallet if there is one", async () => {
      setWeb3Provider(provider);
      setWallet(owner1);
      const token = new WriteableToken({document: sampleDocument});

      let tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner1.getAddress());
      await token.transferOwnership(await owner2.getAddress());

      tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner2.getAddress());
    });
    it("should throw an error if there is no saved wallet and no wallet was provided in constructor", async () => {
      await expect(() => new WriteableToken({document: sampleDocument})).to.throw(
        /WriteableToken requires a wallet to be supplied at initialisation/
      );
    });

    it("should mint", async () => {
      setWeb3Provider(provider);
      setWallet(carrierWallet);
      const newDocument = rewrapDocument(sampleDocument); // will create a document with a different token id
      const token = new WriteableToken({document: newDocument});
      await expect(ERC721Instance.ownerOf(getBatchMerkleRoot(newDocument))).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721: owner query for nonexistent token/
      );

      await token.mint(await owner1.getAddress());
      const tokenOwner = await token.getOwner();
      expect(tokenOwner.address).to.deep.equal(await owner1.getAddress());
    });
    it("should transfer to new escrow", async () => {
      const token = new WriteableToken({document: sampleDocument, web3Provider: provider, wallet: owner1});
      await token.transferToNewEscrow(await owner2.getAddress(), await owner1.getAddress());

      const tokenOwner = await token.getOwner();

      expect(await tokenOwner.beneficiary()).to.deep.equal(await owner2.getAddress());
      expect(await tokenOwner.holder()).to.deep.equal(await owner1.getAddress());
    });
    it("should mint to new escrow", async () => {
      setWeb3Provider(provider);
      setWallet(carrierWallet);
      const newDocument = rewrapDocument(sampleDocument); // will create a document with a different token id
      const token = new WriteableToken({document: newDocument});
      const owner1Address = await owner1.getAddress();
      const owner2Address = await owner2.getAddress();
      await token.mintToEscrow(owner1Address, owner2Address);
      const tokenOwner = await token.getOwner();
      expect(await tokenOwner.beneficiary()).to.deep.equal(owner1Address);
      expect(await tokenOwner.holder()).to.deep.equal(owner2Address);
    });
    it("should fail to surrender if the owner is neither TitleEscrow or EOA in the provided wallet", async () => {
      const token = new WriteableToken({document: sampleDocument, web3Provider: provider, wallet: owner2});
      await expect(token.surrender()).to.be.rejectedWith(/execution error: revert/);
    });
  });
});
