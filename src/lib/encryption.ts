// src/lib/encryption.ts
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";

import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const ENCRYPTED_VALUE_VERSION = "v1";

function decodeEncryptionKey(value: string): Buffer {
	const key = Buffer.from(value, "base64");

	if (key.length !== KEY_LENGTH_BYTES) {
		throw new Error("ENCRYPTION_KEY must be a Base64-encoded 32-byte key.");
	}

	return key;
}

const encryptionKey = decodeEncryptionKey(env.ENCRYPTION_KEY);

export interface EncryptedValue {
	version: typeof ENCRYPTED_VALUE_VERSION;
	iv: string;
	authTag: string;
	ciphertext: string;
}

function encodeEncryptedValue(value: EncryptedValue): string {
	return [value.version, value.iv, value.authTag, value.ciphertext].join(".");
}

function decodeEncryptedValue(value: string): EncryptedValue {
	const [version, iv, authTag, ciphertext, ...extra] = value.split(".");

	if (
		version !== ENCRYPTED_VALUE_VERSION ||
		!iv ||
		!authTag ||
		!ciphertext ||
		extra.length > 0
	) {
		throw new Error("Encrypted value has an invalid format.");
	}

	const ivBuffer = Buffer.from(iv, "base64url");
	const authTagBuffer = Buffer.from(authTag, "base64url");

	if (ivBuffer.length !== IV_LENGTH_BYTES) {
		throw new Error("Encrypted value contains an invalid IV.");
	}

	if (authTagBuffer.length !== AUTH_TAG_LENGTH_BYTES) {
		throw new Error("Encrypted value contains an invalid authentication tag.");
	}

	return {
		version,
		iv,
		authTag,
		ciphertext,
	};
}

/**
 * Encrypts UTF-8 text using AES-256-GCM.
 *
 * The returned value contains:
 *
 * version.iv.authenticationTag.ciphertext
 */
export function encryptString(plaintext: string): string {
	const iv = randomBytes(IV_LENGTH_BYTES);

	const cipher = createCipheriv(ALGORITHM, encryptionKey, iv, {
		authTagLength: AUTH_TAG_LENGTH_BYTES,
	});

	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);

	const authTag = cipher.getAuthTag();

	return encodeEncryptedValue({
		version: ENCRYPTED_VALUE_VERSION,
		iv: iv.toString("base64url"),
		authTag: authTag.toString("base64url"),
		ciphertext: ciphertext.toString("base64url"),
	});
}

/**
 * Decrypts a value produced by encryptString().
 *
 * Decryption fails if the encrypted value has been modified, the wrong key
 * is used, or its authentication tag is invalid.
 */
export function decryptString(encryptedValue: string): string {
	const decoded = decodeEncryptedValue(encryptedValue);

	const decipher = createDecipheriv(
		ALGORITHM,
		encryptionKey,
		Buffer.from(decoded.iv, "base64url"),
		{
			authTagLength: AUTH_TAG_LENGTH_BYTES,
		},
	);

	decipher.setAuthTag(Buffer.from(decoded.authTag, "base64url"));

	const plaintext = Buffer.concat([
		decipher.update(Buffer.from(decoded.ciphertext, "base64url")),
		decipher.final(),
	]);

	return plaintext.toString("utf8");
}

export function encryptJson<T>(value: T): string {
	return encryptString(JSON.stringify(value));
}

export function decryptJson<T>(encryptedValue: string): T {
	const plaintext = decryptString(encryptedValue);

	try {
		return JSON.parse(plaintext) as T;
	} catch (error) {
		throw new Error("Decrypted value does not contain valid JSON.", {
			cause: error,
		});
	}
}

/**
 * Produces a deterministic SHA-256 digest for values that need exact-match
 * lookup while their original value remains encrypted.
 *
 * Do not use this for passwords. Better Auth handles password hashing.
 */
export function createSearchHash(value: string): string {
	return createHash("sha256")
		.update(value.trim().toLowerCase(), "utf8")
		.digest("hex");
}

/**
 * Compares two hexadecimal hashes without leaking comparison timing.
 */
export function compareSearchHashes(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left, "hex");
	const rightBuffer = Buffer.from(right, "hex");

	if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}
