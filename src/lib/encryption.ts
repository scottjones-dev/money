import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function developmentKey(): Buffer {
	return createHash("sha256")
		.update(`money-api:${env.BETTER_AUTH_SECRET}`)
		.digest();
}

function keyring(): Map<string, Buffer> {
	const keys = new Map<string, Buffer>();
	if (!env.DATA_ENCRYPTION_KEYS) {
		if (env.NODE_ENV === "production")
			throw new Error("DATA_ENCRYPTION_KEYS is required in production.");
		keys.set(env.DATA_ENCRYPTION_CURRENT_KEY_ID, developmentKey());
		return keys;
	}
	for (const entry of env.DATA_ENCRYPTION_KEYS.split(",")) {
		const separator = entry.indexOf(":");
		if (separator < 1)
			throw new Error("DATA_ENCRYPTION_KEYS entries must use keyId:base64Key.");
		const id = entry.slice(0, separator).trim();
		const key = Buffer.from(entry.slice(separator + 1).trim(), "base64");
		if (key.length !== 32)
			throw new Error(`Encryption key ${id} must decode to 32 bytes.`);
		keys.set(id, key);
	}
	return keys;
}

export interface EncryptedPayload {
	keyId: string;
	value: string;
}

export function encryptString(plaintext: string): EncryptedPayload {
	const keys = keyring();
	const keyId = env.DATA_ENCRYPTION_CURRENT_KEY_ID;
	const key = keys.get(keyId);
	if (!key)
		throw new Error(
			`Current encryption key ${keyId} is not in DATA_ENCRYPTION_KEYS.`,
		);
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, iv, {
		authTagLength: TAG_BYTES,
	});
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	return {
		keyId,
		value: [
			"v1",
			iv.toString("base64url"),
			cipher.getAuthTag().toString("base64url"),
			ciphertext.toString("base64url"),
		].join("."),
	};
}

export function decryptString(payload: EncryptedPayload): string {
	const key = keyring().get(payload.keyId);
	if (!key) throw new Error(`Encryption key ${payload.keyId} is unavailable.`);
	const [version, ivText, tagText, ciphertextText, ...extra] =
		payload.value.split(".");
	if (
		version !== "v1" ||
		!ivText ||
		!tagText ||
		!ciphertextText ||
		extra.length
	)
		throw new Error("Encrypted payload has an invalid format.");
	const iv = Buffer.from(ivText, "base64url");
	const tag = Buffer.from(tagText, "base64url");
	if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES)
		throw new Error("Encrypted payload metadata is invalid.");
	const decipher = createDecipheriv(ALGORITHM, key, iv, {
		authTagLength: TAG_BYTES,
	});
	decipher.setAuthTag(tag);
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertextText, "base64url")),
		decipher.final(),
	]).toString("utf8");
}

export function encryptJson<T>(value: T): EncryptedPayload {
	return encryptString(JSON.stringify(value));
}

export function decryptJson<T>(payload: EncryptedPayload): T {
	return JSON.parse(decryptString(payload)) as T;
}

export function rotateEncryptedPayload(
	payload: EncryptedPayload,
): EncryptedPayload {
	if (payload.keyId === env.DATA_ENCRYPTION_CURRENT_KEY_ID) return payload;
	return encryptString(decryptString(payload));
}
