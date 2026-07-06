import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { WORKSHOP_NFT_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_NETWORK } from "./config";
import "./App.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || SEPOLIA_CHAIN_ID);

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [totalSupply, setTotalSupply] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);
  const [mintPrice, setMintPrice] = useState(null);
  const [myBalance, setMyBalance] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  const refreshStats = useCallback(async (c) => {
    if (!c) return;
    try {
      const [supply, max, price, balance] = await Promise.all([
        c.totalSupply(),
        c.maxSupply(),
        c.mintPrice(),
        account ? c.balanceOf(account) : Promise.resolve(0n),
      ]);
      setTotalSupply(Number(supply));
      setMaxSupply(Number(max));
      setMintPrice(price);
      setMyBalance(Number(balance));
    } catch (err) {
      console.error(err);
    }
  }, [account]);

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_NETWORK],
        });
      } else {
        throw switchError;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus({ type: "error", text: "Cài MetaMask để tiếp tục." });
      return;
    }
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.includes("YOUR")) {
      setStatus({
        type: "error",
        text: "Chưa cấu hình VITE_CONTRACT_ADDRESS trong dapp/.env",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", text: "Đang kết nối ví..." });

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();

      if (Number(network.chainId) !== CHAIN_ID) {
        await switchToSepolia();
      }

      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const addr = await signer.getAddress();
      const nftContract = new Contract(CONTRACT_ADDRESS, WORKSHOP_NFT_ABI, signer);

      setProvider(browserProvider);
      setContract(nftContract);
      setAccount(addr);
      setStatus({ type: "success", text: "Đã kết nối ví Sepolia." });
      await refreshStats(nftContract);
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Kết nối thất bại." });
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!contract || !mintPrice) return;

    setMinting(true);
    setStatus({ type: "info", text: "Chờ xác nhận trên MetaMask..." });

    try {
      const tx = await contract.mint({ value: mintPrice });
      setStatus({ type: "info", text: "Đang gửi giao dịch..." });
      const receipt = await tx.wait();

      const tokenId = totalSupply + 1;
      const explorerTx = `https://sepolia.etherscan.io/tx/${receipt.hash}`;
      const openSea = `https://testnets.opensea.io/assets/sepolia/${CONTRACT_ADDRESS}/${tokenId}`;

      setStatus({
        type: "success",
        text: (
          <>
            Mint thành công! Token #{tokenId}.{" "}
            <a href={explorerTx} target="_blank" rel="noreferrer">
              Etherscan
            </a>
            {" · "}
            <a href={openSea} target="_blank" rel="noreferrer">
              OpenSea
            </a>
          </>
        ),
      });
      await refreshStats(contract);
    } catch (err) {
      const msg =
        err.reason || err.shortMessage || err.message || "Mint thất bại.";
      setStatus({ type: "error", text: msg });
    } finally {
      setMinting(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setContract(null);
        setProvider(null);
      } else {
        connectWallet();
      }
    };

    const onChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  const soldOut = totalSupply !== null && maxSupply !== null && totalSupply >= maxSupply;
  const priceLabel =
    mintPrice !== null
      ? mintPrice === 0n
        ? "Miễn phí (testnet)"
        : `${formatEther(mintPrice)} ETH`
      : "—";

  return (
    <div className="app">
      <header className="header">
        <span className="badge">Sepolia Testnet</span>
        <h1>Workshop NFT Mint</h1>
        <p className="subtitle">Mint ERC-721 collection từ smart contract của bạn</p>
      </header>

      <div className="card">
        <h2>Ví</h2>
        <div className="wallet-row">
          {account ? (
            <span className="address" title={account}>
              {shortenAddress(account)}
            </span>
          ) : (
            <span className="address">Chưa kết nối</span>
          )}
          <button
            className="btn btn-outline"
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : account ? "Đã kết nối" : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Collection</h2>
        <div className="stats">
          <div className="stat">
            <div className="stat-value">
              {totalSupply !== null ? totalSupply : "—"}
              {maxSupply !== null && (
                <span style={{ color: "var(--muted)", fontSize: "1rem" }}>
                  {" "}
                  / {maxSupply}
                </span>
              )}
            </div>
            <div className="stat-label">Đã mint</div>
          </div>
          <div className="stat">
            <div className="stat-value">{myBalance !== null ? myBalance : "—"}</div>
            <div className="stat-label">NFT của bạn</div>
          </div>
        </div>
      </div>

      <div className="card mint-section">
        <h2>Mint</h2>
        <p className="price-note">Giá mint: {priceLabel}</p>
        <button
          className="btn btn-primary"
          onClick={handleMint}
          disabled={!account || minting || soldOut || !contract}
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

      {CONTRACT_ADDRESS && !CONTRACT_ADDRESS.includes("YOUR") && (
        <p className="contract-link">
          Contract:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {shortenAddress(CONTRACT_ADDRESS)}
          </a>
        </p>
      )}
    </div>
  );
}
