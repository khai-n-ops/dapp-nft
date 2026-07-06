# Workshop DAPP Mint NFT

Bộ tài liệu và source code cho workshop xây dựng DAPP mint NFT trên **Ethereum Sepolia testnet**.

## Nội dung

| Thành phần | Mô tả |
|------------|--------|
| [docs/WORKSHOP.md](docs/WORKSHOP.md) | Hướng dẫn chi tiết toàn bộ quy trình |
| `contract/` | Smart contract ERC-721 + Hardhat deploy |
| `dapp/` | Frontend React mint NFT |
| `metadata/` | JSON metadata mẫu (OpenSea standard) |
| `assets/` | Thư mục đặt hình NFT |

## Quick Start

### 1. Contract (Hardhat)

```bash
cd contract
npm install
cp .env.example .env
# Chỉnh SEPOLIA_RPC_URL và PRIVATE_KEY
npx hardhat compile
npm run deploy:sepolia
```

### 2. Metadata (IPFS)

1. Đặt hình vào `assets/`
2. Sửa `image` trong `metadata/*.json`
3. Upload lên [Pinata](https://pinata.cloud/)
4. Set `METADATA_BASE_URI` và `CONTRACT_ADDRESS` trong `contract/.env`
5. `npm run set-uri:sepolia`

### 3. DAPP

```bash
cd dapp
npm install
cp .env.example .env
# Chỉnh VITE_CONTRACT_ADDRESS
npm run dev
```

### 4. OpenSea Testnet

https://testnets.opensea.io/assets/sepolia/`CONTRACT_ADDRESS`/`TOKEN_ID`

## Yêu cầu

- Node.js 18+
- MetaMask + Sepolia ETH (faucet)
- Tài khoản Alchemy/Infura (RPC miễn phí)

Đọc hướng dẫn đầy đủ tại **[docs/WORKSHOP.md](docs/WORKSHOP.md)**.
