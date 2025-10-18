# SecretNFT - Privacy-Preserving NFT with Fully Homomorphic Encryption

![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)
![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)
![FHEVM](https://img.shields.io/badge/Powered%20by-FHEVM-blueviolet)

A cutting-edge ERC721 NFT implementation that leverages Fully Homomorphic Encryption (FHE) to enable on-chain storage of encrypted secrets, private notes, and confidential controller addresses. Built on Zama's FHEVM protocol, this project demonstrates how blockchain can achieve true privacy without sacrificing transparency and decentralization.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Why SecretNFT?](#why-secretnft)
- [Technical Architecture](#technical-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Usage](#usage)
  - [Smart Contract Deployment](#smart-contract-deployment)
  - [Frontend Application](#frontend-application)
  - [Testing](#testing)
- [Smart Contract Features](#smart-contract-features)
- [Frontend Features](#frontend-features)
- [Problem Statement](#problem-statement)
- [Solution & Innovation](#solution--innovation)
- [Use Cases](#use-cases)
- [Security Considerations](#security-considerations)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support & Community](#support--community)

## Overview

**SecretNFT** is a revolutionary ERC721 NFT implementation that allows users to mint, own, and transfer NFTs containing encrypted secrets. Each NFT can store:

- **Encrypted Notes**: Private messages or data encrypted using a controller address as the key
- **Encrypted Controller Address**: A fully homomorphically encrypted Ethereum address that determines who can decrypt the note
- **Transfer Capability**: Standard ERC721 transfer mechanics with automatic access management

The project consists of two main components:

1. **Smart Contract**: Solidity-based ERC721 contract with FHEVM integration for on-chain encrypted data storage
2. **Web Frontend**: React-based dApp with wallet integration and encryption/decryption capabilities

## Key Features

### Smart Contract Features

- **ERC721 Compliance**: Full support for the ERC721 standard with extended privacy features
- **Homomorphic Encryption**: Utilizes Zama's FHEVM for encrypted address storage and computation
- **Encrypted Notes**: Store arbitrary encrypted data on-chain (encrypted off-chain with XOR cipher)
- **Encrypted Controllers**: Store controller addresses using FHE, enabling private access control
- **Dynamic Access Control**: Automatic permission grants when NFTs are transferred
- **Update Capabilities**: Token owners can update both encrypted notes and controller addresses
- **Gas Optimized**: Efficient storage patterns and unchecked arithmetic where safe

### Frontend Features

- **Wallet Integration**: Seamless connection via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- **NFT Minting**: Intuitive interface for creating NFTs with encrypted secrets
- **Token Management**: View, select, and manage all owned NFTs
- **Decryption Interface**: Decrypt controller addresses using FHEVM relayer
- **Note Management**: Update encrypted notes with automatic re-encryption
- **Controller Updates**: Change the controller address with proper encryption
- **Real-time State**: Live updates when tokens are minted or transferred
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## Why SecretNFT?

### The Privacy Problem in Blockchain

Traditional blockchains are transparent by design. While this ensures trustlessness and verifiability, it creates a fundamental problem: **all data on-chain is publicly visible**. This limitation prevents many real-world use cases from being implemented on-chain:

- Private credentials and certificates
- Confidential documents
- Secret sharing mechanisms
- Private voting systems
- Encrypted communication channels
- Confidential business data

### Existing Solutions and Their Limitations

1. **Off-chain Storage**: Store secrets off-chain and only keep hashes on-chain
   - **Limitation**: Centralization, availability issues, trust assumptions

2. **Zero-Knowledge Proofs**: Prove knowledge without revealing data
   - **Limitation**: Cannot perform computations on encrypted data, complex circuits

3. **Multi-Party Computation**: Distributed computation across parties
   - **Limitation**: Requires coordination, limited scalability

4. **Traditional Encryption**: Encrypt data before storing on-chain
   - **Limitation**: Cannot perform on-chain access control or computation

## Solution & Innovation

SecretNFT leverages **Fully Homomorphic Encryption (FHE)** to solve these problems:

### What Makes FHE Special?

FHE allows computation on encrypted data without decrypting it. This means:

- **On-chain Privacy**: Store encrypted data on-chain while maintaining computation capabilities
- **Programmable Privacy**: Smart contracts can perform logic on encrypted values
- **No Trusted Setup**: Unlike zkSNARKs, FHE doesn't require trusted setup ceremonies
- **Universal Computation**: Supports arbitrary computations on encrypted data

### How SecretNFT Works

1. **Dual Encryption Approach**:
   - **Notes**: Encrypted off-chain using XOR cipher with controller address as key (gas efficient)
   - **Controller Address**: Encrypted using FHEVM (enables on-chain access control)

2. **Access Control Flow**:
   ```
   Mint → Encrypt Controller → Store on-chain → Transfer NFT → Auto-grant Access → Decrypt
   ```

3. **Privacy Guarantees**:
   - Controller addresses are never revealed on-chain
   - Notes are encrypted and can only be decrypted by knowing the controller address
   - Even contract operators cannot decrypt without proper access

## Technical Architecture

### Encryption Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         SecretNFT Token                         │
├─────────────────────────────────────────────────────────────────┤
│  Token ID: uint256                                              │
│  Owner: address (public)                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Encrypted Note (off-chain XOR encryption)              │   │
│  │ - Uses controller address as key                       │   │
│  │ - Gas efficient storage                                │   │
│  │ - Stored as hex string                                 │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Encrypted Controller (FHEVM eaddress)                  │   │
│  │ - Fully homomorphically encrypted                      │   │
│  │ - Access control managed by FHEVM                      │   │
│  │ - Only accessible by authorized addresses              │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Contract Interaction Flow

```
┌──────────┐         ┌─────────────┐        ┌──────────────┐
│  User    │         │   Frontend  │        │   Contract   │
└────┬─────┘         └──────┬──────┘        └──────┬───────┘
     │                      │                      │
     │  1. Connect Wallet   │                      │
     ├─────────────────────>│                      │
     │                      │                      │
     │  2. Create NFT       │                      │
     ├─────────────────────>│                      │
     │                      │                      │
     │                      │  3. Encrypt Note     │
     │                      │  (XOR with controller)│
     │                      │                      │
     │                      │  4. Encrypt Address  │
     │                      │  (FHEVM)            │
     │                      │                      │
     │                      │  5. mint()          │
     │                      ├─────────────────────>│
     │                      │                      │
     │                      │  6. Store encrypted  │
     │                      │     data + grant     │
     │                      │     access           │
     │                      │                      │
     │                      │  7. Emit events     │
     │                      │<─────────────────────┤
     │                      │                      │
     │  8. Decrypt Request  │                      │
     ├─────────────────────>│                      │
     │                      │                      │
     │                      │  9. Request decrypt  │
     │                      │     via FHEVM relayer│
     │                      │                      │
     │  10. Decrypted Data  │                      │
     │<─────────────────────┤                      │
```

## Technology Stack

### Smart Contract Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | ^0.8.24 | Smart contract programming language |
| **FHEVM** | ^0.8.0 | Fully Homomorphic Encryption library by Zama |
| **OpenZeppelin** | ^5.0.2 | Secure smart contract standards (ERC721, Ownable) |
| **Hardhat** | ^2.26.0 | Development environment and testing framework |
| **TypeScript** | ^5.8.3 | Type-safe scripting for deployment and tasks |
| **Ethers.js** | ^6.15.0 | Ethereum library for contract interaction |

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.1.1 | UI framework |
| **TypeScript** | ~5.8.3 | Type-safe frontend development |
| **Vite** | ^7.1.6 | Fast build tool and dev server |
| **Wagmi** | ^2.17.0 | React Hooks for Ethereum |
| **RainbowKit** | ^2.2.8 | Wallet connection interface |
| **Ethers.js** | ^6.15.0 | Ethereum JavaScript library |
| **TanStack Query** | ^5.89.0 | Data synchronization and caching |
| **Zama FHE Relayer SDK** | ^0.2.0 | Client-side FHE operations and decryption |

### Development Tools

- **TypeChain**: Generate TypeScript bindings for smart contracts
- **Hardhat Deploy**: Declarative deployment system
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Solhint**: Solidity linter
- **Mocha + Chai**: Testing framework

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For cloning the repository
- **MetaMask or compatible Web3 wallet**: For frontend interaction
- **Sepolia ETH**: For testnet deployment and testing

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/nft-with-secret.git
   cd nft-with-secret
   ```

2. **Install contract dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd src
   npm install
   cd ..
   ```

### Environment Configuration

1. **Create environment file**

   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**

   Edit `.env` with your values:

   ```env
   # Required for deployment
   PRIVATE_KEY=your_wallet_private_key_here
   INFURA_API_KEY=your_infura_api_key

   # Optional for contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key

   # Development mnemonic (for local testing)
   MNEMONIC="test test test test test test test test test test test junk"
   ```

   **Security Note**: Never commit your `.env` file or share private keys!

3. **Alternative: Use Hardhat vars (recommended)**

   ```bash
   npx hardhat vars set PRIVATE_KEY
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

## Usage

### Smart Contract Deployment

#### Local Development

1. **Start a local Hardhat node**

   ```bash
   npm run chain
   ```

2. **Deploy to local network** (in another terminal)

   ```bash
   npm run deploy:localhost
   ```

#### Sepolia Testnet Deployment

1. **Ensure you have Sepolia ETH** in your wallet

2. **Deploy to Sepolia**

   ```bash
   npm run deploy:sepolia
   ```

3. **Verify the contract** (optional but recommended)

   ```bash
   npm run verify:sepolia
   ```

   The deployed contract address will be saved in `deployments/sepolia/SecretNFT.json`

### Frontend Application

1. **Update contract configuration**

   After deployment, update `src/src/config/contracts.ts` with your deployed contract address:

   ```typescript
   export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
   ```

2. **Start the development server**

   ```bash
   cd src
   npm run dev
   ```

3. **Open in browser**

   Navigate to `http://localhost:5173`

4. **Connect your wallet**

   Click "Connect Wallet" and select your preferred wallet provider

5. **Mint your first SecretNFT**

   - Enter a secret note
   - Specify a controller address (defaults to your address)
   - Optional: Set a different recipient address
   - Click "Mint Secret NFT"

### Testing

#### Smart Contract Tests

```bash
# Run all tests
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# Generate coverage report
npm run coverage
```

#### Test Structure

- `test/SecretNFTSepolia.ts`: Comprehensive integration test for Sepolia deployment
  - Tests minting with encrypted controller
  - Validates decryption for authorized users
  - Tests controller updates
  - Validates transfer mechanics with access grants

## Smart Contract Features

### Core Functions

#### `mint(address to, string calldata encryptedNote, externalEaddress controller, bytes calldata proof)`

Mints a new NFT with encrypted data.

**Parameters:**
- `to`: Recipient address
- `encryptedNote`: Pre-encrypted note (encrypted off-chain)
- `controller`: Encrypted controller address (FHEVM encrypted input)
- `proof`: Zero-knowledge proof for the encrypted controller

**Returns:** `tokenId` - The ID of the newly minted token

**Events:**
- `Transfer(address(0), to, tokenId)`
- `SecretUpdated(tokenId, encryptedNote)`
- `ControllerUpdated(tokenId)`

#### `updateEncryptedNote(uint256 tokenId, string calldata encryptedNote)`

Updates the encrypted note for a token. Only the token owner can call this.

**Access Control:** Requires `msg.sender == ownerOf(tokenId)`

#### `updateEncryptedController(uint256 tokenId, externalEaddress controller, bytes calldata proof)`

Updates the encrypted controller address. Only the token owner can call this.

**Access Control:** Requires `msg.sender == ownerOf(tokenId)`

**Note:** Automatically grants decryption access to the token owner.

#### `getEncryptedData(uint256 tokenId)`

Retrieves both encrypted components for a token.

**Returns:**
- `encryptedNote`: The encrypted note string
- `encryptedController`: The FHE-encrypted controller address

#### `tokensOfOwner(address owner)`

Returns an array of token IDs owned by a specific address.

**Returns:** `uint256[]` - Array of token IDs

#### `totalMinted()`

Returns the total number of tokens minted.

**Returns:** `uint256` - Total minted count

### Access Control Mechanism

The contract implements automatic access management through the `_update` hook:

```solidity
function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
    address previousOwner = super._update(to, tokenId, auth);

    if (to != address(0) && eaddress.unwrap(_tokenData[tokenId].encryptedController) != bytes32(0)) {
        _grantControllerAccess(tokenId, to);
    }

    return previousOwner;
}
```

When a token is transferred, the new owner is automatically granted access to decrypt the controller address.

## Frontend Features

### Component Architecture

```
App.tsx
└── SecretApp.tsx (Main application logic)
    ├── Header.tsx (Wallet connection)
    ├── MintForm.tsx (NFT minting interface)
    ├── TokenList.tsx (NFT selection sidebar)
    └── TokenDetails.tsx (NFT details and actions)
```

### Encryption Implementation

#### Off-chain Note Encryption (XOR Cipher)

```typescript
function encryptNote(note: string, controllerAddress: string) {
  const key = deriveKeyBytes(controllerAddress);
  const source = new TextEncoder().encode(note);
  const output = source.map((value, index) => value ^ key[index % key.length]);
  return ethers.hexlify(output);
}
```

**Why XOR?**
- Gas efficient (no on-chain computation needed)
- Simple and fast
- Secure when key is kept private (controller address is FHE-encrypted)

#### Controller Address Encryption (FHEVM)

```typescript
const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, connectedAddress);
buffer.addAddress(controllerAddress);
const encrypted = await buffer.encrypt();
```

**Why FHEVM?**
- Enables on-chain access control
- Cannot be decrypted without proper authorization
- Supports on-chain computation on encrypted data

### Key User Flows

1. **Minting Flow**:
   - User enters note and controller address
   - Frontend encrypts note with XOR
   - Frontend encrypts controller with FHEVM
   - Transaction sent to contract
   - Token list automatically refreshes

2. **Decryption Flow**:
   - User selects token
   - Clicks "Decrypt Controller"
   - Signs EIP-712 message for FHEVM relayer
   - Relayer decrypts controller address
   - Frontend decrypts note using controller
   - Displays decrypted data

3. **Update Flow**:
   - User decrypts token first
   - Modifies note or controller
   - Frontend re-encrypts data
   - Transaction sent to contract
   - Local state updated immediately

## Problem Statement

### Real-World Challenges

1. **Digital Privacy Crisis**: Despite encryption being widely available off-chain, blockchains expose all data publicly, limiting their utility for sensitive applications.

2. **Access Control Limitations**: Traditional smart contracts cannot implement dynamic, privacy-preserving access control without revealing the access list.

3. **Secret Sharing**: No native way to share secrets on-chain that can be:
   - Transferred between parties
   - Updated without revealing content
   - Verified without exposing data

4. **Credential Management**: Certificates, licenses, and credentials cannot be stored on-chain privately.

5. **Compliance Requirements**: Many industries require data privacy that public blockchains cannot provide.

### Specific Use Case Gaps

- **Healthcare**: Patient records need privacy but blockchain immutability
- **Supply Chain**: Trade secrets must remain confidential while proving authenticity
- **Gaming**: Private game state and hidden information
- **Legal**: Confidential documents with timestamping
- **Financial**: Private transaction amounts and balances

## Use Cases

### 1. Private Document Sharing

**Scenario**: Legal firms share confidential documents with clients

**Implementation**:
- Mint NFT with encrypted document hash/content
- Set client's address as controller
- Transfer NFT to client
- Client can verify authenticity and decrypt

**Benefits**:
- Immutable timestamp
- Proof of delivery
- Access can be transferred
- No central server needed

### 2. Secret Credentials & Certificates

**Scenario**: Universities issue encrypted diplomas as NFTs

**Implementation**:
- University mints NFT with encrypted credential data
- Graduate's address is the controller
- Graduate can prove credential without revealing details
- Can be verified by employers without exposing content

### 3. Private Digital Collectibles

**Scenario**: Exclusive content for NFT holders

**Implementation**:
- NFT contains encrypted access key
- Key unlocks premium content
- Owner can decrypt and use key
- Transferring NFT transfers access

### 4. Secure Message Passing

**Scenario**: On-chain encrypted communication channel

**Implementation**:
- Sender mints NFT with encrypted message
- Recipient's address is controller
- Transfer NFT to recipient
- Recipient decrypts message

### 5. Private Voting Mechanisms

**Scenario**: DAO with private voting

**Implementation**:
- Voter mints NFT with encrypted vote
- Vote tallying contract is controller
- Contract can compute on encrypted votes
- Final tally revealed without exposing individual votes

### 6. Inheritance & Time-locks

**Scenario**: Digital inheritance with privacy

**Implementation**:
- Store encrypted access to assets in NFT
- Controller can be updated via smart contract after time/condition
- Beneficiary receives NFT and can decrypt

## Security Considerations

### Encryption Security

1. **FHEVM Security**:
   - Based on TFHE (Torus FHE) scheme
   - 128-bit security level
   - Audited by Zama team
   - Open-source implementation

2. **XOR Cipher Limitations**:
   - **NOT cryptographically secure** if key is known
   - Relies on controller address secrecy (protected by FHEVM)
   - Suitable for this use case due to dual encryption

3. **Key Derivation**:
   - Uses keccak256 hash of controller address
   - Deterministic but irreversible
   - Consistent across encryption/decryption

### Smart Contract Security

1. **Access Control**:
   - Only token owners can update their tokens
   - FHEVM handles decryption access automatically
   - No admin privileges for reading encrypted data

2. **Reentrancy Protection**:
   - State updates before external calls
   - No external calls in critical functions
   - Follows checks-effects-interactions pattern

3. **Integer Overflow Protection**:
   - Solidity 0.8+ built-in overflow checks
   - Unchecked arithmetic only where proven safe

4. **Input Validation**:
   - FHEVM validates encrypted inputs with proofs
   - Address validation through `ethers.getAddress()`
   - Token existence checks before operations

### Operational Security

1. **Private Key Management**:
   - Never commit private keys
   - Use environment variables
   - Consider hardware wallets for production

2. **Frontend Security**:
   - No sensitive data in localStorage
   - Decrypted data only in memory
   - HTTPS required for production

3. **Relayer Trust**:
   - FHEVM relayer is necessary for decryption
   - Operated by Zama (trusted party)
   - Cannot decrypt without user signature

### Known Limitations

1. **Relayer Dependency**: Decryption requires Zama's relayer service
2. **Gas Costs**: FHE operations are more expensive than standard operations
3. **Network Support**: Currently only Sepolia testnet (mainnet coming soon)
4. **Note Encryption**: XOR cipher is not quantum-resistant

## Project Structure

```
nft-with-secret/
├── contracts/                  # Solidity smart contracts
│   └── SecretNFT.sol          # Main NFT contract with FHE
├── deploy/                     # Deployment scripts
│   └── deploy.ts              # Hardhat deploy script
├── tasks/                      # Custom Hardhat tasks
│   ├── accounts.ts            # Account management tasks
│   └── SecretNFT.ts           # Contract interaction tasks
├── test/                       # Smart contract tests
│   └── SecretNFTSepolia.ts    # Integration tests
├── src/                        # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.tsx     # Wallet connection header
│   │   │   ├── SecretApp.tsx  # Main application logic
│   │   │   ├── mint/
│   │   │   │   └── MintForm.tsx
│   │   │   └── tokens/
│   │   │       ├── TokenList.tsx
│   │   │       └── TokenDetails.tsx
│   │   ├── config/            # Configuration files
│   │   │   ├── contracts.ts   # Contract ABI and address
│   │   │   └── wagmi.ts       # Wagmi configuration
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useEthersSigner.ts
│   │   │   └── useZamaInstance.ts
│   │   ├── styles/            # CSS stylesheets
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
├── artifacts/                  # Compiled contract artifacts
├── cache/                      # Hardhat cache
├── deployments/               # Deployment records
│   └── sepolia/
│       └── SecretNFT.json     # Deployed contract info
├── types/                      # TypeScript type definitions
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Contract dependencies
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (gitignored)
├── .gitignore
├── LICENSE
└── README.md
```

## Development Workflow

### Adding New Features

1. **Smart Contract Changes**:
   ```bash
   # Edit contract
   vim contracts/SecretNFT.sol

   # Compile
   npm run compile

   # Run tests
   npm run test

   # Deploy to testnet
   npm run deploy:sepolia
   ```

2. **Frontend Changes**:
   ```bash
   cd src

   # Start dev server
   npm run dev

   # In another terminal, make changes
   # Hot reload will update automatically
   ```

### Code Quality

```bash
# Lint Solidity
npm run lint:sol

# Lint TypeScript
npm run lint:ts

# Format all code
npm run prettier:write

# Check formatting
npm run prettier:check
```

### Testing Strategy

1. **Unit Tests**: Test individual contract functions
2. **Integration Tests**: Test full user flows on testnet
3. **Frontend Testing**: Manual testing via UI
4. **Gas Optimization**: Use gas reporter to optimize

## Future Roadmap

### Phase 1: Core Enhancements (Q2 2025)

- [ ] **Batch Operations**: Mint multiple NFTs in one transaction
- [ ] **Metadata Support**: Add ERC721 metadata with encrypted fields
- [ ] **Approval System**: Implement encrypted approvals for better privacy
- [ ] **Event Filtering**: Add indexed events for efficient querying

### Phase 2: Advanced Features (Q3 2025)

- [ ] **Encrypted Transfers**: Hide recipient addresses using FHE
- [ ] **Time-locked Decryption**: Automatic controller updates after time periods
- [ ] **Multi-sig Controllers**: Support multiple controller addresses
- [ ] **Encrypted Royalties**: Private royalty splits
- [ ] **Cross-chain Bridge**: Enable transfers to other FHEVM chains

### Phase 3: Ecosystem Integration (Q4 2025)

- [ ] **IPFS Integration**: Store large encrypted files off-chain
- [ ] **Oracle Integration**: Conditional controller updates via Chainlink
- [ ] **DAO Governance**: Community-governed parameters
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **API Service**: REST API for programmatic access

### Phase 4: Mainnet & Scaling (Q1 2026)

- [ ] **Mainnet Deployment**: Deploy to Ethereum mainnet with FHEVM
- [ ] **Layer 2 Support**: Deploy to FHEVM L2s for lower gas costs
- [ ] **Gas Optimizations**: Further optimize storage and computation
- [ ] **Audit**: Professional security audit by reputable firm
- [ ] **Documentation**: Comprehensive developer documentation

### Research & Innovation

- [ ] **Quantum Resistance**: Explore post-quantum encryption schemes
- [ ] **Zero-Knowledge Proofs**: Combine ZK and FHE for enhanced privacy
- [ ] **Decentralized Relayer**: Remove dependency on centralized relayer
- [ ] **On-chain Note Encryption**: Move note encryption to FHE for full privacy
- [ ] **Private State Channels**: Enable off-chain encrypted state updates

### Community Features

- [ ] **NFT Marketplace**: Privacy-preserving marketplace for SecretNFTs
- [ ] **SDK Development**: JavaScript/TypeScript SDK for easy integration
- [ ] **Templates**: Pre-built templates for common use cases
- [ ] **Tutorial Series**: Video tutorials and written guides
- [ ] **Bug Bounty Program**: Incentivize security research

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Code Contributions**: Submit pull requests for bug fixes or new features
2. **Bug Reports**: Open issues for any bugs you discover
3. **Feature Requests**: Suggest new features or improvements
4. **Documentation**: Improve or translate documentation
5. **Testing**: Help test on different networks and configurations
6. **Community Support**: Answer questions and help other users

### Development Process

1. **Fork the repository**

   ```bash
   gh repo fork your-username/nft-with-secret
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**

   ```bash
   npm run test
   npm run lint
   ```

5. **Commit with conventional commits**

   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in minting"
   git commit -m "docs: update README"
   ```

6. **Push and create pull request**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Respond to review feedback**

### Code Style Guidelines

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: Use TypeScript strict mode, avoid `any`
- **React**: Functional components with hooks, no class components
- **Comments**: Document complex logic and public functions
- **Naming**: Use descriptive variable and function names

### Testing Requirements

- All new features must include tests
- Maintain or improve test coverage
- Test on Sepolia testnet before submitting PR

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

**Key Points**:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ⚠️ Liability disclaimer
- ⚠️ No warranty

See the [LICENSE](LICENSE) file for full details.

### Third-Party Licenses

- **OpenZeppelin Contracts**: MIT License
- **FHEVM**: BSD-3-Clause-Clear License
- **Hardhat**: MIT License
- **React**: MIT License

## Support & Community

### Documentation & Resources

- **FHEVM Documentation**: [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Hardhat Docs**: [hardhat.org/docs](https://hardhat.org/docs)
- **OpenZeppelin**: [docs.openzeppelin.com](https://docs.openzeppelin.com/)
- **Ethers.js**: [docs.ethers.org](https://docs.ethers.org/)

### Get Help

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/your-username/nft-with-secret/issues)
- **Discussions**: [Join community discussions](https://github.com/your-username/nft-with-secret/discussions)
- **Zama Discord**: [discord.gg/zama](https://discord.gg/zama)
- **Twitter**: Follow [@Zama_fhe](https://twitter.com/zama_fhe) for updates

### FAQ

**Q: What is Fully Homomorphic Encryption?**
A: FHE allows computations on encrypted data without decryption, enabling privacy-preserving smart contracts.

**Q: Is this production-ready?**
A: Currently in testnet phase. Mainnet deployment planned for 2026 after audits.

**Q: What are the gas costs?**
A: FHE operations cost more than standard operations. Expect 2-3x higher gas fees.

**Q: Can I use this on Ethereum mainnet?**
A: Not yet. Currently supports Sepolia testnet. Mainnet support coming with FHEVM mainnet launch.

**Q: How secure is the encryption?**
A: FHEVM provides 128-bit security. The XOR cipher for notes relies on controller address secrecy.

**Q: Can the contract owner read my encrypted data?**
A: No. Only addresses with granted access via FHEVM can decrypt controller addresses.

**Q: What happens if Zama's relayer goes down?**
A: Decryption would be unavailable until restored. Future versions will support decentralized relayers.

---

**Built with ❤️ using FHEVM by [Zama](https://zama.ai)**

*Making blockchain truly private, one NFT at a time.*
