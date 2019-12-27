const ERC721 = artifacts.require("ERC721MintableFull");
const { TokenRegistry } = require("../dist/registry")

describe.only("", () => {
  let ERC721Instance;
  let ERC721Address;
  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
  });
  it("should", () => {
    console.log(ERC721Address);
    let t = new TokenRegistry(ERC721Address, web3.provider)
  });
});
