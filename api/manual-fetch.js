export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'tt88737';
  const repo = process.env.GITHUB_REPO || 'Abc';
  const ref = process.env.GITHUB_REF || 'main';

  if (!token) {
    return res.status(500).json({ error: 'Missing GITHUB_TOKEN environment variable' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const sourceUrl = String(body.sourceUrl || '').trim();
  const baseUrl = String(body.baseUrl || sourceUrl).trim();
  const rootPageName = body.source === 'hk' ? 'hk.html' : 'am.html';

  if (!/^https?:\/\/.+/i.test(sourceUrl)) {
    return res.status(400).json({ error: 'Invalid sourceUrl' });
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
        source_url: sourceUrl,
        base_url: baseUrl,
        root_page_name: rootPageName
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).json({ error: 'workflow_dispatch failed', detail: text });
  }

  return res.status(202).json({ ok: true, workflow: 'manual-fetch.yml', ref, sourceUrl, baseUrl, rootPageName });
}
