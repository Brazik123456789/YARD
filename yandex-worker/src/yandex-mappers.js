export function normalizeCompany(company) {
  return {
    objectType: stringOrUndefined(company.type),
    internalProviderId: stringOrUndefined(company.id),
    permanentId: stringOrUndefined(company.permanent_id ?? company.permanentId),
    chainId: stringOrUndefined(company.tycoon_id ?? company.tycoonId ?? company.chain?.id),
    name: stringOrUndefined(company.name ?? company.title),
    role: stringOrUndefined(company.object_role ?? company.objectRole ?? company.role),
    access: company.noAccess === undefined ? undefined : !company.noAccess
  };
}

export function normalizeLocation(company, fallbackChainId) {
  return {
    provider: 'YANDEX',
    externalLocationId: requiredString(company.permanent_id ?? company.permanentId, 'permanent location ID'),
    internalProviderId: stringOrUndefined(company.id),
    name: stringOrUndefined(company.name ?? company.title),
    address: extractAddress(company),
    networkChainId: stringOrUndefined(company.tycoon_id ?? company.chain?.id ?? fallbackChainId),
    status: stringOrUndefined(company.status ?? company.state)
  };
}

export function normalizeReview(item) {
  return {
    externalReviewId: requiredString(item.id ?? item.cmnt_entity_id, 'review ID'),
    locationExternalId: extractLocationId(item.object?.id),
    rating: item.rating ?? item.public_rating,
    text: stringOrUndefined(item.full_text ?? item.snippet),
    createdAtExternal: item.time_created ?? undefined,
    author: {
      name: stringOrUndefined(item.author?.user),
      externalId: stringOrUndefined(item.author?.public_id ?? item.author?.uid)
    },
    ownerReply: item.owner_comment
      ? {
          text: stringOrUndefined(item.owner_comment.text),
          moderationStatus: stringOrUndefined(item.owner_comment.moderation_status),
          createdAtExternal: item.owner_comment.time_created ?? undefined
        }
      : undefined,
    unread: item.notify_status === 'unread',
    appealSubmitted: Boolean(item.owner_complaint)
  };
}

export function normalizeReviewPage(payload) {
  const list = payload?.list;
  if (!list || !Array.isArray(list.items) || !list.pager) {
    throw new Error('Yandex reviews response has an unexpected structure');
  }
  return {
    pager: {
      limit: list.pager.limit,
      offset: list.pager.offset,
      total: list.pager.total
    },
    reviews: list.items.map(normalizeReview)
  };
}

export function extractReplyTokens(payload, reviewId) {
  const review = payload?.list?.items?.find((item) => String(item.id ?? item.cmnt_entity_id) === String(reviewId));
  if (!payload?.list?.csrf_token || !review?.business_answer_csrf_token) {
    throw new Error('Fresh Yandex review CSRF values are unavailable for this review');
  }
  return {
    reviewsCsrfToken: payload.list.csrf_token,
    answerCsrfToken: review.business_answer_csrf_token
  };
}

function extractAddress(company) {
  if (typeof company.address === 'string') return company.address;
  if (company.address?.formatted) return company.address.formatted;
  if (company.address?.full) return company.address.full;
  return stringOrUndefined(company.address_string ?? company.addressString);
}

function extractLocationId(value) {
  if (!value) return undefined;
  const match = String(value).match(/\/sprav\/([^/?]+)/);
  return match?.[1];
}

function requiredString(value, field) {
  const normalized = stringOrUndefined(value);
  if (!normalized) throw new Error(`Yandex response is missing ${field}`);
  return normalized;
}

function stringOrUndefined(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}
