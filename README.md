# Open-Attestation Token

This library facilitates ERC721 Token interactions using OpenAttestation wrapped documents as token identifiers.
EthersJS is heavily used in this library and unless otherwise stated all Ethereum-related interfaces are expected to be derived from EthersJS.

## Install

        $ npm install @govtechsg/oa-token or yarn @govtechsg/oa-token

## Initialize

        import { ReadOnlyToken, WriteableToken } from "@govtechsg/oa-token";
        const tokenInstance = new ReadOnlyToken({document: wrappedDocument});

## Save Web3 Provider or Wallet

        import { WriteableToken, setWeb3Provider, setWallet } from "@govtechsg/oa-token";

        setWeb3Provider(provider)
        setWallet(wallet)

        const token = new WriteableToken({document}) // Don't need to provider wallet or provider again here

## Get the owner of the contract

        await tokenInstance.getOwner();

returns a promise for the address of the owner.

## Transfer the token ownership

Writeable token instance initialisation requires an EthersJS type wallet that has write permissions for that token.

        const writeableTokenInstance = new WriteableToken({document: wrappedDocument, web3Provider, wallet})
        await token.transferOwnership("NEW_OWNER_ADDRESS");

returns a promise for an EthersJS transaction receipt

# Development

## Logging

Turn on debugging by using the DEBUG environment variable for Node.js and using localStorage.debug in the browser.

E.g:

```bash
DEBUG="PLACEHOLDER_PROJECT_NAME:*" npm run dev
```

## Commit message format

This boiler plate uses the **semantic-release** package to manage versioning. Once it has been set up, version numbers and Github release changelogs will be automatically managed. **semantic-release** uses the commit messages to determine the type of changes in the codebase. Following formalized conventions for commit messages, **semantic-release** automatically determines the next [semantic version](https://semver.org) number, generates a changelog and publishes the release.

Use `npm run commit` instead of `git commit` in order to invoke Commitizen commit helper that helps with writing properly formatted commit messages.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

## License

MIT © [Sumit Chaudhari](https://github.com/sumitnitsurat)
