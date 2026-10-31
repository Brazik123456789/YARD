const PROVIDER_PAGE = 'https://yandex.ru/sprav/companies/?no_redirect=1';

// Request-level values are captured only from the authenticated BrowserContext.
// They are intentionally kept in memory and never returned by a CLI command.
export class YandexRequestStateCapture {
  constructor(context) {
    this.context = context;
    this.onRequest = this.#capture.bind(this);
    this.#reset();
    context.on('request', this.onRequest);
  }

  async refresh({ timeoutMs = 15_000 } = {}) {
    this.#reset({ retainHeaders: true });
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

  async diagnose({ timeoutMs = 15_000 } = {}) {
    this.#reset({ retainHeaders: false });
    const page = this.context.pages()[0] ?? await this.context.newPage();
    const observed = this.#waitForCapture(timeoutMs);
    try {
      await page.goto(PROVIDER_PAGE, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    } catch {
      // The redacted diagnostic is still useful when authentication redirects or page loading fails.
    } finally {
      await observed;
      this.#finishWait(false);
    }
    return this.getDiagnostic();
  }

  getWriteHeaders() {
    if (!this.headers) return undefined;
    return {
      'x-csrf-token': this.headers.csrfToken,
      'X-Yandex-ICookie': this.headers.yandexICookie
    };
  }

  getDiagnostic() {
    return { ...this.diagnostic };
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
    this.diagnostic.yandexBusinessApiRequestObserved = true;
    this.diagnostic.requestCsrfTokenObserved ||= Boolean(csrfToken);
    this.diagnostic.yandexICookieObserved ||= Boolean(yandexICookie);
    if (!csrfToken || !yandexICookie) return;
    this.diagnostic.bothRequiredHeadersObserved = true;
    if (this.retainHeaders) this.headers = { csrfToken, yandexICookie };
    this.#finishWait(true);
  }

  #reset({ retainHeaders = true } = {}) {
    this.#finishWait(false);
    this.headers = undefined;
    this.retainHeaders = retainHeaders;
    this.diagnostic = {
      yandexBusinessApiRequestObserved: false,
      requestCsrfTokenObserved: false,
      yandexICookieObserved: false,
      bothRequiredHeadersObserved: false
    };
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
