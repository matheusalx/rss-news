const express = require('express');
const cors = require('cors');
const RSSParser = require('rss-parser');
const path = require('path');
const { Buffer } = require('buffer');

const app = express();
const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Feed sources configuration
const FEED_SOURCES = [
  {
    id: 'un-americas',
    name: 'UN News – Americas',
    url: 'https://news.un.org/feed/subscribe/en/news/region/americas/feed/rss.xml',
    category: 'World',
    color: '#009edb',
    icon: '🌎',
  },
  {
    id: 'un-global',
    name: 'UN News – Global',
    url: 'https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml',
    category: 'World',
    color: '#009edb',
    icon: '🌍',
  },
  {
    id: 'nytimes-world',
    name: 'NY Times – World',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    category: 'World',
    color: '#1a1a1a',
    icon: '📰',
  },
  {
    id: 'nam-politica',
    name: 'Notícias ao Minuto – Política',
    url: 'https://www.noticiasaominuto.com.br/rss/politica',
    category: 'Política',
    color: '#e63946',
    icon: '🏛️',
  },
  {
    id: 'nam-economia',
    name: 'Notícias ao Minuto – Economia',
    url: 'https://www.noticiasaominuto.com.br/rss/economia',
    category: 'Economia',
    color: '#2a9d8f',
    icon: '📊',
  },
  {
    id: 'nam-mundo',
    name: 'Notícias ao Minuto – Mundo',
    url: 'https://www.noticiasaominuto.com.br/rss/mundo',
    category: 'World',
    color: '#e9c46a',
    icon: '🌐',
  },
  {
    id: 'bcb-normativos',
    name: 'BCB – Atos e Comunicados',
    url: 'https://www.bcb.gov.br/api/feed/app/demaisnormativos/atosecomunicados?ano=2021',
    category: 'Economia',
    color: '#264653',
    icon: '🏦',
  },
  {
    id: 'bcb-copom',
    name: 'BCB – Comunicados COPOM',
    url: 'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/comunicadoscopom',
    category: 'Economia',
    color: '#264653',
    icon: '🏦',
  },
  {
    id: 'bcb-cambio',
    name: 'BCB – Câmbio',
    url: 'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/cambio',
    category: 'Economia',
    color: '#264653',
    icon: '💱',
  },
  {
    id: 'google-news',
    name: 'Google Notícias',
    url: 'https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419',
    category: 'Brasil',
    color: '#4285f4',
    icon: '🔍',
  },
  {
    id: 'reporter-brasil',
    name: 'Repórter Brasil',
    url: 'https://reporterbrasil.org.br/feed/',
    category: 'Brasil',
    color: '#f4a261',
    icon: '📢',
  },
  {
    id: 'folha-mercado',
    name: 'Folha – Mercado',
    url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
    category: 'Economia',
    color: '#023e8a',
    icon: '💹',
  },
  {
    id: 'folha-poder',
    name: 'Folha – Poder',
    url: 'https://feeds.folha.uol.com.br/poder/rss091.xml',
    category: 'Política',
    color: '#023e8a',
    icon: '⚖️',
  },
  {
    id: 'jornal-brasilia',
    name: 'Jornal de Brasília',
    url: 'https://jornaldebrasilia.com.br/feed/',
    category: 'Brasil',
    color: '#e76f51',
    icon: '🗞️',
  },
  {
    id: 'rio-times',
    name: 'Rio Times Online',
    url: 'https://www.riotimesonline.com/feed/',
    category: 'Brasil',
    color: '#606c38',
    icon: '🏖️',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://ir.thomsonreuters.com/rss/news-releases.xml?items=30',
    category: 'World',
    color: '#ff8000',
    icon: '🔶',
  },
];

// In-memory cache
let feedCache = {};
let lastFetchTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Extract image from feed item
function extractImage(item) {
  // Try media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  // Try media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }
  // Try enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
    return item.enclosure.url;
  }
  // Try to extract from content
  if (item.contentEncoded || item.content) {
    const content = item.contentEncoded || item.content;
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }
  // Try description
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }
  return null;
}

// Strip HTML tags from text
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Sanitize XML to fix common entity issues
function sanitizeXml(xml) {
  // Fix unescaped ampersands that aren't part of valid entities
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

// Fetch a single feed with encoding + gzip support
async function fetchFeed(source) {
  const now = Date.now();
  if (feedCache[source.id] && lastFetchTime[source.id] && now - lastFetchTime[source.id] < CACHE_DURATION) {
    return feedCache[source.id];
  }

  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    });
    const arrayBuf = await response.arrayBuffer();
    const rawBuf = Buffer.from(arrayBuf);

    // Detect encoding from XML declaration or content-type
    let encoding = 'utf-8';
    const head = rawBuf.subarray(0, 300).toString('ascii');
    const encodingMatch = head.match(/encoding=["']([^"']+)["']/i);
    if (encodingMatch) {
      encoding = encodingMatch[1].toLowerCase();
    }
    const contentType = response.headers.get('content-type') || '';
    const ctMatch = contentType.match(/charset=([^\s;]+)/i);
    if (ctMatch) {
      encoding = ctMatch[1].toLowerCase();
    }

    // Map encoding names
    const isLatin = ['iso-8859-1', 'iso_8859-1', 'latin1', 'latin-1', 'windows-1252'].includes(encoding);

    let xmlString;
    if (isLatin) {
      xmlString = rawBuf.toString('latin1');
      xmlString = Array.from(xmlString).map(c => {
        const code = c.charCodeAt(0);
        return code > 127 ? String.fromCodePoint(code) : c;
      }).join('');
      xmlString = xmlString.replace(/encoding=["'][^"']+["']/i, 'encoding="UTF-8"');
    } else {
      xmlString = rawBuf.toString('utf-8');
    }

    // Sanitize malformed entities
    xmlString = sanitizeXml(xmlString);

    const feed = await parser.parseString(xmlString);
    const items = (feed.items || []).slice(0, 20).map((item) => ({
      title: stripHtml(item.title) || 'Sem título',
      link: item.link || '#',
      description: stripHtml(item.contentSnippet || item.description || item.content || '').substring(0, 300),
      pubDate: item.pubDate || item.isoDate || null,
      image: extractImage(item),
      author: item.creator || item.author || feed.title || source.name,
      sourceId: source.id,
      sourceName: source.name,
      sourceIcon: source.icon,
      sourceColor: source.color,
      category: source.category,
    }));

    feedCache[source.id] = items;
    lastFetchTime[source.id] = now;
    return items;
  } catch (error) {
    console.error(`Error fetching ${source.name}: ${error.message}`);
    return feedCache[source.id] || [];
  }
}

// API: Get all feeds
app.get('/api/feeds', async (req, res) => {
  try {
    const results = await Promise.allSettled(FEED_SOURCES.map((source) => fetchFeed(source)));

    const allItems = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allItems.push(...result.value);
      }
    });

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
      const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      count: allItems.length,
      items: allItems,
      sources: FEED_SOURCES.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        icon: s.icon,
        color: s.color,
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feeds' });
  }
});

// API: Get feed sources list
app.get('/api/sources', (req, res) => {
  res.json({
    sources: FEED_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      icon: s.icon,
      color: s.color,
      url: s.url,
    })),
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 RSS News Hub running at http://localhost:${PORT}\n`);
  console.log(`📡 Tracking ${FEED_SOURCES.length} RSS feeds\n`);
});
