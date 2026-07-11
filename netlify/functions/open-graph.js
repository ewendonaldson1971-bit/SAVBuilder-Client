const MAX_HTML_LENGTH = 500000;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
    "Content-Type": "application/json; charset=utf-8"
  };

  try {
    const rawUrl = event.queryStringParameters && event.queryStringParameters.url;
    const targetUrl = parseSafeUrl(rawUrl);
    if (!targetUrl) {
      return jsonResponse(400, { error: "A valid http or https URL is required." }, headers);
    }

    const response = await fetch(targetUrl.href, {
      redirect: "follow",
      headers: {
        "User-Agent": "SAV Builder OpenGraph Preview/1.0"
      }
    });
    if (!response.ok) {
      return jsonResponse(response.status, { error: "Could not load preview URL." }, headers);
    }

    const html = (await response.text()).slice(0, MAX_HTML_LENGTH);
    const preview = extractPreview(html, targetUrl);
    return jsonResponse(200, preview, headers);
  } catch (error) {
    return jsonResponse(500, { error: "Could not build preview." }, headers);
  }
};

function parseSafeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (BLOCKED_HOSTS.has(hostname) || isPrivateIp(hostname)) return null;
    return url;
  } catch (error) {
    return null;
  }
}

function isPrivateIp(hostname) {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,2})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function extractPreview(html, targetUrl) {
  const title = findMeta(html, ["og:title", "twitter:title"]) || findTitle(html) || targetUrl.hostname;
  const description = findMeta(html, ["og:description", "twitter:description", "description"]);
  const siteName = findMeta(html, ["og:site_name", "twitter:site"]) || targetUrl.hostname.replace(/^www\./i, "");
  const image = resolveUrl(findMeta(html, ["og:image", "og:image:url", "twitter:image"]), targetUrl);
  const canonicalUrl = resolveUrl(findMeta(html, ["og:url"]) || findCanonical(html), targetUrl) || targetUrl.href;

  return {
    url: canonicalUrl,
    title,
    description,
    siteName,
    image
  };
}

function findMeta(html, names) {
  const wanted = new Set(names.map(normalizeMetaName));
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = normalizeMetaName(getAttribute(tag, "property") || getAttribute(tag, "name"));
    if (wanted.has(name)) {
      const content = getAttribute(tag, "content");
      if (content) return decodeEntities(content);
    }
  }
  return "";
}

function findTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].replace(/\s+/g, " ").trim()) : "";
}

function findCanonical(html) {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  for (const link of links) {
    if (/\brel\s*=\s*["'][^"']*\bcanonical\b/i.test(link)) {
      return getAttribute(link, "href");
    }
  }
  return "";
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match ? (match[2] || match[3] || match[4] || "").trim() : "";
}

function normalizeMetaName(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveUrl(value, baseUrl) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl.href).href;
  } catch (error) {
    return "";
  }
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function jsonResponse(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}
