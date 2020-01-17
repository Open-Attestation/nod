import {providers} from "ethers";
import {wrapDocument, getData} from "@govtechsg/open-attestation";
import {WriteableToken, ReadOnlyToken} from "../src/index";
import {setWallet, setWeb3Provider} from "../src/provider";
import {getBatchMerkleRoot} from "../src/util/token";
import ropstenTokenDocument from "../fixtures/tokenRopstenValid.json";

const {expect} = require("chai").use(require("chai-as-promised"));

const ERC721 = artifacts.require("ERC721MintableFull");

describe("Token", () => {
  let ERC721Instance;
  let ERC721Address;
  let provider;
  let owner1;
  let owner2;
  let sampleDocument;

  const replaceTokenRegistry = (document, newTokenRegistryAddress) => {
    const unwrappedDocument = getData(document);
    unwrappedDocument.issuers[0].tokenRegistry = newTokenRegistryAddress;
    return wrapDocument(unwrappedDocument);
  };

  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
    provider = new providers.Web3Provider(web3.currentProvider);
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
  });
});
