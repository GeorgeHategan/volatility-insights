#!/usr/bin/env node

import {createCipheriv, randomBytes} from "node:crypto";
import {chmod, mkdir, readFile, writeFile} from "node:fs/promises";
import {homedir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = process.argv[2] ?? "/tmp/volatility-insights-curve.json";
const output = resolve(root, "vx-e5295618a8745cd072073e52/data.enc");
const keyFile = resolve(homedir(), ".config/volatility-insights/curve.key");

async function loadKey() {
  try {
    const saved = (await readFile(keyFile, "utf8")).trim();
    if (!/^[0-9a-f]{64}$/i.test(saved)) {
      throw new Error(`Invalid key in ${keyFile}`);
    }
    return Buffer.from(saved, "hex");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const key = randomBytes(32);
    await mkdir(dirname(keyFile), {recursive: true, mode: 0o700});
    await writeFile(keyFile, `${key.toString("hex")}\n`, {mode: 0o600});
    return key;
  }
}

const key = await loadKey();
const plaintext = await readFile(source);
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([
  cipher.update(plaintext),
  cipher.final(),
  cipher.getAuthTag()
]);
const payload = {
  version: 1,
  iv: iv.toString("base64url"),
  data: ciphertext.toString("base64url")
};

await writeFile(output, `${JSON.stringify(payload)}\n`);
await chmod(output, 0o644);
console.log(`Encrypted ${plaintext.length.toLocaleString()} bytes to ${output}`);
console.log(`Access URL: https://volatility-insights.com/vx-e5295618a8745cd072073e52/#${key.toString("hex")}`);