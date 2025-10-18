import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const walletConnectId = 'id';

export const config = getDefaultConfig({
  appName: 'Secret NFT Vault',
  projectId: walletConnectId,
  chains: [sepolia],
  ssr: false,
});
