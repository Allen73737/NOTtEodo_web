import { PACKAGE_NAME } from "@/content/site";

/** Digital Asset Links statement for com.notteodo.notteodo with the given SHA-256 cert fingerprints. */
export function assetLinks(fingerprints: string[]) {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: PACKAGE_NAME, sha256_cert_fingerprints: fingerprints },
    },
  ];
}
