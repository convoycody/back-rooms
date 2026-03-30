const DEFAULT_BASE_URL =
  Deno.env.get('PLATFORM_API_BASE_URL') ||
  Deno.env.get('API_BASE_URL') ||
  'https://api.vertical-holdings.dev';

const SERVICE_API_KEY = Deno.env.get('SERVICE_API_KEY') || '';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const extractBearer = (req?: Request) => {
  if (!req) return '';
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
};

const request = async (
  path: string,
  options: RequestInit,
  baseUrl = DEFAULT_BASE_URL,
) => {
  const res = await fetch(
    path.startsWith('http') ? path : `${baseUrl}${path}`,
    options,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const buildEntities = (headers: HeadersInit, baseUrl?: string) =>
  new Proxy(
    {},
    {
      get: (_target, prop) => {
        const resource = prop.toString();
        return {
          list: (orderBy?: string, limit?: number) =>
            request(
              `/api/${resource}${
                orderBy ? `?orderBy=${encodeURIComponent(orderBy)}` : ''
              }${limit ? `&limit=${limit}` : ''}`,
              { method: 'GET', headers },
              baseUrl,
            ),
          filter: (filters: Record<string, unknown> = {}, orderBy?: string, limit?: number) =>
            request(
              `/api/${resource}/filter`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({ filters, orderBy, limit }),
              },
              baseUrl,
            ),
          create: (data: unknown) =>
            request(
              `/api/${resource}`,
              { method: 'POST', headers, body: JSON.stringify(data) },
              baseUrl,
            ),
          update: (id: string, data: unknown) =>
            request(
              `/api/${resource}/${id}`,
              { method: 'PUT', headers, body: JSON.stringify(data) },
              baseUrl,
            ),
        };
      },
    },
  );

export const createPlatformClient = (req?: Request) => {
  const userBearer = extractBearer(req);
  const userHeaders: HeadersInit = {
    ...jsonHeaders,
    ...(userBearer ? { Authorization: `Bearer ${userBearer}` } : {}),
  };

  const serviceHeaders: HeadersInit = {
    ...jsonHeaders,
    ...(SERVICE_API_KEY ? { Authorization: `Bearer ${SERVICE_API_KEY}` } : {}),
  };

  const auth = {
    me: () =>
      request(
        '/auth/me',
        {
          method: 'GET',
          headers: userHeaders,
        },
      ),
  };

  const client = {
    auth,
    entities: buildEntities(userHeaders),
    asServiceRole: {
      entities: buildEntities(serviceHeaders),
      functions: {
        invoke: (name: string, payload: unknown = {}) =>
          request(
            `/functions/${name}`,
            {
              method: 'POST',
              headers: serviceHeaders,
              body: JSON.stringify(payload),
            },
          ),
      },
    },
    functions: {
      invoke: (name: string, payload: unknown = {}) =>
        request(
          `/functions/${name}`,
          {
            method: 'POST',
            headers: userHeaders,
            body: JSON.stringify(payload),
          },
        ),
    },
  };

  return client;
};
