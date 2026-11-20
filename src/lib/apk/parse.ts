/**
 * Minimal in-browser APK inspector (no dependencies):
 *   - finds AndroidManifest.xml in the zip and decodes Android binary XML (AXML)
 *     for package, versionCode, versionName and minSdkVersion;
 *   - reads the APK Signature Scheme v2/v3 block and returns the SHA-256 of the
 *     first signer's certificate (the value Play shows as the app signing key).
 */

export type ApkInfo = {
  packageName: string;
  versionCode: number;
  versionName: string;
  minSdk: number | null;
  signingCertSha256: string | null;
};

const ATTR_IDS = { versionCode: 0x0101021b, versionName: 0x0101021c, minSdkVersion: 0x0101020c } as const;

type Entry = { name: string; method: number; compSize: number; size: number; localOffset: number };

export function readCentralDirectory(buf: ArrayBuffer): { entries: Entry[]; cdOffset: number } {
  const dv = new DataView(buf);
  const minEocd = Math.max(0, buf.byteLength - 65557);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= minEocd; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip/APK file");
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  const entries: Entry[] = [];
  const dec = new TextDecoder();
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("Corrupt central directory");
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    entries.push({ name, method, compSize, size, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { entries, cdOffset };
}

async function readEntry(buf: ArrayBuffer, e: Entry): Promise<ArrayBuffer> {
  const dv = new DataView(buf);
  if (dv.getUint32(e.localOffset, true) !== 0x04034b50) throw new Error("Corrupt local header");
  const nameLen = dv.getUint16(e.localOffset + 26, true);
  const extraLen = dv.getUint16(e.localOffset + 28, true);
  const start = e.localOffset + 30 + nameLen + extraLen;
  const data = new Uint8Array(buf, start, e.compSize);
  if (e.method === 0) return data.slice().buffer;
  if (e.method !== 8) throw new Error(`Unsupported compression ${e.method}`);
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).arrayBuffer();
}

/** Decodes the attributes of <manifest> and <uses-sdk> from Android binary XML. */
export function parseAxml(buf: ArrayBuffer): { packageName: string; versionCode: number; versionName: string; minSdk: number | null } {
  const dv = new DataView(buf);
  if (dv.getUint16(0, true) !== 0x0003) throw new Error("AndroidManifest.xml is not binary XML");
  let strings: string[] = [];
  let resIds: number[] = [];
  const out = { packageName: "", versionCode: 0, versionName: "", minSdk: null as number | null };
  let p = dv.getUint16(2, true);
  while (p < buf.byteLength) {
    const type = dv.getUint16(p, true);
    const headerSize = dv.getUint16(p + 2, true);
    const size = dv.getUint32(p + 4, true);
    if (size === 0) break;
    if (type === 0x0001) strings = readStringPool(buf, p);
    else if (type === 0x0180) {
      resIds = [];
      for (let q = p + headerSize; q < p + size; q += 4) resIds.push(dv.getUint32(q, true));
    } else if (type === 0x0102) {
      const name = strings[dv.getUint32(p + 20, true)] ?? "";
      const attrStart = dv.getUint16(p + 24, true);
      const attrSize = dv.getUint16(p + 26, true);
      const attrCount = dv.getUint16(p + 28, true);
      for (let i = 0; i < attrCount; i++) {
        const a = p + 16 + attrStart + i * attrSize;
        const nameIdx = dv.getUint32(a + 4, true);
        const attrName = strings[nameIdx] ?? "";
        const resId = resIds[nameIdx];
        const raw = dv.getInt32(a + 8, true);
        const dataType = dv.getUint8(a + 15);
        const data = dv.getUint32(a + 16, true);
        const str = raw >= 0 ? (strings[raw] ?? "") : dataType === 0x03 ? (strings[data] ?? "") : "";
        const num = dataType >= 0x10 && dataType <= 0x1f ? data : Number.parseInt(str, 10);
        if (name === "manifest") {
          if (attrName === "package") out.packageName = str;
          if (resId === ATTR_IDS.versionCode || attrName === "versionCode") out.versionCode = num;
          if (resId === ATTR_IDS.versionName || attrName === "versionName") out.versionName = str || String(num);
        }
        if (name === "uses-sdk" && (resId === ATTR_IDS.minSdkVersion || attrName === "minSdkVersion")) out.minSdk = Number.isFinite(num) ? num : null;
      }
      if (name === "application") break;
    }
    p += size;
  }
  if (!out.packageName) throw new Error("No package name in manifest");
  return out;
}

function readStringPool(buf: ArrayBuffer, p: number): string[] {
  const dv = new DataView(buf);
  const count = dv.getUint32(p + 8, true);
  const flags = dv.getUint32(p + 16, true);
  const stringsStart = dv.getUint32(p + 20, true);
  const utf8 = (flags & 0x100) !== 0;
  const headerSize = dv.getUint16(p + 2, true);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let s = p + stringsStart + dv.getUint32(p + headerSize + i * 4, true);
    if (utf8) {
      s += dv.getUint8(s) & 0x80 ? 2 : 1; // utf16 length
      let len = dv.getUint8(s);
      if (len & 0x80) {
        len = ((len & 0x7f) << 8) | dv.getUint8(s + 1);
        s += 2;
      } else s += 1;
      out.push(new TextDecoder().decode(new Uint8Array(buf, s, len)));
    } else {
      let len = dv.getUint16(s, true);
      if (len & 0x8000) {
        len = ((len & 0x7fff) << 16) | dv.getUint16(s + 2, true);
        s += 4;
      } else s += 2;
      out.push(new TextDecoder("utf-16le").decode(new Uint8Array(buf, s, len * 2)));
    }
  }
  return out;
}

/** SHA-256 of the first certificate in the v3 (or v2) signing block, as AA:BB:… hex. */
export async function signingCertSha256(buf: ArrayBuffer, cdOffset: number): Promise<string | null> {
  const dv = new DataView(buf);
  if (cdOffset < 32) return null;
  const magic = new TextDecoder().decode(new Uint8Array(buf, cdOffset - 16, 16));
  if (magic !== "APK Sig Block 42") return null;
  const blockSize = Number(dv.getBigUint64(cdOffset - 24, true));
  const start = cdOffset - (blockSize + 8);
  let p = start + 8;
  const end = cdOffset - 24;
  const found: Record<number, number> = {};
  while (p < end) {
    const len = Number(dv.getBigUint64(p, true));
    const id = dv.getUint32(p + 8, true);
    found[id] = p + 12;
    p += 8 + len;
  }
  const v = found[0xf05368c0] ?? found[0x7109871a];
  if (v === undefined) return null;
  // signers: len-prefixed sequence → first signer (len-prefixed) → signed data (len-prefixed)
  let q = v + 4; // skip sequence length
  q += 4; // first signer length
  q += 4; // signed data length
  const digestsLen = dv.getUint32(q, true);
  q += 4 + digestsLen;
  q += 4; // certificates sequence length
  const certLen = dv.getUint32(q, true);
  const cert = new Uint8Array(buf, q + 4, certLen);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", cert));
  return [...hash].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");
}

export async function inspectApk(buf: ArrayBuffer): Promise<ApkInfo> {
  const { entries, cdOffset } = readCentralDirectory(buf);
  const manifest = entries.find((e) => e.name === "AndroidManifest.xml");
  if (!manifest) throw new Error("No AndroidManifest.xml: this is not an APK");
  const m = parseAxml(await readEntry(buf, manifest));
  return { ...m, signingCertSha256: await signingCertSha256(buf, cdOffset).catch(() => null) };
}

/** Rules the admin upload enforces before anything is sent. */
export function validateApk(info: ApkInfo, latestVersionCode: number, expectedCert?: string | null): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (info.packageName !== "com.notteodo.notteodo") errors.push(`Package is ${info.packageName}, expected com.notteodo.notteodo.`);
  if (!(info.versionCode > latestVersionCode)) errors.push(`versionCode ${info.versionCode} must be higher than the latest (${latestVersionCode}).`);
  if (!info.signingCertSha256) warnings.push("No v2/v3 signature found. Is this a release build?");
  else if (expectedCert && info.signingCertSha256 !== expectedCert.toUpperCase())
    warnings.push("Signed with a different certificate than the previous release: installed copies won't update from this APK.");
  return { errors, warnings };
}
