# Workshop: Xây dựng DAPP Mint NFT trên Ethereum Sepolia

> Hướng dẫn từ A → Z: tạo hình NFT, deploy smart contract bằng Hardhat, viết DAPP mint, và xem collection trên OpenSea Testnet.

---

## Mục lục

1. [Tổng quan quy trình](#1-tổng-quan-quy-trình)
2. [Hiểu về các mạng lưới blockchain](#2-hiểu-về-các-mạng-lưới-blockchain)
3. [Tạo hình ảnh & metadata NFT](#3-tạo-hình-ảnh--metadata-nft)
4. [Deploy Smart Contract lên Sepolia (Hardhat)](#4-deploy-smart-contract-lên-sepolia-hardhat)
5. [Chạy DAPP Mint NFT](#5-chạy-dapp-mint-nft)
6. [Xem NFT trên OpenSea Testnet](#6-xem-nft-trên-opensea-testnet)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Tổng quan quy trình

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐    ┌──────────────┐
│ Tạo hình    │ -> │ Upload IPFS  │ -> │ Deploy      │ -> │ DAPP Mint  │ -> │ OpenSea      │
│ + metadata  │    │ (Pinata)     │    │ Contract    │    │ (Frontend) │    │ Testnet      │
└─────────────┘    └──────────────┘    └─────────────┘    └────────────┘    └──────────────┘
```

**Cấu trúc repo workshop:**


| Thư mục     | Mô tả                                   |
| ----------- | --------------------------------------- |
| `contract/` | Smart contract ERC-721 + Hardhat deploy |
| `dapp/`     | Frontend React kết nối ví & mint NFT    |
| `metadata/` | File JSON metadata mẫu                  |
| `assets/`   | Hình ảnh NFT mẫu                        |


---

## 2. Hiểu về các mạng lưới blockchain

### Mainnet vs Testnet


|           | **Mainnet**                 | **Testnet**                         |
| --------- | --------------------------- | ----------------------------------- |
| Tiền thật | Có (ETH thật)               | Không (ETH giả, miễn phí từ faucet) |
| Mục đích  | Production, người dùng thật | Học tập, thử nghiệm, demo           |
| Rủi ro    | Mất tiền nếu lỗi            | An toàn, không mất tiền thật        |


### Các testnet Ethereum phổ biến


| Mạng        | Chain ID   | Ghi chú                                                         |
| ----------- | ---------- | --------------------------------------------------------------- |
| **Sepolia** | `11155111` | Testnet chính thức hiện tại, được OpenSea & hầu hết tool hỗ trợ |
| Holesky     | `17000`    | Testnet cho validator/staking                                   |
| Goerli      | `5`        | Đã deprecated, không nên dùng                                   |


> **Workshop này dùng Sepolia** vì OpenSea Testnet, MetaMask, Alchemy/Infura đều hỗ trợ tốt.

### RPC & Block Explorer

- **RPC**: Điểm kết nối để app/giao dịch gửi request lên blockchain. Lấy từ [Alchemy](https://www.alchemy.com/) hoặc [Infura](https://www.infura.io/) (miễn phí).
- **Block Explorer**: Xem giao dịch, contract trên web.
  - Sepolia: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)

### Layer 2 (L2) — biết thêm


| Mạng                                                     | Đặc điểm                                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| Polygon, Arbitrum, Optimism, Base                        | Phí gas rẻ hơn Ethereum L1, vẫn có testnet riêng |
| Workshop này tập trung L1 Sepolia để dễ hiểu flow cơ bản |                                                  |


---

## 3. Tạo hình ảnh & metadata NFT

### 3.1. Tạo hình ảnh NFT

NFT on-chain thường **không lưu hình trực tiếp** trên blockchain (quá đắt). Thay vào đó, contract lưu **URI** trỏ tới file JSON (metadata), và JSON đó chứa link hình.

**Cách tạo hình phổ biến trong workshop:**

1. **AI Generation** — Midjourney, DALL·E, Stable Diffusion
2. **Pixel Art** — Piskel, Aseprite
3. **Bộ sưu tập có trait** — dùng tool như [NFT Art Generator](https://nft-generator.art/) để tạo 100+ ảnh từ layer

**Yêu cầu kỹ thuật:**

- Định dạng: PNG hoặc JPG
- Kích thước khuyến nghị: 512×512 hoặc 1024×1024 px
- Đặt tên có thứ tự: `1.png`, `2.png`, ... (khớp với token ID)

Repo mẫu có file `assets/sample.png` — bạn thay bằng hình của mình.

### 3.2. Metadata JSON (chuẩn OpenSea)

Mỗi NFT cần 1 file JSON theo [OpenSea Metadata Standard](https://docs.opensea.io/docs/metadata-standards):

```json
{
  "name": "Workshop NFT #1",
  "description": "NFT mint từ workshop DAPP Sepolia",
  "image": "ipfs://QmYourImageHash/1.png",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Rarity", "value": "Common" }
  ]
}
```

- `image`: phải là `ipfs://...` hoặc URL HTTPS công khai
- `attributes`: optional, hiển thị properties trên OpenSea

### 3.3. Upload lên IPFS (qua Pinata)

1. Đăng ký tài khoản [Pinata](https://pinata.cloud/) (free tier đủ cho workshop)
2. Upload thư mục `assets/` → lấy **CID** (ví dụ: `QmXxx...`)
3. Upload thư mục `metadata/` (đã sửa `image` field) → lấy **Metadata CID**
4. **Base URI** cho contract = `ipfs://<MetadataCID>/`
  Ví dụ token ID `1` → URI = `ipfs://QmMetadata.../1.json`

> Sau khi deploy, gọi `setBaseURI("ipfs://QmYourMetadataCID/")` trên contract (owner).

---

## 4. Deploy Smart Contract lên Sepolia (Hardhat)

### 4.1. Chuẩn bị

**Cài đặt:**

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) extension
- Ví Sepolia ETH từ faucet:
  - [https://sepoliafaucet.com](https://sepoliafaucet.com)
  - [https://www.alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)

**Lấy Sepolia ETH:**

1. Thêm mạng Sepolia vào MetaMask (thường tự nhận khi dùng faucet)
2. Copy địa chỉ ví → request ETH từ faucet (chờ 1–2 phút)

### 4.2. Cấu hình môi trường

```bash
cd contract
npm install
cp .env.example .env
```

Chỉnh file `.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0x...your_wallet_private_key_without_quotes
ETHERSCAN_API_KEY=your_etherscan_api_key   # optional, để verify contract
```

> **Cảnh báo bảo mật:** Không bao giờ commit file `.env` hoặc chia sẻ private key. Dùng ví testnet riêng, không dùng ví mainnet.

**Lấy private key từ MetaMask:**

MetaMask → Account → Account details → Show private key

### 4.3. Compile & test local (optional)

```bash
npx hardhat compile
npx hardhat test
```

### 4.4. Deploy lên Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Output mẫu:

```
Deploying WorkshopNFT...
WorkshopNFT deployed to: 0xAbC123...
```

**Lưu lại địa chỉ contract** — cần cho DAPP và OpenSea.

### 4.5. Thiết lập Base URI (metadata)

Sau khi upload metadata lên IPFS:

```bash
npx hardhat run scripts/setBaseURI.js --network sepolia
```

Hoặc gọi trực tiếp trên Etherscan (tab Write Contract, connect wallet owner).

### 4.6. Verify contract trên Etherscan (khuyến nghị)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "Workshop NFT" "WNFT" 100 0
```

Tham số: `name`, `symbol`, `maxSupply`, `mintPrice` (wei).

Verify giúp OpenSea đọc contract ABI dễ hơn và người học xem source trên Etherscan.

### 4.7. Contract giải thích nhanh

File `contract/contracts/WorkshopNFT.sol`:


| Hàm               | Mô tả                                                 |
| ----------------- | ----------------------------------------------------- |
| `mint()`          | User mint 1 NFT, trả `mintPrice` ETH (0 cho workshop) |
| `totalSupply()`   | Số NFT đã mint                                        |
| `maxSupply()`     | Giới hạn tổng supply                                  |
| `tokenURI(id)`    | Trả metadata URI = `baseURI + id + ".json"`           |
| `setBaseURI(uri)` | Owner set IPFS base path                              |
| `withdraw()`      | Owner rút ETH trong contract                          |


---

## 5. Chạy DAPP Mint NFT

### 5.1. DApp là gì?

**DApp** (Decentralized Application) là ứng dụng có **frontend chạy trên trình duyệt** (React, HTML...) nhưng **logic quan trọng nằm trên blockchain** thay vì server trung tâm.

```
┌─────────────────────────────────────────────────────────┐
│  DApp (trình duyệt)          Blockchain (Sepolia)       │
│  ┌──────────────┐             ┌──────────────────┐      │
│  │ Giao diện    │  gọi hàm    │ Smart Contract   │      │
│  │ nút Mint...  │ ──────────> │ WorkshopNFT.sol  │      │
│  └──────────────┘  qua ABI    └──────────────────┘      │
│         │                                                │
│         │ ký giao dịch                                     │
│         v                                                │
│  ┌──────────────┐                                        │
│  │ MetaMask     │  (ví người dùng)                       │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

So với app web thông thường:

| | **Web App truyền thống** | **DApp** |
|---|---------------------------|----------|
| Backend | Server (Node, PHP...) kiểm soát dữ liệu | Smart contract trên chain, ai cũng kiểm tra được |
| Đăng nhập | Email / password | Kết nối ví (MetaMask) |
| Thao tác | Gọi API server | Gửi giao dịch lên blockchain, trả phí gas |
| Dữ liệu | Lưu database riêng | Lưu on-chain (hoặc IPFS cho file) |

Trong workshop này, thư mục `dapp/` là **phần frontend** — trang web cho người dùng bấm Mint. Contract trong `contract/` là **phần backend phi tập trung** — quy định ai được mint, giá bao nhiêu, supply tối đa bao nhiêu.

### 5.2. Cấu hình

```bash
cd dapp
npm install
cp .env.example .env
```

Chỉnh `dapp/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...địa_chỉ_contract_sau_deploy
VITE_CHAIN_ID=11155111
```

### 5.3. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173)

### 5.4. Flow sử dụng DAPP

1. **Connect Wallet** — MetaMask, chọn account Sepolia
2. Kiểm tra **Supply** (đã mint / max)
3. Bấm **Mint NFT** — confirm transaction trên MetaMask
4. Chờ transaction confirm → hiện link Etherscan

### 5.5. ABI là gì? Tại sao DAPP vẫn cần ABI?

Nhiều người thấy trong `.env` chỉ cần điền `VITE_CONTRACT_ADDRESS` nên tưởng **không cần ABI**. Thực tế **DAPP vẫn cần ABI** — ABI đã được đặt sẵn trong file `dapp/src/config.js`, không cần copy thủ công mỗi lần deploy.

#### ABI (Application Binary Interface) là gì?

ABI là **bản mô tả giao diện** của smart contract: tên hàm, tham số, kiểu dữ liệu, giá trị trả về, và event. Có thể hình dung ABI như **file OpenAPI/Swagger** của contract — nó cho frontend biết *cách gọi* contract, không chỉ *địa chỉ* contract.

```
Địa chỉ contract  →  "Gọi đến nhà số 0xAbC123..."
ABI               →  "Cửa nào mở được, bấm chuông kiểu gì, ai trả lời"
```

#### Tại sao frontend cần ABI?

Blockchain không tự hiểu bạn muốn gọi `mint()` hay `totalSupply()`. Khi DAPP gọi contract, **ethers.js dùng ABI để**:

1. **Encode** — đóng gói tên hàm + tham số thành dữ liệu nhị phân gửi lên chain
2. **Decode** — giải mã dữ liệu trả về thành số, chuỗi, boolean dễ đọc
3. **Lắng nghe event** — ví dụ event `Minted` sau khi mint thành công

Ví dụ trong DAPP:

```javascript
// config.js — ABI đã có sẵn
const contract = new Contract(CONTRACT_ADDRESS, WORKSHOP_NFT_ABI, signer);

await contract.mint({ value: mintPrice });     // ABI cho ethers biết cách gọi mint()
const supply = await contract.totalSupply();   // ABI cho ethers biết cách đọc kết quả
```

Nếu **thiếu ABI** hoặc ABI **sai hàm** → DAPP không gọi được contract, dù địa chỉ đúng.

#### Tại sao không cần copy ABI đầy đủ từ Hardhat?

Sau khi compile, Hardhat tạo file ABI đầy đủ tại:

```
contract/artifacts/contracts/WorkshopNFT.sol/WorkshopNFT.json
```

File này chứa **mọi** hàm của contract (kể cả `withdraw`, `setBaseURI`, `_update`...). Workshop **không cần copy nguyên file** vì:

| Cách | Ưu điểm | Khi nào dùng |
|------|---------|--------------|
| **ABI tối giản** (đang dùng) | Gọn, dễ đọc, chỉ khai báo hàm DAPP thực sự gọi | Workshop, DAPP đơn giản |
| **ABI đầy đủ từ artifacts** | Khớp 100% với contract, dùng được mọi hàm | DAPP phức tạp, nhiều chức năng admin |

ABI trong `dapp/src/config.js` chỉ liệt kê những gì DAPP cần:

```javascript
export const WORKSHOP_NFT_ABI = [
  "function mint() payable",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Minted(address indexed to, uint256 indexed tokenId)",
];
```

Đây gọi là **Human-Readable ABI** — ethers.js v6 hỗ trợ trực tiếp, không cần JSON dài hàng trăm dòng.

#### Khi nào cần cập nhật ABI?

Chỉ khi bạn **sửa contract** và thêm hàm mới mà DAPP cần gọi. Ví dụ thêm `mintBatch(amount)` → bổ sung dòng tương ứng vào `WORKSHOP_NFT_ABI`.

Nếu muốn dùng ABI đầy đủ từ Hardhat:

```bash
# Sau npx hardhat compile, copy field "abi" từ file JSON
contract/artifacts/contracts/WorkshopNFT.sol/WorkshopNFT.json
```

Rồi import vào `config.js` thay cho ABI tối giản.

#### Tóm lại

| Thành phần | Vai trò | Đặt ở đâu |
|------------|---------|-----------|
| **Contract Address** | Chỉ định contract nào trên chain | `dapp/.env` |
| **ABI** | Chỉ định gọi hàm nào, kiểu dữ liệu ra sao | `dapp/src/config.js` (có sẵn) |
| **Signer (MetaMask)** | Ai ký và trả phí gas cho giao dịch | Kết nối qua ví |

→ Deploy contract mới chỉ cần **đổi địa chỉ** trong `.env`. ABI giữ nguyên miễn là bạn không đổi interface contract.

### 5.6. Thêm Sepolia vào MetaMask (nếu chưa có)


| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Network Name    | Sepolia                                                      |
| RPC URL         | [https://rpc.sepolia.org](https://rpc.sepolia.org)           |
| Chain ID        | 11155111                                                     |
| Currency Symbol | ETH                                                          |
| Block Explorer  | [https://sepolia.etherscan.io](https://sepolia.etherscan.io) |


---

## 6. Xem NFT trên OpenSea Testnet

### 6.1. OpenSea Testnet

URL: **[https://testnets.opensea.io](https://testnets.opensea.io)**

> Không dùng opensea.io chính — đó là mainnet.

### 6.2. Xem collection của bạn

Sau khi mint ít nhất 1 NFT:

```
https://testnets.opensea.io/assets/sepolia/<CONTRACT_ADDRESS>/<TOKEN_ID>
```

Ví dụ token ID 1:

```
https://testnets.opensea.io/assets/sepolia/0xAbC123.../1
```

### 6.3. Collection page

```
https://testnets.opensea.io/collection/<slug-hoặc-địa-chỉ-contract>
```

OpenSea có thể mất **vài phút đến vài giờ** để index metadata từ IPFS. Nếu hình chưa hiện:

1. Kiểm tra `tokenURI` trên Etherscan (Read Contract)
2. Mở URI trên [https://ipfs.io/ipfs/](https://ipfs.io/ipfs/)... xem JSON có đúng không
3. Đảm bảo contract đã verify và `baseURI` đã set

### 6.4. Refresh metadata trên OpenSea

Trên trang NFT → menu **⋮** → **Refresh metadata** (nếu có).

---

## 7. Troubleshooting


| Vấn đề                      | Giải pháp                                                             |
| --------------------------- | --------------------------------------------------------------------- |
| `insufficient funds`        | Lấy thêm Sepolia ETH từ faucet                                        |
| Wrong network trên DAPP     | Chuyển MetaMask sang Sepolia (chain 11155111)                         |
| `Max supply reached`        | Tăng `maxSupply` khi deploy hoặc deploy contract mới                  |
| Hình NFT không hiện OpenSea | Kiểm tra IPFS CID, `baseURI`, format JSON                             |
| Transaction pending lâu     | Sepolia đôi khi chậm; tăng gas hoặc chờ                               |
| `nonce too low`             | Reset account MetaMask: Settings → Advanced → Clear activity tab data |


---

## Tài liệu tham khảo

- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin ERC721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Pinata IPFS](https://docs.pinata.cloud/)

