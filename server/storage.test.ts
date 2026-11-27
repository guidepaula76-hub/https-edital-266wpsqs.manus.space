import { describe, expect, it } from "vitest";
import { validateStorageUrl } from "./storage";

describe("validateStorageUrl", () => {
  it("accepts HTTPS signed URLs", () => {
    expect(validateStorageUrl("https://storage.example.com/object?signature=abc")).toBe(
      "https://storage.example.com/object?signature=abc",
    );
  });

  it("rejects plain HTTP URLs", () => {
    expect(() => validateStorageUrl("http://storage.example.com/object")).toThrow(
      "Storage URL must use HTTPS",
    );
  });

  it("rejects URLs containing embedded credentials", () => {
    expect(() => validateStorageUrl("https://user:secret@storage.example.com/object")).toThrow(
      "Storage URL must use HTTPS",
    );
  });

  it("rejects malformed and empty values", () => {
    expect(() => validateStorageUrl("not-a-url")).toThrow("Storage returned an invalid URL");
    expect(() => validateStorageUrl("")).toThrow("Storage returned an empty URL");
    expect(() => validateStorageUrl(undefined)).toThrow("Storage returned an empty URL");
  });
});
