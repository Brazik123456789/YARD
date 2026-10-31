import path from 'node:path';
import { chromium } from 'playwright';
import { AccountState } from './account-state.js';
import { AuthRequiredError } from './errors.js';
import { EncryptedSessionStore } from './session-store.js';
import { YandexBusinessClient } from './yandex-client.js';
import { YandexRequestStateCapture } from './yandex-request-state.js';

export class TechnicalAccountRuntime {
  constructor({ accountId, sessionDirectory, encryptionSecret }) {
    this.accountId = accountId;
    this.sessionDirectory = sessionDirectory;
    this.encryptionSecret = encryptionSecret;
    this.state = AccountState.DISCONNECTED;
  }

  async start({ headless = false } = {}) {
    const stateFile = path.join(this.sessionDirectory, `${safeFileName(this.accountId)}.state.enc`);
    this.sessionStore = new EncryptedSessionStore(stateFile, this.encryptionSecret);
    const storageState = await this.sessionStore.load();
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({ storageState });
    this.requestState = new YandexRequestStateCapture(this.context);
    this.client = new YandexBusinessClient(this.context.request, { requestHeadersProvider: () => this.requestState.getWriteHeaders() });
    this.state = AccountState.DISCONNECTED;
  }

  async openManualLogin() {
    this.#requireStarted();
    const page = this.context.pages()[0] ?? await this.context.newPage();
    await page.goto('https://passport.yandex.ru/auth', { waitUntil: 'domcontentloaded' });
    return page;
  }

  async checkConnection() {
    await this.execute(() => this.client.checkConnection());
    return { state: this.state };
  }

  async refreshWriteRequestState() {
    this.#requireStarted();
    return this.requestState.refresh();
  }

  async diagnoseWriteRequestState() {
    this.#requireStarted();
    return this.requestState.diagnose();
  }

  async execute(operation) {
    this.#requireStarted();
    if (this.state === AccountState.AUTH_REQUIRED) throw new AuthRequiredError();
    try {
      const result = await operation();
      this.state = AccountState.CONNECTED;
      return result;
    } catch (error) {
      this.state = error instanceof AuthRequiredError ? AccountState.AUTH_REQUIRED : AccountState.ERROR;
      throw error;
    }
  }

  async saveSession() {
    this.#requireStarted();
    await this.sessionStore.save(await this.context.storageState());
  }

  async stop({ saveSession = true } = {}) {
    if (!this.context) return;
    if (saveSession) await this.saveSession();
    this.requestState.dispose();
    await this.context.close();
    await this.browser.close();
    this.context = undefined;
    this.browser = undefined;
    this.requestState = undefined;
    this.state = AccountState.DISCONNECTED;
  }

  #requireStarted() {
    if (!this.context || !this.client) throw new Error('Technical account runtime is not started');
  }
}

function safeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, '_');
}
