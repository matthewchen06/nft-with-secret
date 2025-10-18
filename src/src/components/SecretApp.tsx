import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { MintForm } from './mint/MintForm';
import { TokenList } from './tokens/TokenList';
import { TokenDetails } from './tokens/TokenDetails';
import '../styles/SecretApp.css';

type SecretToken = {
  tokenId: bigint;
  owner: string;
  encryptedNote: string;
  encryptedController: string;
  decryptedController?: string;
  decryptedNote?: string;
};

function deriveKeyBytes(address: string) {
  const checksum = ethers.getAddress(address);
  const hashed = ethers.keccak256(ethers.toUtf8Bytes(checksum.toLowerCase()));
  return ethers.getBytes(hashed);
}

function encryptNote(note: string, controllerAddress: string) {
  const key = deriveKeyBytes(controllerAddress);
  const source = new TextEncoder().encode(note);
  const output = source.map((value, index) => value ^ key[index % key.length]);
  return ethers.hexlify(output);
}

function decryptNote(encryptedNote: string, controllerAddress: string) {
  if (!encryptedNote || encryptedNote === '0x') {
    return '';
  }
  const key = deriveKeyBytes(controllerAddress);
  const payload = ethers.getBytes(encryptedNote);
  const decoded = payload.map((value, index) => value ^ key[index % key.length]);
  return new TextDecoder().decode(new Uint8Array(decoded));
}

export function SecretApp() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: isZamaLoading, error: zamaError } = useZamaInstance();

  const [tokens, setTokens] = useState<SecretToken[]>([]);
  const tokensRef = useRef<SecretToken[]>([]);
  const selectedTokenRef = useRef<bigint | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isUpdatingController, setIsUpdatingController] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const connectedAddress = useMemo(() => (address ? ethers.getAddress(address) : undefined), [address]);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    selectedTokenRef.current = selectedTokenId;
  }, [selectedTokenId]);

  const refreshTokens = useCallback(async () => {
    if (!publicClient || !connectedAddress) {
      setTokens([]);
      setSelectedTokenId(null);
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const ownedTokenIds = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'tokensOfOwner',
        args: [connectedAddress as `0x${string}`],
      })) as readonly bigint[];

      const sortedTokenIds = Array.from(ownedTokenIds).sort((a, b) => Number(a - b));

      const fetchedTokens: SecretToken[] = await Promise.all(
        sortedTokenIds.map(async (tokenId) => {
          const [encryptedNote, encryptedController] = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getEncryptedData',
            args: [tokenId],
          });

          const existing = tokensRef.current.find((token) => token.tokenId === tokenId);

          return {
            tokenId,
            owner: connectedAddress,
            encryptedNote: encryptedNote as string,
            encryptedController: encryptedController as string,
            decryptedController: existing?.decryptedController,
            decryptedNote: existing?.decryptedNote,
          };
        })
      );

      setTokens(fetchedTokens);
      const currentSelected = selectedTokenRef.current;

      if (fetchedTokens.length === 0) {
        setSelectedTokenId(null);
      } else if (!currentSelected || !fetchedTokens.some((token) => token.tokenId === currentSelected)) {
        setSelectedTokenId(fetchedTokens[0].tokenId);
      }
    } catch (err) {
      console.error('Failed to load tokens', err);
      setError('Unable to load your NFTs. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [publicClient, connectedAddress]);

  useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  const decryptToken = useCallback(
    async (tokenId: bigint) => {
      if (!instance) {
        setError('Encryption service is not ready yet.');
        return;
      }

      const signer = await signerPromise;
      if (!signer || !connectedAddress) {
        setError('Connect a wallet to decrypt data.');
        return;
      }

      const token = tokens.find((item) => item.tokenId === tokenId);
      if (!token) {
        return;
      }

      setIsDecrypting(true);
      setError(null);

      try {
        const keypair = instance.generateKeypair();
        const handles = [
          {
            handle: token.encryptedController,
            contractAddress: CONTRACT_ADDRESS,
          },
        ];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '7';
        const contractAddresses = [CONTRACT_ADDRESS];

        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays,
        );

        const signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message,
        );

        const result = await instance.userDecrypt(
          handles,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          connectedAddress,
          startTimestamp,
          durationDays,
        );

        const decryptedController = result[token.encryptedController];
        if (typeof decryptedController !== 'string') {
          throw new Error('Unexpected decryption response');
        }

        const decryptedNote = decryptNote(token.encryptedNote, decryptedController);

        setTokens((prev) =>
          prev.map((item) =>
            item.tokenId === tokenId
              ? {
                  ...item,
                  decryptedController,
                  decryptedNote,
                }
              : item,
          ),
        );
        setFeedback('Controller address decrypted successfully.');
      } catch (err) {
        console.error('Decrypt error', err);
        setError('Failed to decrypt controller. Ensure you have access and try again.');
      } finally {
        setIsDecrypting(false);
      }
    },
    [instance, signerPromise, connectedAddress, tokens],
  );

  const handleMint = useCallback(
    async (note: string, controllerInput: string, recipient?: string) => {
      if (!instance) {
        setError('Encryption service is not ready yet.');
        return;
      }

      const signer = await signerPromise;
      if (!signer || !connectedAddress) {
        setError('Connect a wallet before minting.');
        return;
      }

      try {
        setIsMinting(true);
        setError(null);

        const controllerAddress = ethers.getAddress(controllerInput);
        const recipientAddress = recipient ? ethers.getAddress(recipient) : connectedAddress;

        const encryptedNote = encryptNote(note, controllerAddress);

        const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, connectedAddress);
        buffer.addAddress(controllerAddress);
        const encrypted = await buffer.encrypt();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const handleHex = ethers.hexlify(encrypted.handles[0]);
        const proofHex = ethers.hexlify(encrypted.inputProof);

        await contract.mint(recipientAddress, encryptedNote, handleHex, proofHex);
        setFeedback('Mint transaction submitted. Waiting for confirmation...');
        await refreshTokens();
      } catch (err) {
        console.error('Mint error', err);
        setError('Minting failed. Please confirm the details and try again.');
      } finally {
        setIsMinting(false);
      }
    },
    [instance, signerPromise, connectedAddress, refreshTokens],
  );

  const handleUpdateNote = useCallback(
    async (tokenId: bigint, note: string) => {
      const signer = await signerPromise;
      if (!signer) {
        setError('Connect a wallet before updating the note.');
        return;
      }

      const token = tokens.find((item) => item.tokenId === tokenId);
      if (!token?.decryptedController) {
        setError('Decrypt the controller before updating the note.');
        return;
      }

      try {
        setIsUpdatingNote(true);
        setError(null);

        const encryptedNote = encryptNote(note, token.decryptedController);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        await contract.updateEncryptedNote(tokenId, encryptedNote);

        setTokens((prev) =>
          prev.map((item) =>
            item.tokenId === tokenId
              ? {
                  ...item,
                  encryptedNote,
                  decryptedNote: note,
                }
              : item,
          ),
        );
        setFeedback('Encrypted note updated.');
      } catch (err) {
        console.error('Update note error', err);
        setError('Failed to update the note.');
      } finally {
        setIsUpdatingNote(false);
      }
    },
    [signerPromise, tokens],
  );

  const handleUpdateController = useCallback(
    async (tokenId: bigint, newController: string) => {
      if (!instance) {
        setError('Encryption service is not ready yet.');
        return;
      }

      const signer = await signerPromise;
      if (!signer || !connectedAddress) {
        setError('Connect a wallet before updating the controller.');
        return;
      }

      try {
        setIsUpdatingController(true);
        setError(null);

        const controllerAddress = ethers.getAddress(newController);
        const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, connectedAddress);
        buffer.addAddress(controllerAddress);
        const encrypted = await buffer.encrypt();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const handleHex = ethers.hexlify(encrypted.handles[0]);
        const proofHex = ethers.hexlify(encrypted.inputProof);

        await contract.updateEncryptedController(tokenId, handleHex, proofHex);

        setFeedback('Controller updated.');
      } catch (err) {
        console.error('Update controller error', err);
        setError('Failed to update the controller address.');
      } finally {
        setIsUpdatingController(false);
        refreshTokens();
      }
    },
    [instance, signerPromise, connectedAddress, refreshTokens],
  );

  const selectedToken = useMemo(
    () => (selectedTokenId !== null ? tokens.find((token) => token.tokenId === selectedTokenId) : undefined),
    [tokens, selectedTokenId],
  );

  return (
    <div className="secret-app">
      <div className="secret-layout">
        {(feedback || error || zamaError) && (
          <div className="secret-alerts">
            {feedback && <div className="secret-alert success">{feedback}</div>}
            {(error || zamaError) && <div className="secret-alert error">{error ?? zamaError}</div>}
          </div>
        )}

        <div className="secret-grid">
          <aside className="secret-sidebar">
            <MintForm
              onMint={handleMint}
              defaultRecipient={connectedAddress}
              isLoading={isMinting || isZamaLoading}
            />

            <TokenList
              tokens={tokens}
              selectedTokenId={selectedTokenId}
              onSelect={setSelectedTokenId}
              onRefresh={refreshTokens}
              isRefreshing={isRefreshing}
            />
          </aside>

          <main className="secret-main">
            <TokenDetails
              account={connectedAddress}
              token={selectedToken}
              onDecrypt={selectedToken ? () => decryptToken(selectedToken.tokenId) : undefined}
              onUpdateNote={selectedToken ? (note) => handleUpdateNote(selectedToken.tokenId, note) : undefined}
              onUpdateController={
                selectedToken ? (controller) => handleUpdateController(selectedToken.tokenId, controller) : undefined
              }
              isDecrypting={isDecrypting}
              isZamaLoading={isZamaLoading}
              isUpdatingNote={isUpdatingNote}
              isUpdatingController={isUpdatingController}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
