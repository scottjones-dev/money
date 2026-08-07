import { describe, expect, it } from "vitest";

import {
	decryptJson,
	encryptJson,
	rotateEncryptedPayload,
} from "@/lib/encryption";

describe("sensitive payload encryption", () => {
	it("round-trips JSON and records the key ID", () => {
		const encrypted = encryptJson({ income: "1200.00", disability: true });
		expect(encrypted.value).not.toContain("1200.00");
		expect(decryptJson(encrypted)).toEqual({
			income: "1200.00",
			disability: true,
		});
		expect(rotateEncryptedPayload(encrypted)).toEqual(encrypted);
	});

	it("rejects tampered ciphertext", () => {
		const encrypted = encryptJson({ secret: "value" });
		const tampered = {
			...encrypted,
			value: `${encrypted.value.slice(0, -1)}A`,
		};
		expect(() => decryptJson(tampered)).toThrow();
	});
});
