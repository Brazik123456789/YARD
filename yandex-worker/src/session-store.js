import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const FILE_VERSION = 1;

export class EncryptedSessionStore {
  constructor(filePath, encryptionSecret) {
    if (!encryptionSecret) {
      throw new Error('YANDEX_SESSION_STATE_ENCRYPTION_KEY is required to persist a session');
    }
    this.filePath = filePath;
    this.encryptionSecret = encryptionSecret;
  }

  async load() {
    try {
      const encrypted = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (encrypted.version !== FILE_VERSION || encrypted.algorithm !== ALGORITHM) {
        throw new Error('Unsupported encrypted session-state format');
      }
      const salt = Buffer.from(encrypted.salt, 'base64');
      const key = deriveKey(this.encryptionSecret, salt);
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encrypted.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
      const cleartext = Buffer.concat([
        decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
        decipher.final()
      ]);
      return JSON.parse(cleartext.toString('utf8'));
    } catch (error) {
      if (error?.code === 'ENOENT') return undefined;
      throw new Error('Unable to restore encrypted Yandex session state', { cause: error });
    }
  }

  async save(storageState) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = deriveKey(this.encryptionSecret, salt);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(storageState), 'utf8'), cipher.final()]);
    const document = JSON.stringify({
      version: FILE_VERSION,
      algorithm: ALGORITHM,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64')
    });

    await mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await writeFile(this.filePath, document, { mode: 0o600 });
    await chmod(this.filePath, 0o600);
  }
}

function deriveKey(secret, salt) {
  return scryptSync(secret, salt, 32);
}
