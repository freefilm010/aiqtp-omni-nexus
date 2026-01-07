/**
 * NFT Registry for Hashtag & URL Sovereignty
 * Immutable asset records on blockchain
 * ERC-721 compatible interface
 */

export interface SovereignNFT {
  tokenId: string;
  assetType: 'hashtag' | 'url' | 'domain' | 'trademark' | 'patent';
  assetValue: string; // The actual hashtag, URL, etc.
  owner: string;
  creator: string;
  createdAt: number;
  mintedAt: number;
  metadata: NFTMetadata;
  registryChain: 'ethereum' | 'solana' | 'qtc'; // QTC = Quantum Time Crystal Chain
  status: 'active' | 'disputed' | 'transferred' | 'burned';
  royaltyPercent: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  externalUrl?: string;
  attributes: Array<{
    traitType: string;
    value: string | number;
  }>;
  proofOfOriginality: string; // Hash of first use evidence
  legalJurisdiction: string;
}

export interface RegistrationProof {
  merkleRoot: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  witnesses: string[];
}

export interface DisputeRecord {
  disputeId: string;
  tokenId: string;
  claimant: string;
  defendant: string;
  evidence: string[];
  status: 'open' | 'resolved' | 'appealed';
  resolution?: 'claimant_wins' | 'defendant_wins' | 'split';
  createdAt: number;
  resolvedAt?: number;
}

// Sovereign Asset Registry
export class SovereignAssetRegistry {
  private registry: Map<string, SovereignNFT> = new Map();
  private ownerIndex: Map<string, Set<string>> = new Map();
  private assetIndex: Map<string, string> = new Map(); // assetValue -> tokenId
  private disputes: Map<string, DisputeRecord> = new Map();

  // Generate unique token ID
  private generateTokenId(assetType: string, assetValue: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${assetType}:${assetValue}:${Date.now()}`);
    // Simple hash for demo (would use keccak256 in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash |= 0;
    }
    return `QTC-${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  // Mint new sovereign NFT
  mintSovereignAsset(
    assetType: SovereignNFT['assetType'],
    assetValue: string,
    owner: string,
    metadata: Partial<NFTMetadata> = {}
  ): SovereignNFT | { error: string } {
    // Check if asset already registered
    const normalizedValue = assetValue.toLowerCase().trim();
    if (this.assetIndex.has(normalizedValue)) {
      return { error: `Asset "${assetValue}" already registered` };
    }

    const tokenId = this.generateTokenId(assetType, normalizedValue);
    const now = Date.now();

    const nft: SovereignNFT = {
      tokenId,
      assetType,
      assetValue: normalizedValue,
      owner,
      creator: owner,
      createdAt: now,
      mintedAt: now,
      metadata: {
        name: metadata.name || `${assetType}: ${assetValue}`,
        description: metadata.description || `Sovereign ownership of ${assetType}`,
        image: metadata.image,
        externalUrl: metadata.externalUrl,
        attributes: [
          { traitType: 'Asset Type', value: assetType },
          { traitType: 'Original Value', value: assetValue },
          { traitType: 'Registry', value: 'Titan Codex Sovereign Registry' }
        ],
        proofOfOriginality: this.generateProofHash(assetValue, owner, now),
        legalJurisdiction: metadata.legalJurisdiction || 'Aethelgard SEZ'
      },
      registryChain: 'qtc',
      status: 'active',
      royaltyPercent: 5 // 5% royalty on future transfers
    };

    this.registry.set(tokenId, nft);
    this.assetIndex.set(normalizedValue, tokenId);
    
    // Update owner index
    if (!this.ownerIndex.has(owner)) {
      this.ownerIndex.set(owner, new Set());
    }
    this.ownerIndex.get(owner)!.add(tokenId);

    console.log(`[REGISTRY] Minted ${assetType} NFT: ${tokenId} for ${assetValue}`);
    return nft;
  }

  private generateProofHash(value: string, owner: string, timestamp: number): string {
    const data = `${value}|${owner}|${timestamp}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return `proof-${Math.abs(hash).toString(16)}`;
  }

  // Transfer ownership
  transfer(tokenId: string, from: string, to: string): boolean {
    const nft = this.registry.get(tokenId);
    if (!nft || nft.owner !== from || nft.status !== 'active') {
      return false;
    }

    // Remove from old owner
    this.ownerIndex.get(from)?.delete(tokenId);
    
    // Add to new owner
    if (!this.ownerIndex.has(to)) {
      this.ownerIndex.set(to, new Set());
    }
    this.ownerIndex.get(to)!.add(tokenId);
    
    nft.owner = to;
    nft.status = 'transferred';
    
    console.log(`[REGISTRY] Transferred ${tokenId} from ${from} to ${to}`);
    return true;
  }

  // Get NFT by token ID
  getNFT(tokenId: string): SovereignNFT | undefined {
    return this.registry.get(tokenId);
  }

  // Get NFTs owned by address
  getOwnedAssets(owner: string): SovereignNFT[] {
    const tokenIds = this.ownerIndex.get(owner) || new Set();
    return Array.from(tokenIds)
      .map(id => this.registry.get(id))
      .filter((nft): nft is SovereignNFT => nft !== undefined);
  }

  // Check if asset is registered
  isRegistered(assetValue: string): boolean {
    return this.assetIndex.has(assetValue.toLowerCase().trim());
  }

  // Get owner of asset
  getAssetOwner(assetValue: string): string | undefined {
    const tokenId = this.assetIndex.get(assetValue.toLowerCase().trim());
    if (!tokenId) return undefined;
    return this.registry.get(tokenId)?.owner;
  }

  // File dispute
  fileDispute(
    assetValue: string,
    claimant: string,
    evidence: string[]
  ): DisputeRecord | { error: string } {
    const tokenId = this.assetIndex.get(assetValue.toLowerCase().trim());
    if (!tokenId) {
      return { error: 'Asset not found in registry' };
    }

    const nft = this.registry.get(tokenId)!;
    if (nft.status === 'disputed') {
      return { error: 'Asset already has an active dispute' };
    }

    const disputeId = `dispute-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const dispute: DisputeRecord = {
      disputeId,
      tokenId,
      claimant,
      defendant: nft.owner,
      evidence,
      status: 'open',
      createdAt: Date.now()
    };

    this.disputes.set(disputeId, dispute);
    nft.status = 'disputed';

    console.log(`[REGISTRY] Dispute filed: ${disputeId} for ${assetValue}`);
    return dispute;
  }

  // Resolve dispute (would be done by DAO governance in production)
  resolveDispute(
    disputeId: string,
    resolution: DisputeRecord['resolution'],
    arbitrator: string
  ): boolean {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || dispute.status !== 'open') {
      return false;
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedAt = Date.now();

    const nft = this.registry.get(dispute.tokenId);
    if (nft) {
      if (resolution === 'claimant_wins') {
        // Transfer to claimant
        this.transfer(dispute.tokenId, dispute.defendant, dispute.claimant);
      }
      nft.status = 'active';
    }

    console.log(`[REGISTRY] Dispute ${disputeId} resolved: ${resolution}`);
    return true;
  }

  // Batch mint hashtags
  batchMintHashtags(hashtags: string[], owner: string): SovereignNFT[] {
    return hashtags
      .map(tag => this.mintSovereignAsset('hashtag', tag.startsWith('#') ? tag : `#${tag}`, owner))
      .filter((result): result is SovereignNFT => !('error' in result));
  }

  // Get registry stats
  getStats(): {
    totalAssets: number;
    byType: Record<string, number>;
    totalOwners: number;
    activeDisputes: number;
  } {
    const byType: Record<string, number> = {};
    for (const nft of this.registry.values()) {
      byType[nft.assetType] = (byType[nft.assetType] || 0) + 1;
    }

    const activeDisputes = Array.from(this.disputes.values())
      .filter(d => d.status === 'open').length;

    return {
      totalAssets: this.registry.size,
      byType,
      totalOwners: this.ownerIndex.size,
      activeDisputes
    };
  }

  // Export registry for backup/verification
  exportRegistry(): SovereignNFT[] {
    return Array.from(this.registry.values());
  }
}

// Export singleton
export const sovereignRegistry = new SovereignAssetRegistry();

// Pre-register some reserved hashtags for the ecosystem
sovereignRegistry.mintSovereignAsset('hashtag', '#QuantumChronos', 'genesis');
sovereignRegistry.mintSovereignAsset('hashtag', '#TitanCodex', 'genesis');
sovereignRegistry.mintSovereignAsset('hashtag', '#WireFlux', 'genesis');
sovereignRegistry.mintSovereignAsset('hashtag', '#QTC', 'genesis');
sovereignRegistry.mintSovereignAsset('hashtag', '#Stargate', 'genesis');
sovereignRegistry.mintSovereignAsset('hashtag', '#Aethelgard', 'genesis');
sovereignRegistry.mintSovereignAsset('domain', 'quantumchronos.io', 'genesis');
sovereignRegistry.mintSovereignAsset('domain', 'titancodex.ai', 'genesis');
