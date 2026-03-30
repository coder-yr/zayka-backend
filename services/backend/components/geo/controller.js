const https = require('https');
const env = require('../../../../config/env');

const COUNTRY_TO_CURRENCY = {
  IN: 'INR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  UK: 'GBP',
  EU: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  JP: 'JPY',
  AU: 'AUD',
  SG: 'SGD',
  AE: 'AED',
};

const normalizeCountryCode = (value) => String(value || '').trim().toUpperCase();

const fetchJson = (url, timeoutMs = 2500) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'zaykapos-backend/1.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Geo request timed out'));
    });

    req.on('error', reject);
  });

const extractEdgeGeo = (req) => {
  const countryCode = normalizeCountryCode(
    req.headers['x-vercel-ip-country'] ||
      req.headers['cf-ipcountry'] ||
      req.headers['cloudfront-viewer-country'] ||
      req.headers['x-country-code']
  );

  if (!countryCode || countryCode === 'XX') {
    return null;
  }

  return {
    country_code: countryCode,
    country_name: null,
    currency: COUNTRY_TO_CURRENCY[countryCode] || null,
    source: 'edge-header',
  };
};

const fetchProviderGeo = async () => {
  try {
    const ipapi = await fetchJson('https://ipapi.co/json/');
    return {
      country_code: normalizeCountryCode(ipapi?.country_code),
      country_name: ipapi?.country_name || null,
      currency: String(ipapi?.currency || '').trim().toUpperCase() || null,
      source: 'ipapi',
    };
  } catch (error) {
    // Try next provider.
  }

  const ipwho = await fetchJson('https://ipwho.is/');
  if (ipwho?.success === false) {
    throw new Error('ipwho.is returned an unsuccessful response');
  }

  return {
    country_code: normalizeCountryCode(ipwho?.country_code),
    country_name: ipwho?.country || null,
    currency: String(ipwho?.currency_code || '').trim().toUpperCase() || null,
    source: 'ipwho',
  };
};

exports.getGeo = async (req, res) => {
  try {
    if (env.NODE_ENV !== 'production') {
      const queryCountry = normalizeCountryCode(req.query.country);
      const queryCurrency = String(req.query.currency || '').trim().toUpperCase() || null;

      if (queryCountry) {
        return res.status(200).json({
          success: true,
          data: {
            country_code: queryCountry,
            country_name: null,
            currency: queryCurrency || COUNTRY_TO_CURRENCY[queryCountry] || null,
            source: 'query-override',
          },
        });
      }
    }

    const edgeGeo = extractEdgeGeo(req);
    if (edgeGeo) {
      return res.status(200).json({ success: true, data: edgeGeo });
    }

    const providerGeo = await fetchProviderGeo();
    return res.status(200).json({ success: true, data: providerGeo });
  } catch (error) {
    // Geo failures should not break pricing page rendering.
    return res.status(200).json({
      success: true,
      data: {
        country_code: null,
        country_name: null,
        currency: null,
        source: 'unavailable',
      },
    });
  }
};
