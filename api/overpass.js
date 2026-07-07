// Vercel Serverless Function — proxies Overpass API requests to bypass CORS
export default async function handler(req, res) {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: 'Missing "data" query parameter' });
  }

  const servers = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  // Allow cross-origin (in case it's needed locally)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  for (const server of servers) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${server}?data=${encodeURIComponent(data)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        return res.status(200).json(json);
      }
    } catch (e) {
      // Try next server
      console.warn(`Overpass server ${server} failed:`, e.message);
    }
  }

  return res.status(502).json({ error: 'All Overpass API servers are unreachable' });
}
