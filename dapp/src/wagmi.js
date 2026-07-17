import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "Thiếu VITE_WALLETCONNECT_PROJECT_ID — lấy miễn phí tại https://cloud.walletconnect.com"
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Workshop NFT Mint",
  projectId: projectId || "00000000000000000000000000000000",
  chains: [sepolia],
  ssr: false,
});
