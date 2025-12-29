const DEFAULT_DEVOPS_BASE_URL =
  'https://preview-sandbox--08aa848c2c6112c212d7b47df9e77830.base44.app';

type DevOpsHeaders = Record<string, string>;

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const resolveBaseUrl = () =>
  trimTrailingSlash(Deno.env.get('DEVOPS_BASE_URL') ?? DEFAULT_DEVOPS_BASE_URL);

const resolveHeaders = (): DevOpsHeaders => {
  const headers: DevOpsHeaders = {
    'Content-Type': 'application/json',
  };

  const apiKey = Deno.env.get('DEVOPS_API_KEY');
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

export const resolveAppIdentity = (providedId?: string, providedName?: string) => {
  const appId = providedId || Deno.env.get('DEVOPS_APP_ID') || 'base44-app';
  const appName =
    providedName || Deno.env.get('DEVOPS_APP_NAME') || 'Base44 App';

  return { appId, appName } as const;
};

export const sendDevOpsEvent = async <T>(path: string, payload: T) => {
  const baseUrl = resolveBaseUrl();
  const headers = resolveHeaders();

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `DevOps request failed (${response.status}): ${body || 'no response body'}`,
    );
  }

  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
};
