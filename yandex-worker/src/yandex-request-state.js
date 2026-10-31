const PROVIDER_PAGE = 'https://yandex.ru/sprav/companies/?no_redirect=1';

// Request-level values are captured only from the authenticated BrowserContext.
// They are intentionally kept in memory and never returned by a CLI command.
export class YandexRequestStateCapture {
  constructor(context) {
    this.context = context;
    this.onRequest = this.#capture.bind(this);
    context.on('request', this.onRequest);
  }

  async refresh({ timeoutMs = 15_000 } = {}) {
    this.headers = undefined;
    const page = this.context.pages()[0] ?? await this.context.newPage();
    const captured = this.#waitForCapture(timeoutMs);
    try {
      await page.goto(PROVIDER_PAGE, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      return await captured;
    } catch {
      return false;
    } finally {
      this.#finishWait(false);
    }
  }

  getWriteHeaders() {
    if (!this.headers) return undefined;
    return {
      'x-csrf-token': this.headers.csrfToken,
      'X-Yandex-ICookie': this.headers.yandexICookie
    };
  }

  dispose() {
    this.context.off('request', this.onRequest);
    this.#finishWait(false);
  }

  #capture(request) {
    const url = request.url();
    if (!url.startsWith('https://yandex.ru/sprav/api/')) return;
    const headers = request.headers();
    const csrfToken = headers['x-csrf-token'];
    const yandexICookie = headers['x-yandex-icookie'];
    if (!csrfToken || !yandexICookie) return;
    this.headers = { csrfToken, yandexICookie };
    this.#finishWait(true);
  }

  #waitForCapture(timeoutMs) {
    return new Promise((resolve) => {
      this.pending = { resolve, timeout: setTimeout(() => this.#finishWait(false), timeoutMs) };
    });
  }

  #finishWait(result) {
    if (!this.pending) return;
    clearTimeout(this.pending.timeout);
    this.pending.resolve(result);
    this.pending = undefined;
  }
}
