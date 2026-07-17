import { parseAbi } from "viem";

export const WORKSHOP_NFT_ABI = parseAbi([
  "function mint() payable",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Minted(address indexed to, uint256 indexed tokenId)",
]);

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const SEPOLIA_CHAIN_ID = 11155111;

/** CID thư mục metadata trên IPFS (không có ipfs://) — dùng để tạo link xem metadata/hình */
export const IPFS_METADATA_CID =
  import.meta.env.VITE_IPFS_METADATA_CID ||
  "bafybeigxvmdslncljh5suxfk6lmbcwoad7d7dxkgftlsz4f7wzdqx3onxe";

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs",
  "https://cloudflare-ipfs.com/ipfs",
  "https://dweb.link/ipfs",
];

export function getEtherscanContractUrl(contractAddress) {
  return `https://sepolia.etherscan.io/address/${contractAddress}`;
}

export function getEtherscanCollectionUrl(contractAddress) {
  return `https://sepolia.etherscan.io/token/${contractAddress}`;
}

export function getEtherscanNftUrl(contractAddress, tokenId) {
  return `https://sepolia.etherscan.io/nft/${contractAddress}/${tokenId}`;
}

export function getEtherscanTxUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function getEtherscanLatestMintsUrl() {
  return "https://sepolia.etherscan.io/nft-latest-mints";
}

export function getIpfsMetadataUrl(tokenId, gatewayIndex = 0) {
  const base = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${base}/${IPFS_METADATA_CID}/${tokenId}.json`;
}

export function getIpfsFolderUrl(gatewayIndex = 0) {
  const base = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${base}/${IPFS_METADATA_CID}/`;
}

export function getRecommendedBaseUri() {
  return `ipfs://${IPFS_METADATA_CID}/`;
}

/** OpenSea testnet đã ngừng hỗ trợ từ 07/2025 — giữ để tham khảo */
export function getOpenSeaTokenUrl(contractAddress, tokenId) {
  return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
}

export const EXPLORER_LINKS = [
  {
    id: "etherscan-collection",
    label: "Etherscan — Collection",
    description: "Xem toàn bộ NFT của contract",
    getUrl: (addr) => getEtherscanCollectionUrl(addr),
    primary: true,
  },
  {
    id: "etherscan-contract",
    label: "Etherscan — Contract",
    description: "Source code, Read/Write contract",
    getUrl: (addr) => getEtherscanContractUrl(addr),
  },
  {
    id: "etherscan-mints",
    label: "Etherscan — Latest Mints",
    description: "Danh sách NFT mint gần đây trên Sepolia",
    getUrl: () => getEtherscanLatestMintsUrl(),
  },
  {
    id: "ipfs-folder",
    label: "IPFS — Thư mục metadata",
    description: "Xem trực tiếp file JSON metadata",
    getUrl: () => getIpfsFolderUrl(),
  },
];
