export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = req.headers['authorization'] || '';
    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'tt88737';
    const repo = process.env.GITHUB_REPO || 'Abc';
    const ref = process.env.GITHUB_REF || 'main';

    if (!token) {
      return res.status(500).json({ error: 'Missing GITHUB_TOKEN environment variable' });
    }

    const amSourceUrl = process.env.AM_SOURCE_URL || 'https://2025kj.zkclhb.com:2025/am.html';
    const amBaseUrl = process.env.AM_BASE_URL || amSourceUrl;
    const hkSourceUrl = process.env.HK_SOURCE_URL || 'https://2025kj.zkclhb.com:2025/hk.html';
    const hkBaseUrl = process.env.HK_BASE_URL || hkSourceUrl;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/manual-fetch.yml/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'abc-cron-fetch'
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
      return res.status(response.status).json({ error: 'workflow_dispatch failed', detail: text });
    }

    return res.status(202).json({
      ok: true,
      workflow: 'manual-fetch.yml',
      trigger: 'vercel-cron',
      ref,
      amSourceUrl,
      hkSourceUrl
    });
  } catch (error) {
    return res.status(500).json({
      error: 'cron-fetch handler failed',
      detail: error && error.message ? error.message : String(error)
    });
  }
}
