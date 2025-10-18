import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div>
              <h1 className="header-title">Secret NFT Vault</h1>
              <p className="header-subtitle">Manage encrypted notes attached to ERC721 tokens.</p>
            </div>
            <span className="header-badge">Zama FHE</span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
