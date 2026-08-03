export const withTenant = (query, tenantId) => {
  if (tenantId) query.tenantId = tenantId;
  return query;
};

export const tenantOrNull = (tenantId) => tenantId || null;
