import { AuthRequiredError, ProviderError, UnknownResultError } from './errors.js';
import { extractReplyTokens, normalizeCompany, normalizeLocation, normalizeReviewPage } from './yandex-mappers.js';

const ORIGIN = 'https://yandex.ru';

export class YandexBusinessClient {
  constructor(request, { writeHeadersProvider = () => ({}) } = {}) {
    this.request = request;
    this.writeHeadersProvider = writeHeadersProvider;
  }

  async checkConnection() {
    await this.discoverOrganizations();
  }

  async discoverOrganizations(filter = '') {
    const payload = await this.#getJson(`/sprav/api/companies?filter=${encodeURIComponent(filter)}`);
    if (!Array.isArray(payload.listCompanies)) {
      throw new ProviderError('PROVIDER_CONTRACT_CHANGED', 'Yandex companies response is missing listCompanies');
    }
    return payload.listCompanies.map(normalizeCompany);
  }

  async discoverLocations({ chainId, chainPermalink, status = 'all', geoId, page = 1 }) {
    const query = new URLSearchParams({ status, chainPermalink: String(chainPermalink), page: String(page) });
    if (geoId !== undefined) query.set('geoId', String(geoId));
    const payload = await this.#getJson(`/sprav/api/chain/${encodeURIComponent(chainId)}/branches?${query}`);
    const list = payload.companyList;
    if (!Array.isArray(list?.companies) || !list.pager) {
      throw new ProviderError('PROVIDER_CONTRACT_CHANGED', 'Yandex branches response has an unexpected structure');
    }
    return {
      pager: { limit: list.pager.limit, offset: list.pager.offset, total: list.pager.total },
      locations: list.companies.map((company) => normalizeLocation(company, chainId))
    };
  }

  async listReviews({ locationId, page = 1, ranking = 'by_time', unread }) {
    const query = new URLSearchParams({ page: String(page), ranking });
    if (unread !== undefined) query.set('unread', String(unread));
    const payload = await this.#getJson(`/sprav/api/${encodeURIComponent(locationId)}/reviews?${query}`);
    return normalizeReviewPage(payload);
  }

  async writeReply({ locationId, reviewId, text }) {
    if (!text || text.length > 2500) {
      throw new ProviderError('PROVIDER_CONTRACT_CHANGED', 'Reply text must contain 1 to 2500 characters');
    }
    const current = await this.#getReviewsPayload(locationId);
    const item = current.list.items.find((review) => String(review.id ?? review.cmnt_entity_id) === String(reviewId));
    if (!item) throw new ProviderError('REVIEW_NOT_FOUND', 'Review was not found in the refreshed first page');
    const reviewLocationId = String(item.object?.id ?? '').match(/\/sprav\/([^/?]+)/)?.[1];
    if (reviewLocationId !== String(locationId)) {
      throw new ProviderError('LOCATION_MISMATCH', 'Review does not belong to the requested location');
    }
    if (item.owner_comment?.text === text) return { outcome: 'ALREADY_APPLIED', moderationStatus: item.owner_comment.moderation_status };
    if (item.owner_comment) throw new ProviderError('PROVIDER_CONTRACT_CHANGED', 'Review already has a different owner reply; edit is out of M0 scope');

    const tokens = extractReplyTokens(current, reviewId);
    const headers = this.writeHeadersProvider();
    if (!headers['x-csrf-token'] || !headers['X-Yandex-ICookie']) {
      throw new ProviderError('CSRF_INVALID', 'Fresh request CSRF and Yandex ICookie values are required for a controlled write');
    }
    try {
      const response = await this.request.post(`${ORIGIN}/sprav/api/ugcpub/business-answer`, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          ...headers
        },
        data: { reviewId, text, ...tokens },
        timeout: 30_000
      });
      if (!response.ok()) this.#throwForResponse(response, 'Unable to submit Yandex review reply');
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      return this.#reconcileUnknownReply(locationId, reviewId, text, error);
    }

    return this.#reconcileReply(locationId, reviewId, text, 'SUBMITTED');
  }

  async #reconcileUnknownReply(locationId, reviewId, text, originalError) {
    try {
      const reconciliation = await this.#reconcileReply(locationId, reviewId, text, 'RECONCILED_AFTER_UNKNOWN_RESULT');
      if (reconciliation.outcome !== 'NOT_CONFIRMED') return reconciliation;
    } catch (error) {
      if (error instanceof AuthRequiredError) throw error;
    }
    throw new UnknownResultError('Yandex reply outcome is unknown; no retry was performed', { cause: originalError });
  }

  async #reconcileReply(locationId, reviewId, text, defaultOutcome) {
    const payload = await this.#getReviewsPayload(locationId);
    const item = payload.list.items.find((review) => String(review.id ?? review.cmnt_entity_id) === String(reviewId));
    if (item?.owner_comment?.text === text) {
      return { outcome: defaultOutcome, moderationStatus: item.owner_comment.moderation_status };
    }
    return { outcome: 'NOT_CONFIRMED' };
  }

  async #getReviewsPayload(locationId) {
    return this.#getJson(`/sprav/api/${encodeURIComponent(locationId)}/reviews?page=1&ranking=by_time`);
  }

  async #getJson(relativePath) {
    let response;
    try {
      response = await this.request.get(`${ORIGIN}${relativePath}`, { headers: { Accept: 'application/json' }, timeout: 30_000 });
    } catch (error) {
      throw new ProviderError('PROVIDER_TEMPORARY_ERROR', 'Yandex request failed', { cause: error });
    }
    if (!response.ok()) this.#throwForResponse(response, 'Yandex request failed');
    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) throw new AuthRequiredError('Yandex returned a non-JSON response; login may be required');
    try {
      return await response.json();
    } catch (error) {
      throw new ProviderError('PROVIDER_CONTRACT_CHANGED', 'Yandex returned invalid JSON', { cause: error });
    }
  }

  #throwForResponse(response, message) {
    const status = response.status();
    if (status === 401 || status === 403) throw new AuthRequiredError(message, { status });
    if (status === 429) throw new ProviderError('RATE_LIMITED', message, { status });
    throw new ProviderError('PROVIDER_TEMPORARY_ERROR', message, { status });
  }
}
