// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretNFT
/// @notice ERC721 storing encrypted notes and encrypted controller addresses
contract SecretNFT is ERC721, Ownable, ZamaEthereumConfig {
    struct TokenData {
        string encryptedNote;
        eaddress encryptedController;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => TokenData) private _tokenData;

    event SecretUpdated(uint256 indexed tokenId, string encryptedNote);
    event ControllerUpdated(uint256 indexed tokenId);

    constructor() ERC721("Secret NFT", "SNFT") Ownable(msg.sender) {}

    /// @notice Mints a new NFT with encrypted payload data
    /// @param to receiver of the NFT
    /// @param encryptedNote ciphertext of the note encrypted off-chain
    /// @param controller encrypted controller reference for the note
    /// @param proof proof associated with the encrypted controller input
    /// @return tokenId new token identifier
    function mint(
        address to,
        string calldata encryptedNote,
        externalEaddress controller,
        bytes calldata proof
    ) external returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }

        eaddress validatedController = FHE.fromExternal(controller, proof);
        _tokenData[tokenId] = TokenData({encryptedNote: encryptedNote, encryptedController: validatedController});

        _mint(to, tokenId);

        emit SecretUpdated(tokenId, encryptedNote);
        emit ControllerUpdated(tokenId);
    }

    /// @notice Updates the encrypted note for a tokenId
    /// @param tokenId identifier of the NFT
    /// @param encryptedNote ciphertext string encrypted for controller address
    function updateEncryptedNote(uint256 tokenId, string calldata encryptedNote) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        _tokenData[tokenId].encryptedNote = encryptedNote;

        emit SecretUpdated(tokenId, encryptedNote);
    }

    /// @notice Updates encrypted controller address for a tokenId
    /// @param tokenId identifier of the NFT
    /// @param controller encrypted controller reference
    /// @param proof proof of encrypted controller
    function updateEncryptedController(
        uint256 tokenId,
        externalEaddress controller,
        bytes calldata proof
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        eaddress validatedController = FHE.fromExternal(controller, proof);
        _tokenData[tokenId].encryptedController = validatedController;

        _grantControllerAccess(tokenId, msg.sender);

        emit ControllerUpdated(tokenId);
    }

    /// @notice Gets encrypted data for a tokenId
    /// @param tokenId identifier of the NFT
    /// @return encryptedNote ciphertext string stored for the token
    /// @return encryptedController encrypted controller address
    function getEncryptedData(uint256 tokenId)
        external
        view
        returns (string memory encryptedNote, eaddress encryptedController)
    {
        TokenData storage data = _tokenData[tokenId];
        return (data.encryptedNote, data.encryptedController);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory tokenIds) {
        if (owner == address(0)) {
            return new uint256[](0);
        }

        uint256 balance = balanceOf(owner);
        tokenIds = new uint256[](balance);

        uint256 found;
        for (uint256 tokenId = 0; tokenId < _nextTokenId && found < balance; ) {
            if (_ownerOf(tokenId) == owner) {
                tokenIds[found] = tokenId;
                unchecked {
                    ++found;
                }
            }

            unchecked {
                ++tokenId;
            }
        }

        return tokenIds;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        if (to != address(0) && eaddress.unwrap(_tokenData[tokenId].encryptedController) != bytes32(0)) {
            _grantControllerAccess(tokenId, to);
        }

        return previousOwner;
    }

    function _grantControllerAccess(uint256 tokenId, address account) private {
        eaddress controller = _tokenData[tokenId].encryptedController;
        FHE.allowThis(controller);
        FHE.allow(controller, account);
    }
}
