import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const walletConnectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '';

export const config = getDefaultConfig({
  appName: 'Secret NFT Vault',
  projectId: walletConnectId,
  chains: [sepolia],
  ssr: false,
});
