import { useEffect, useMemo, useState } from 'react';
import '../../styles/SecretApp.css';

type TokenDetailsProps = {
  account?: string;
  token?: {
    tokenId: bigint;
    encryptedNote: string;
    encryptedController: string;
    decryptedController?: string;
    decryptedNote?: string;
  };
  onDecrypt?: () => Promise<void> | void;
  onUpdateNote?: (note: string) => Promise<void> | void;
  onUpdateController?: (controller: string) => Promise<void> | void;
  isDecrypting: boolean;
  isZamaLoading: boolean;
  isUpdatingNote: boolean;
  isUpdatingController: boolean;
};

export function TokenDetails({
  account,
  token,
  onDecrypt,
  onUpdateNote,
  onUpdateController,
  isDecrypting,
  isZamaLoading,
  isUpdatingNote,
  isUpdatingController,
}: TokenDetailsProps) {
  const [noteInput, setNoteInput] = useState('');
  const [controllerInput, setControllerInput] = useState('');

  useEffect(() => {
    setNoteInput('');
    setControllerInput('');
  }, [token?.tokenId]);

  const disabledDecrypt = useMemo(() => !onDecrypt || isDecrypting || isZamaLoading, [onDecrypt, isDecrypting, isZamaLoading]);
  const canUpdateNote = useMemo(
    () => !!token?.decryptedController && !!onUpdateNote && noteInput.trim().length > 0 && !isUpdatingNote,
    [token, onUpdateNote, noteInput, isUpdatingNote],
  );
  const canUpdateController = useMemo(
    () => !!onUpdateController && controllerInput.trim().length > 0 && !isUpdatingController,
    [onUpdateController, controllerInput, isUpdatingController],
  );

  if (!account) {
    return (
      <section className="secret-card">
        <h2 className="secret-card-title">Connect a wallet</h2>
        <p className="secret-card-description">Use the connect button to manage your encrypted NFTs.</p>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="secret-card">
        <h2 className="secret-card-title">No NFT selected</h2>
        <p className="secret-card-description">Select one of your NFTs to view encryption details.</p>
      </section>
    );
  }

  return (
    <section className="secret-card">
      <h2 className="secret-card-title">Token #{token.tokenId.toString()}</h2>
      <div className="secret-token-meta">
        <div>
          <span className="secret-meta-label">Encrypted note</span>
          <code className="secret-meta-value">{token.encryptedNote || '0x'}</code>
        </div>
        <div>
          <span className="secret-meta-label">Encrypted controller</span>
          <code className="secret-meta-value">{token.encryptedController}</code>
        </div>
      </div>

      <button className="secret-button secondary" type="button" disabled={disabledDecrypt} onClick={onDecrypt}>
        {isDecrypting || isZamaLoading ? 'Decrypting...' : 'Decrypt controller'}
      </button>

      {token.decryptedController && (
        <div className="secret-decrypted-block">
          <div>
            <span className="secret-meta-label">Controller</span>
            <code className="secret-meta-value accent">{token.decryptedController}</code>
          </div>
          <div>
            <span className="secret-meta-label">Decrypted note</span>
            <p className="secret-note-text">{token.decryptedNote ?? 'Note encrypted with current controller key.'}</p>
          </div>
        </div>
      )}

      <form
        className="secret-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canUpdateNote || !onUpdateNote) {
            return;
          }
          await onUpdateNote(noteInput.trim());
          setNoteInput('');
        }}
      >
        <h3 className="secret-form-title">Update encrypted note</h3>
        <textarea
          className="secret-textarea"
          rows={3}
          placeholder={token.decryptedController ? 'Enter the new note' : 'Decrypt controller before updating'}
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
          disabled={!token.decryptedController}
        />
        <button className="secret-button primary" type="submit" disabled={!canUpdateNote}>
          {isUpdatingNote ? 'Updating...' : 'Save note'}
        </button>
      </form>

      <form
        className="secret-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canUpdateController || !onUpdateController) {
            return;
          }
          await onUpdateController(controllerInput.trim());
          setControllerInput('');
        }}
      >
        <h3 className="secret-form-title">Update controller address</h3>
        <input
          className="secret-input"
          placeholder="0x..."
          value={controllerInput}
          onChange={(event) => setControllerInput(event.target.value)}
        />
        <button className="secret-button secondary" type="submit" disabled={!canUpdateController}>
          {isUpdatingController ? 'Encrypting...' : 'Save controller'}
        </button>
      </form>
    </section>
  );
}
