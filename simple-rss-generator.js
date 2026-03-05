const fs = require('fs');
const path = require('path');

const EPISODES_FILE = path.join(__dirname, '..', 'data', 'episodes.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');
const RSS_FILE = path.join(__dirname, '..', 'public', 'rss.xml');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(EPISODES_FILE))) {
  fs.mkdirSync(path.dirname(EPISODES_FILE), { recursive: true });
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRSS() {
  const episodes = JSON.parse(fs.readFileSync(EPISODES_FILE, 'utf8'));
  const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  
  const baseUrl = 'https://podcast-automation-2-git-main-funtastic418s-projects.vercel.app';
  
  const items = episodes.map(ep => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description}]]></description>
      <enclosure url="${baseUrl}${ep.audioUrl}" type="audio/mpeg" length="${ep.fileSize}" />
      <guid>${ep.id}</guid>
      <pubDate>${ep.pubDate}</pubDate>
      <itunes:duration>${ep.duration}</itunes:duration>
    </item>
  `).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.apple.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.podcastName)}</title>
    <description>${escapeXml(settings.podcastDescription)}</description>
    <language>${settings.podcastLanguage}</language>
    <itunes:author>${escapeXml(settings.podcastAuthor)}</itunes:author>
    <itunes:category text="${escapeXml(settings.podcastCategory)}"/>
    <itunes:image href="${escapeXml(settings.podcastCoverUrl)}"/>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  fs.writeFileSync(RSS_FILE, rss);
  console.log('RSS feed generated successfully!');
}

// Generate RSS immediately
generateRSS();
