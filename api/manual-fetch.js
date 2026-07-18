export default async function handler(req, res) {
  const manualFetchVersion = '2026-06-04-cron-v3';

  const origin = requestOrigin(req);
  if (origin && isSameOriginRequest(req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (origin && !isSameOriginRequest(req)) {
      return res.status(403).json({ error: 'Forbidden cross-origin manual fetch request', manualFetchVersion });
    }
    return res.status(204).end();
  }

  const isCron = req.method === 'GET' || req.query?.cron === '1';
  if (req.method !== 'POST' && !isCron) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed', manualFetchVersion });
  }

  try {
    if (isCron) {
      const cronSecret = process.env.CRON_SECRET;
      const authorization = req.headers['authorization'] || '';
      if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized cron request', manualFetchVersion });
      }
    } else {
      const manualFetchSecret = process.env.MANUAL_FETCH_SECRET;
      const authorization = req.headers['authorization'] || '';
      if (!manualFetchSecret || authorization !== `Bearer ${manualFetchSecret}`) {
        return res.status(401).json({ error: 'Unauthorized manual fetch request', manualFetchVersion });
      }
      if (!isSameOriginRequest(req)) {
        return res.status(403).json({ error: 'Forbidden cross-origin manual fetch request', manualFetchVersion });
      }
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'tt88737';
    const repo = process.env.GITHUB_REPO || 'Abc';
    const ref = process.env.GITHUB_REF || 'main';

    if (!token) {
      return res.status(500).json({ error: 'Missing GITHUB_TOKEN environment variable', manualFetchVersion });
    }

    const body = isCron ? {} : (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}));
    const defaultAmUrl = 'https://2025kj.zkclhb.com:2025/am.html';
    const defaultHkUrl = 'https://2025kj.zkclhb.com:2025/hk.html';
    const selectedSource = body.source === 'hk' ? 'hk' : 'am';
    const selectedSourceUrl = String(body.sourceUrl || '').trim();
    const selectedBaseUrl = String(body.baseUrl || selectedSourceUrl).trim();
    const amSourceUrl = String(body.amSourceUrl || (selectedSource === 'am' ? selectedSourceUrl : defaultAmUrl) || defaultAmUrl).trim();
    const amBaseUrl = String(body.amBaseUrl || (selectedSource === 'am' ? selectedBaseUrl : amSourceUrl) || amSourceUrl).trim();
    const hkSourceUrl = String(body.hkSourceUrl || (selectedSource === 'hk' ? selectedSourceUrl : defaultHkUrl) || defaultHkUrl).trim();
    const hkBaseUrl = String(body.hkBaseUrl || (selectedSource === 'hk' ? selectedBaseUrl : hkSourceUrl) || hkSourceUrl).trim();

    if (!/^https?:\/\/.+/i.test(amSourceUrl) || !/^https?:\/\/.+/i.test(hkSourceUrl)) {
      return res.status(400).json({ error: 'Invalid sourceUrl', manualFetchVersion });
    }
    for (const url of [amSourceUrl, amBaseUrl, hkSourceUrl, hkBaseUrl]) {
      if (!isAllowedCollectionUrl(url)) {
        return res.status(400).json({ error: 'Unsupported collection URL host', manualFetchVersion });
      }
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/manual-fetch.yml/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'abc-manual-fetch'
      },
      body: JSON.stringify({
        ref,
        inputs: {
          am_source_url: amSourceUrl,
          am_base_url: amBaseUrl,
          hk_source_url: hkSourceUrl,
          hk_base_url: hkBaseUrl
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'workflow_dispatch failed', detail: text, manualFetchVersion });
    }

    return res.status(202).json({ ok: true, manualFetchVersion, workflow: 'manual-fetch.yml', trigger: isCron ? 'vercel-cron' : 'manual-ui', ref, amSourceUrl, amBaseUrl, hkSourceUrl, hkBaseUrl });
  } catch (error) {
    return res.status(500).json({
      error: 'manual-fetch handler failed',
      manualFetchVersion,
      detail: error && error.message ? error.message : String(error)
    });
  }
}

function requestOrigin(req) {
  return String(req.headers?.origin || '').trim();
}

function requestHost(req) {
  return String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').trim().toLowerCase();
}

function isSameOriginRequest(req) {
  const origin = requestOrigin(req);
  if (!origin) return false;
  try {
    return new URL(origin).host.toLowerCase() === requestHost(req);
  } catch {
    return false;
  }
}

function isAllowedCollectionUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(parsed.protocol)
      && parsed.hostname.toLowerCase() === '2025kj.zkclhb.com'
      && (parsed.port === '2025' || parsed.host.toLowerCase() === '2025kj.zkclhb.com:2025');
  } catch {
    return false;
  }
}
