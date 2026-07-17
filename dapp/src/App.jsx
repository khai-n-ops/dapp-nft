import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { sepolia } from "wagmi/chains";
import {
  CONTRACT_ADDRESS,
  WORKSHOP_NFT_ABI,
  SEPOLIA_CHAIN_ID,
  EXPLORER_LINKS,
  getEtherscanNftUrl,
  getEtherscanTxUrl,
  getIpfsMetadataUrl,
  getRecommendedBaseUri,
  IPFS_METADATA_CID,
} from "./config";
import "./App.css";

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const contractConfigured =
  CONTRACT_ADDRESS && !CONTRACT_ADDRESS.includes("YOUR");

const readOptions = {
  chainId: sepolia.id,
  query: { enabled: contractConfigured, refetchInterval: 15_000 },
};

export default function App() {
  const { address, isConnected, chain } = useAccount();
  const [status, setStatus] = useState({ type: "", text: "" });

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WORKSHOP_NFT_ABI,
    functionName: "totalSupply",
    ...readOptions,
  });

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WORKSHOP_NFT_ABI,
    functionName: "maxSupply",
    ...readOptions,
  });

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WORKSHOP_NFT_ABI,
    functionName: "mintPrice",
    ...readOptions,
  });

  const { data: myBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WORKSHOP_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: contractConfigured && !!address, refetchInterval: 15_000 },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isMintPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const minted = totalSupply !== undefined ? Number(totalSupply) : null;
  const max = maxSupply !== undefined ? Number(maxSupply) : null;
  const remaining = minted !== null && max !== null ? Math.max(max - minted, 0) : null;
  const progress = minted !== null && max !== null && max > 0 ? (minted / max) * 100 : 0;

  const mintedTokenIds = useMemo(() => {
    if (!minted || minted <= 0) return [];
    return Array.from({ length: minted }, (_, i) => i + 1);
  }, [minted]);

  const minting = isMintPending || isConfirming;
  const soldOut = minted !== null && max !== null && minted >= max;

  const priceLabel =
    mintPrice !== undefined
      ? mintPrice === 0n
        ? "Miễn phí (testnet)"
        : `${formatEther(mintPrice)} ETH`
      : "—";

  const handleMint = () => {
    if (!contractConfigured) {
      setStatus({
        type: "error",
        text: "Chưa cấu hình VITE_CONTRACT_ADDRESS trong dapp/.env",
      });
      return;
    }
    if (!isConnected) {
      setStatus({ type: "error", text: "Vui lòng kết nối ví trước." });
      return;
    }
    if (chain?.id !== SEPOLIA_CHAIN_ID) {
      setStatus({ type: "error", text: "Vui lòng chuyển sang mạng Sepolia." });
      return;
    }

    resetWrite();
    setStatus({ type: "info", text: "Chờ xác nhận trên ví..." });

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: WORKSHOP_NFT_ABI,
      functionName: "mint",
      value: mintPrice ?? 0n,
      chainId: sepolia.id,
    });
  };

  useEffect(() => {
    if (writeError) {
      setStatus({
        type: "error",
        text: writeError.shortMessage || writeError.message || "Mint thất bại.",
      });
    }
  }, [writeError]);

  useEffect(() => {
    if (isConfirmed && txHash && minted !== null) {
      const tokenId = minted + 1;

      setStatus({
        type: "success",
        text: (
          <>
            Mint thành công! Token #{tokenId}.{" "}
            <a href={getEtherscanTxUrl(txHash)} target="_blank" rel="noreferrer">
              Tx
            </a>
            {" · "}
            <a
              href={getEtherscanNftUrl(CONTRACT_ADDRESS, tokenId)}
              target="_blank"
              rel="noreferrer"
            >
              Etherscan
            </a>
            {" · "}
            <a href={getIpfsMetadataUrl(tokenId)} target="_blank" rel="noreferrer">
              Metadata
            </a>
          </>
        ),
      });

      refetchSupply();
      refetchBalance();
    }
  }, [isConfirmed, txHash, minted, refetchSupply, refetchBalance]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <span className="badge">Sepolia Testnet</span>
          <ConnectButton
            showBalance={{ smallScreen: false, largeScreen: true }}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
        <h1>Workshop NFT Mint</h1>
        <p className="subtitle">Mint ERC-721 collection từ smart contract của bạn</p>
      </header>

      {isConnected && chain?.id !== SEPOLIA_CHAIN_ID && (
        <div className="message error network-warning">
          Ví đang ở mạng khác. Hãy chuyển sang <strong>Sepolia</strong> qua nút Connect ở góc trên.
        </div>
      )}

      <div className="card">
        <h2>Ví</h2>
        <div className="wallet-row">
          {isConnected && address ? (
            <span className="address" title={address}>
              {shortenAddress(address)}
            </span>
          ) : (
            <span className="address">Chưa kết nối — bấm Connect Wallet</span>
          )}
          <span className="wallet-hint">MetaMask · Rainbow · WalletConnect</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2>Supply</h2>
          {contractConfigured && (
            <a
              className="explorer-badge"
              href={getEtherscanNftUrl(CONTRACT_ADDRESS, minted || 1)}
              target="_blank"
              rel="noreferrer"
            >
              Etherscan ↗
            </a>
          )}
        </div>

        <div className="stats stats-3">
          <div className="stat">
            <div className="stat-value">{max ?? "—"}</div>
            <div className="stat-label">Max Supply</div>
          </div>
          <div className="stat stat-highlight">
            <div className="stat-value">{minted ?? "—"}</div>
            <div className="stat-label">Đã mint</div>
          </div>
          <div className="stat">
            <div className="stat-value">{remaining ?? "—"}</div>
            <div className="stat-label">Còn lại</div>
          </div>
        </div>

        {minted !== null && max !== null && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">
              {minted} / {max} NFT ({progress.toFixed(1)}%)
            </span>
          </div>
        )}

        <div className="stat-row-inline">
          <span className="stat-inline-label">NFT của bạn</span>
          <span className="stat-inline-value">
            {myBalance !== undefined ? Number(myBalance) : isConnected ? "—" : "Kết nối ví"}
          </span>
        </div>
      </div>

      {contractConfigured && (
        <div className="card">
          <h2>Xem NFT trên Testnet</h2>
          <p className="explorer-desc">
            OpenSea testnet đã ngừng hỗ trợ (07/2025). Dùng Etherscan và IPFS để xem NFT.
          </p>

          <div className="explorer-links">
            {EXPLORER_LINKS.map((link) => (
              <a
                key={link.id}
                className={`explorer-link ${link.primary ? "explorer-link-primary" : ""}`}
                href={link.getUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noreferrer"
              >
                <span className="explorer-link-label">{link.label}</span>
                <span className="explorer-link-desc">{link.description}</span>
              </a>
            ))}
          </div>

          <p className="base-uri-hint">
            <strong>baseURI khuyến nghị:</strong>{" "}
            <code>{getRecommendedBaseUri()}</code>
          </p>

          {mintedTokenIds.length > 0 ? (
            <div className="token-list">
              <p className="token-list-title">NFT đã mint ({mintedTokenIds.length})</p>
              <div className="token-rows">
                {mintedTokenIds.map((id) => (
                  <div key={id} className="token-row">
                    <span className="token-id">#{id}</span>
                    <div className="token-actions">
                      <a
                        className="token-chip token-chip-etherscan"
                        href={getEtherscanNftUrl(CONTRACT_ADDRESS, id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Etherscan
                      </a>
                      <a
                        className="token-chip token-chip-ipfs"
                        href={getIpfsMetadataUrl(id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Metadata
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="token-empty">Chưa có NFT nào được mint. Hãy mint đầu tiên!</p>
          )}
        </div>
      )}

      <div className="card mint-section">
        <h2>Mint</h2>
        <p className="price-note">Giá mint: {priceLabel}</p>
        <button
          className="btn btn-primary"
          onClick={handleMint}
          disabled={
            !isConnected ||
            chain?.id !== SEPOLIA_CHAIN_ID ||
            minting ||
            soldOut ||
            !contractConfigured
          }
        >
          {minting ? (
            <>
              <span className="spinner" /> Đang mint...
            </>
          ) : soldOut ? (
            "Hết supply"
          ) : (
            "Mint NFT"
          )}
        </button>
        {status.text && (
          <div className={`message ${status.type}`}>{status.text}</div>
        )}
      </div>

      {contractConfigured && (
        <p className="contract-link">
          IPFS CID:{" "}
          <a
            href={getIpfsMetadataUrl(1).replace("/1.json", "/")}
            target="_blank"
            rel="noreferrer"
            title={IPFS_METADATA_CID}
          >
            {IPFS_METADATA_CID.slice(0, 10)}...
          </a>
        </p>
      )}
    </div>
  );
}
