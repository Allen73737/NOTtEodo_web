import { describe, expect, it } from "vitest";
import { assetLinks } from "@/lib/assetlinks";

describe("assetlinks.json", () => {
  it("declares the app package with every fingerprint for handle_all_urls", () => {
    const fp = "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";
    const doc = assetLinks([fp]);
    expect(doc).toHaveLength(1);
    expect(doc[0]!.relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    expect(doc[0]!.target).toEqual({
      namespace: "android_app",
      package_name: "com.notteodo.notteodo",
      sha256_cert_fingerprints: [fp],
    });
    expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });
});
