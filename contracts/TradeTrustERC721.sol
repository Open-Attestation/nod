pragma solidity ^0.5.11;

import "./ERC721.sol";
import {TitleEscrow} from "./TitleEscrow.sol";

contract TradeTrustERC721 is ERC721MintableFull, IERC721Receiver {
  constructor(string memory name, string memory symbol) public ERC721MintableFull(name, symbol) {
    // solhint-disable-previous-line no-empty-blocks
  }

  function deployTitleEscrow(address _beneficiary, address _holder) public returns (address) {
    return address(new TitleEscrow(address(this), _beneficiary, _holder));
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data)
    public
    returns (bytes4)
  {
    _burn(tokenId);
    return this.onERC721Received.selector;
  }

}
