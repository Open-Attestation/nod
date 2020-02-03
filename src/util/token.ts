import {getData, v2, v3, WrappedDocument} from "@govtechsg/open-attestation";

export const getBatchMerkleRoot = (
  document: WrappedDocument<v2.OpenAttestationDocument> | WrappedDocument<v3.OpenAttestationDocument>
) => {
  return `0x${document.signature?.merkleRoot || ""}`;
};

const isWrappedV3Document = (document: any): document is WrappedDocument<v3.OpenAttestationDocument> => {
  return document && document.version === "open-attestation/3.0";
};
const isWrappedV2Document = (document: any): document is WrappedDocument<v2.OpenAttestationDocument> => {
  return !isWrappedV3Document(document);
};

export const getIssuerAddress = (
  document: WrappedDocument<v2.OpenAttestationDocument> | WrappedDocument<v3.OpenAttestationDocument>
): string => {
  if (isWrappedV2Document(document)) {
    const data = getData(document);
    if (!(data.issuers.length === 1)) throw new Error("Token must have exactly one token registry contract");
    if (!data.issuers[0].tokenRegistry) throw new Error("Token must have token registry in it");
    return data.issuers[0].tokenRegistry;
  }
  const data = getData(document);
  return data.proof.value;
};
