import { useEffect, useMemo, useState } from 'react';
import '../../styles/SecretApp.css';

type MintFormProps = {
  defaultRecipient?: string;
  isLoading: boolean;
  onMint: (note: string, controller: string, recipient?: string) => Promise<void> | void;
};

export function MintForm({ defaultRecipient, isLoading, onMint }: MintFormProps) {
  const [note, setNote] = useState('');
  const [controller, setController] = useState('');
  const [recipient, setRecipient] = useState(defaultRecipient ?? '');

  useEffect(() => {
    if (defaultRecipient) {
      setRecipient(defaultRecipient);
    }
  }, [defaultRecipient]);

  const isValid = useMemo(() => note.trim().length > 0 && controller.trim().length > 0, [note, controller]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isLoading) {
      return;
    }
    await onMint(note.trim(), controller.trim(), recipient ? recipient.trim() : undefined);
    setNote('');
  };

  return (
    <section className="secret-card">
      <h2 className="secret-card-title">Mint Secret NFT</h2>
      <p className="secret-card-description">
        Attach an encrypted note to a new NFT. The controller address defines who can decrypt the note once they have
        the ciphertext handle.
      </p>

      <form className="secret-form" onSubmit={handleSubmit}>
        <label className="secret-label">
          Controller address
          <input
            className="secret-input"
            placeholder="0x..."
            value={controller}
            onChange={(event) => setController(event.target.value)}
          />
        </label>

        <label className="secret-label">
          Encrypted note (plaintext before encryption)
          <textarea
            className="secret-textarea"
            rows={4}
            placeholder="Write the note you want to protect"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <label className="secret-label">
          Recipient (optional)
          <input
            className="secret-input"
            placeholder={defaultRecipient ?? '0x...'}
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </label>

        <button className="secret-button primary" type="submit" disabled={!isValid || isLoading}>
          {isLoading ? 'Encrypting...' : 'Mint NFT'}
        </button>
      </form>
    </section>
  );
}
