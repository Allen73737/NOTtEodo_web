import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inspectApk, readCentralDirectory, validateApk } from "@/lib/apk/parse";

const APK = process.env.NOTTEODO_TEST_APK ?? "C:/My_Project/Notteodo/frontend/build/app/outputs/flutter-apk/app-release.apk";

describe("APK validation rules", () => {
  const ok = { packageName: "com.notteodo.notteodo", versionCode: 5, versionName: "1.2.0", minSdk: 24, signingCertSha256: "AA" };
  it("rejects the wrong package", () => {
    expect(validateApk({ ...ok, packageName: "com.evil.app" }, 1).errors[0]).toMatch(/expected com\.notteodo\.notteodo/);
  });
  it("rejects a versionCode that is not higher than the latest", () => {
    expect(validateApk(ok, 5).errors[0]).toMatch(/must be higher/);
    expect(validateApk(ok, 4).errors).toEqual([]);
  });
  it("warns on a signing certificate change", () => {
    expect(validateApk(ok, 1, "BB").warnings[0]).toMatch(/different certificate/);
  });
  it("rejects non-zip input", () => {
    expect(() => readCentralDirectory(new ArrayBuffer(64))).toThrow(/Not a zip/);
  });
});

describe.runIf(existsSync(APK))("real NOTtEodo release APK", () => {
  it("reads package, version and signing certificate", async () => {
    const b = readFileSync(APK);
    const info = await inspectApk(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    console.log(info);
    expect(info.packageName).toBe("com.notteodo.notteodo");
    expect(info.versionCode).toBeGreaterThan(0);
    expect(info.versionName).toMatch(/^\d+\.\d+\.\d+/);
    expect(info.signingCertSha256 ?? "").toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });
});
