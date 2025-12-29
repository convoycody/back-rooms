const getTokenFromHeaders = (req: Request) => {
  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return apiKeyHeader || null;
};

type ServiceAuthOptions = {
  allowAnonymous?: boolean;
};

export const requireServiceAuth = (req: Request, options: ServiceAuthOptions = {}) => {
  const configured = Deno.env.get('SERVICE_API_KEY');
  if (!configured && options.allowAnonymous) {
    return { ok: true, identity: 'anonymous' } as const;
  }

  const token = getTokenFromHeaders(req);
  if (token && configured && token === configured) {
    return { ok: true, identity: 'service' } as const;
  }

  if (options.allowAnonymous && !configured) {
    return { ok: true, identity: 'anonymous' } as const;
  }

  return { ok: false, identity: null } as const;
};
