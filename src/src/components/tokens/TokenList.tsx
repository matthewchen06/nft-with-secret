import '../../styles/SecretApp.css';

type TokenListProps = {
  tokens: Array<{ tokenId: bigint; decryptedNote?: string }>;
  selectedTokenId: bigint | null;
  isRefreshing: boolean;
  onSelect: (tokenId: bigint) => void;
  onRefresh: () => void;
};

export function TokenList({ tokens, selectedTokenId, isRefreshing, onSelect, onRefresh }: TokenListProps) {
  return (
    <section className="secret-card">
      <div className="secret-card-header">
        <h2 className="secret-card-title">Your NFTs</h2>
        <button className="secret-button ghost" type="button" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {tokens.length === 0 ? (
        <p className="secret-card-empty">No NFTs found for the connected wallet.</p>
      ) : (
        <ul className="secret-token-list">
          {tokens.map((token) => {
            const tokenId = token.tokenId;
            const isActive = selectedTokenId === tokenId;
            return (
              <li key={tokenId.toString()}>
                <button
                  type="button"
                  className={`secret-token-item${isActive ? ' active' : ''}`}
                  onClick={() => onSelect(tokenId)}
                >
                  <span className="secret-token-title">Token #{tokenId.toString()}</span>
                  {token.decryptedNote && (
                    <span className="secret-token-note">Decrypted note available</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
