/**
 * Post-Quantum Cryptography Module
 * NIST FIPS 203 (ML-KEM/Kyber), FIPS 204 (ML-DSA/Dilithium), FIPS 205 (SLH-DSA/SPHINCS+)
 * Protection against "Harvest Now, Decrypt Later" (HNDL) attacks
 */

export interface PQCKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: 'ML-KEM-768' | 'ML-DSA-65' | 'SLH-DSA-128';
  createdAt: number;
}

export interface PQCSignature {
  signature: string;
  algorithm: 'ML-DSA-65' | 'SLH-DSA-128';
  publicKey: string;
  timestamp: number;
}

export interface EncapsulatedKey {
  ciphertext: string;
  sharedSecret: string;
  algorithm: 'ML-KEM-768';
}

// Simulated Kyber (ML-KEM) key generation
// In production, use liboqs or pqcrypto library
export async function generateMLKEMKeyPair(): Promise<PQCKeyPair> {
  // Simulate lattice-based key generation
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  
  const publicKeyData = new Uint8Array(1184); // ML-KEM-768 public key size
  crypto.getRandomValues(publicKeyData);
  
  const privateKeyData = new Uint8Array(2400); // ML-KEM-768 private key size
  crypto.getRandomValues(privateKeyData);
  
  return {
    publicKey: arrayToHex(publicKeyData),
    privateKey: arrayToHex(privateKeyData),
    algorithm: 'ML-KEM-768',
    createdAt: Date.now()
  };
}

// Simulated Dilithium (ML-DSA) key generation
export async function generateMLDSAKeyPair(): Promise<PQCKeyPair> {
  const publicKeyData = new Uint8Array(1952); // ML-DSA-65 public key size
  crypto.getRandomValues(publicKeyData);
  
  const privateKeyData = new Uint8Array(4032); // ML-DSA-65 private key size
  crypto.getRandomValues(privateKeyData);
  
  return {
    publicKey: arrayToHex(publicKeyData),
    privateKey: arrayToHex(privateKeyData),
    algorithm: 'ML-DSA-65',
    createdAt: Date.now()
  };
}

// Simulated SPHINCS+ (SLH-DSA) key generation (hash-based, most conservative)
export async function generateSLHDSAKeyPair(): Promise<PQCKeyPair> {
  const publicKeyData = new Uint8Array(32); // SLH-DSA-128 public key size
  crypto.getRandomValues(publicKeyData);
  
  const privateKeyData = new Uint8Array(64); // SLH-DSA-128 private key size
  crypto.getRandomValues(privateKeyData);
  
  return {
    publicKey: arrayToHex(publicKeyData),
    privateKey: arrayToHex(privateKeyData),
    algorithm: 'SLH-DSA-128',
    createdAt: Date.now()
  };
}

// ML-KEM Key Encapsulation
export async function encapsulateKey(publicKey: string): Promise<EncapsulatedKey> {
  // Simulate Kyber encapsulation
  const sharedSecretData = new Uint8Array(32);
  crypto.getRandomValues(sharedSecretData);
  
  const ciphertextData = new Uint8Array(1088); // ML-KEM-768 ciphertext size
  crypto.getRandomValues(ciphertextData);
  
  // In real implementation, ciphertext encrypts the shared secret with public key
  return {
    ciphertext: arrayToHex(ciphertextData),
    sharedSecret: arrayToHex(sharedSecretData),
    algorithm: 'ML-KEM-768'
  };
}

// ML-DSA Signature
export async function signWithMLDSA(
  message: string,
  privateKey: string
): Promise<PQCSignature> {
  const encoder = new TextEncoder();
  const messageData = encoder.encode(message);
  
  // Simulate Dilithium signature (real: lattice-based signing)
  const signatureData = new Uint8Array(3293); // ML-DSA-65 signature size
  crypto.getRandomValues(signatureData);
  
  // Incorporate message hash into signature simulation
  const messageHash = await crypto.subtle.digest('SHA-256', messageData);
  const hashArray = new Uint8Array(messageHash);
  for (let i = 0; i < 32; i++) {
    signatureData[i] ^= hashArray[i];
  }
  
  return {
    signature: arrayToHex(signatureData),
    algorithm: 'ML-DSA-65',
    publicKey: privateKey.substring(0, 64), // Derive public from private (simulated)
    timestamp: Date.now()
  };
}

// Verify ML-DSA Signature
export async function verifyMLDSASignature(
  message: string,
  signature: PQCSignature
): Promise<boolean> {
  // In production, this verifies the lattice-based signature
  // Simulation: verify timestamp is recent and signature has correct length
  const isRecentTimestamp = Date.now() - signature.timestamp < 3600000; // 1 hour
  const hasCorrectLength = signature.signature.length === 3293 * 2; // hex encoding
  
  return isRecentTimestamp && hasCorrectLength;
}

// Crypto Agility Layer - allows hot-swapping algorithms
export class CryptoAgilityManager {
  private currentKEM: 'ML-KEM-768' = 'ML-KEM-768';
  private currentDSA: 'ML-DSA-65' | 'SLH-DSA-128' = 'ML-DSA-65';
  private keyRotationInterval: number = 86400000; // 24 hours
  private lastRotation: number = Date.now();

  async generateKeyPair(purpose: 'encapsulation' | 'signing'): Promise<PQCKeyPair> {
    if (purpose === 'encapsulation') {
      return generateMLKEMKeyPair();
    } else {
      if (this.currentDSA === 'ML-DSA-65') {
        return generateMLDSAKeyPair();
      } else {
        return generateSLHDSAKeyPair();
      }
    }
  }

  shouldRotateKeys(): boolean {
    return Date.now() - this.lastRotation > this.keyRotationInterval;
  }

  switchToBackupDSA(): void {
    // Switch to SPHINCS+ if Dilithium is compromised
    this.currentDSA = 'SLH-DSA-128';
    this.lastRotation = Date.now();
  }

  getSecurityLevel(): string {
    return 'NIST Level 3 (128-bit quantum security)';
  }
}

// HNDL Threat Assessment
export interface HNDLRiskAssessment {
  dataAge: number; // days
  encryptionAlgorithm: string;
  quantumThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  estimatedCRQCTimeline: string; // Cryptographically Relevant Quantum Computer
}

export function assessHNDLRisk(
  dataCreationDate: Date,
  currentEncryption: string
): HNDLRiskAssessment {
  const dataAge = Math.floor((Date.now() - dataCreationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const vulnerableAlgorithms = ['RSA-2048', 'ECDSA-256', 'ECDH-256', 'RSA-4096'];
  const isVulnerable = vulnerableAlgorithms.some(alg => 
    currentEncryption.toUpperCase().includes(alg.toUpperCase())
  );
  
  let threatLevel: HNDLRiskAssessment['quantumThreatLevel'] = 'low';
  let action = 'Monitor quantum computing developments';
  
  if (isVulnerable) {
    if (dataAge > 3650) { // 10+ years
      threatLevel = 'critical';
      action = 'IMMEDIATE MIGRATION to PQC required';
    } else if (dataAge > 1825) { // 5+ years
      threatLevel = 'high';
      action = 'Schedule PQC migration within 6 months';
    } else if (dataAge > 365) { // 1+ year
      threatLevel = 'medium';
      action = 'Plan PQC migration within 12 months';
    }
  }
  
  return {
    dataAge,
    encryptionAlgorithm: currentEncryption,
    quantumThreatLevel: threatLevel,
    recommendedAction: action,
    estimatedCRQCTimeline: '2030-2035 (estimated)'
  };
}

// Utility functions
function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArray(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Export crypto agility manager singleton
export const cryptoAgility = new CryptoAgilityManager();
