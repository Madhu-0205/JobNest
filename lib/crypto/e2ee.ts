/**
 * JobNest 2.0 — End-to-End Encryption (E2EE) Module
 *
 * Implements audited, browser-native Web Crypto API standards:
 * - ECDH P-256 (secp256r1) for peer-to-peer key agreement
 * - AES-256-GCM with 96-bit (12-byte) cryptographically secure random nonces
 * - 128-bit authentication tag for tamper detection and integrity
 * - Versioned encrypted envelope format
 *
 * Server never has access to private keys or plaintext message content.
 */

export const E2EE_VERSION = 1;
export const E2EE_ALGORITHM = "AES-256-GCM" as const;
export const E2EE_PREFIX = "jobnest_e2ee:v1:";
export const MAX_PLAINTEXT_LENGTH = 100000; // 100KB boundary protection

export interface EncryptedMessageEnvelope {
  version: number;
  algorithm: string;
  keyReference: string;
  nonce: string;      // Base64 encoded 12-byte IV
  ciphertext: string; // Base64 encoded ciphertext + 16-byte authentication tag
  timestamp: string;
}

export interface DecryptionResult {
  success: boolean;
  text: string;
  isEncrypted: boolean;
  error?: string;
}

// ─── Base64 Isomorphic Helpers ───────────────────────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ─── Web Crypto Subtlest Accessor ─────────────────────────────────────────────

function getSubtle(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (subtle) is not available in this runtime.");
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error("Cryptographically secure random generation is not available.");
}

// ─── Key Pair Management ──────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "jobnest_e2ee_keypair_";

/**
 * Generates or retrieves the device's persistent ECDH P-256 keypair for a user.
 * Private key is stored ONLY in local client storage and is never transmitted.
 */
export async function getOrGenerateUserKeyPair(userId: string): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
}> {
  const subtle = getSubtle();
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  // Check local client storage
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { priv: JsonWebKey; pub: JsonWebKey };
        const privateKey = await subtle.importKey(
          "jwk",
          parsed.priv,
          { name: "ECDH", namedCurve: "P-256" },
          false,
          ["deriveKey"]
        );
        const publicKey = await subtle.importKey(
          "jwk",
          parsed.pub,
          { name: "ECDH", namedCurve: "P-256" },
          true,
          []
        );
        return { privateKey, publicKey, publicKeyJwk: parsed.pub };
      } catch {
        // Storage corrupted or invalidated — regenerate
      }
    }
  }

  // Generate a fresh ECDH P-256 key pair
  const keyPair = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable so we can save to local client storage
    ["deriveKey"]
  );

  const privateKeyJwk = await subtle.exportKey("jwk", keyPair.privateKey);
  const publicKeyJwk = await subtle.exportKey("jwk", keyPair.publicKey);

  // Re-import private key as non-extractable for memory safety if needed,
  // or cache in local client storage
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ priv: privateKeyJwk, pub: publicKeyJwk })
      );
    } catch {
      // Quota exceeded or incognito mode
    }
  }

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyJwk,
  };
}

/**
 * Imports a peer's public key from JWK format.
 */
export async function importPeerPublicKey(publicKeyJwk: JsonWebKey): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * Derives a shared 256-bit AES-GCM conversation key using ECDH between
 * the caller's private key and the peer's public key.
 */
export async function deriveConversationKey(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false, // derived key is non-extractable from browser memory
    ["encrypt", "decrypt"]
  );
}

// ─── Message Encryption & Decryption ─────────────────────────────────────────

/**
 * Encrypts a plaintext message with AES-256-GCM using the conversation key.
 * Produces a versioned, authenticated ciphertext envelope.
 */
export async function encryptMessage(
  plaintext: string,
  conversationKey: CryptoKey,
  senderId: string
): Promise<string> {
  if (plaintext.length > MAX_PLAINTEXT_LENGTH) {
    throw new Error(`Message exceeds maximum size limit of ${MAX_PLAINTEXT_LENGTH} characters.`);
  }

  const subtle = getSubtle();
  // 12-byte (96-bit) cryptographically secure random nonce per NIST SP 800-38D
  const iv = getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource, tagLength: 128 },
    conversationKey,
    encodedPlaintext as unknown as BufferSource
  );

  const envelope: EncryptedMessageEnvelope = {
    version: E2EE_VERSION,
    algorithm: E2EE_ALGORITHM,
    keyReference: senderId,
    nonce: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(envelope);
  const base64Envelope = bytesToBase64(new TextEncoder().encode(serialized));
  return `${E2EE_PREFIX}${base64Envelope}`;
}

/**
 * Decrypts a message. If the message is unencrypted (legacy/system), returns it transparently.
 * If encrypted, verifies integrity via AES-GCM authentication tag and decrypts locally.
 * If tampered or decrypted with the wrong key, returns a safe failure indicator.
 */
export async function decryptMessage(
  content: string | undefined | null,
  conversationKey: CryptoKey | null
): Promise<DecryptionResult> {
  if (!content) {
    return { success: true, text: "", isEncrypted: false };
  }

  // Not an encrypted envelope — legacy or system message
  if (!content.startsWith(E2EE_PREFIX)) {
    return { success: true, text: content, isEncrypted: false };
  }

  if (!conversationKey) {
    return {
      success: false,
      text: "🔒 Message is encrypted (key unavailable).",
      isEncrypted: true,
      error: "MISSING_CONVERSATION_KEY",
    };
  }

  const subtle = getSubtle();

  try {
    const base64Envelope = content.slice(E2EE_PREFIX.length);
    const jsonStr = new TextDecoder().decode(base64ToBytes(base64Envelope));
    const envelope = JSON.parse(jsonStr) as EncryptedMessageEnvelope;

    if (envelope.version !== E2EE_VERSION || envelope.algorithm !== E2EE_ALGORITHM) {
      return {
        success: false,
        text: "🔒 Unsupported encryption format.",
        isEncrypted: true,
        error: "UNSUPPORTED_VERSION",
      };
    }

    const iv = base64ToBytes(envelope.nonce);
    if (iv.length !== 12) {
      return {
        success: false,
        text: "🔒 Invalid cryptographic nonce.",
        isEncrypted: true,
        error: "INVALID_NONCE",
      };
    }

    const ciphertext = base64ToBytes(envelope.ciphertext);

    // AES-GCM automatically verifies the 16-byte authentication tag
    const decryptedBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource, tagLength: 128 },
      conversationKey,
      ciphertext as unknown as BufferSource
    );

    const plaintext = new TextDecoder().decode(decryptedBuffer);
    return {
      success: true,
      text: plaintext,
      isEncrypted: true,
    };
  } catch {
    // OperationError: tag mismatch, tampered ciphertext, or wrong key
    return {
      success: false,
      text: "🔒 Unable to decrypt message.",
      isEncrypted: true,
      error: "DECRYPTION_FAILED",
    };
  }
}

/**
 * Checks whether a given message content string is an E2EE encrypted envelope.
 */
export function isEncryptedMessage(content: string | undefined | null): boolean {
  return typeof content === "string" && content.startsWith(E2EE_PREFIX);
}
