const db = require('./db');
const appConfig = require('../../config/appConfig');
const path = require('path');

async function createAdmin() {
  const [{ default: AdminJS, ComponentLoader }, AdminJSSequelize, { default: uploadFeature }] = await Promise.all([
    import('adminjs'),
    import('@adminjs/sequelize'),
    import('@adminjs/upload'),
  ]);
  const componentLoader = new ComponentLoader();

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  // Helper to safely parse JSON strings from DB
  const safeParseJSON = (value, fallback = []) => {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (e) { return fallback; }
  };

  // Helper to unflatten AdminJS flat payload into nested objects
  const unflattenObj = (data) => {
    if (Object(data) !== data || Array.isArray(data)) return data;
    const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g, result = {};
    for (const p in data) {
      let cur = result, prop = '', m;
      while ((m = regex.exec(p))) {
        cur = cur[prop] || (cur[prop] = m[2] ? [] : {});
        prop = m[2] || m[1];
      }
      cur[prop] = data[p];
    }
    return result[''] || result;
  };

  const normalizeArrayLike = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => value[key]);
    }
    return [];
  };

  const userResource = {
    resource: db.User,
    options: {
      navigation: { name: 'User Management', icon: 'User' },
      listProperties: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
      filterProperties: ['name', 'email', 'role', 'isActive'],
      showProperties: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
      editProperties: ['name', 'email', 'password', 'role', 'isActive'],
      properties: {
        password: {
          isVisible: { list: false, filter: false, show: false, edit: true },
          type: 'password',
        },
        id: { isVisible: { list: true, filter: false, show: true, edit: false } },
      },
      actions: {
        delete: {
          guard: 'Are you sure you want to delete this user?',
          isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        },
      },
    },
  };

  const productResource = {
    resource: db.Product,
    options: {
      navigation: { name: 'Menu Management', icon: 'Tag' },
      listProperties: ['name', 'category', 'price', 'isAvailable', 'stock', 'createdAt'],
      filterProperties: ['name', 'category', 'isAvailable'],
      editProperties: ['name', 'description', 'price', 'category', 'imageUrl', 'isAvailable', 'stock', 'sku'],
      properties: {
        description: { type: 'textarea' },
        price: { type: 'number' },
      },
    },
  };

  const orderResource = {
    resource: db.Order,
    options: {
      navigation: { name: 'Order Management', icon: 'Clipboard' },
      listProperties: ['orderNumber', 'status', 'totalAmount', 'paymentStatus', 'paymentMethod', 'createdAt'],
      filterProperties: ['status', 'paymentStatus', 'paymentMethod'],
      showProperties: [
        'id', 'orderNumber', 'status', 'totalAmount', 'taxAmount',
        'discountAmount', 'paymentStatus', 'paymentMethod', 'notes',
        'tableId', 'userId', 'createdAt', 'updatedAt',
      ],
      editProperties: ['status', 'paymentStatus', 'paymentMethod', 'notes', 'discountAmount'],
      actions: {
        new: { isAccessible: false },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
          guard: 'Are you sure you want to delete this order?',
        },
      },
    },
  };

  const tableResource = {
    resource: db.Table,
    options: {
      navigation: { name: 'Table Management', icon: 'Layout' },
      listProperties: ['tableNumber', 'capacity', 'status', 'floor', 'section', 'isActive'],
      filterProperties: ['status', 'floor', 'isActive'],
      editProperties: ['tableNumber', 'capacity', 'status', 'floor', 'section', 'isActive'],
    },
  };

  const pricingResource = {
    resource: db.PricingContent,
    options: {
      navigation: { name: 'Website Content', icon: 'Currency' },
      listProperties: ['key', 'defaultCurrency', 'isYearlyDefault', 'isActive', 'updatedAt'],
      filterProperties: ['key', 'defaultCurrency', 'isActive'],
      showProperties: [
        'key', 'countryFallbackName', 'defaultCurrency', 'baseCurrency', 'isYearlyDefault', 'yearlySavingsText',
        'headerBadgeText', 'headingPrefix', 'headingHighlightTemplate', 'subtitle',
        'trustBadges', 'currencies', 'countryCurrencyMapEditor', 'fxRatesEditor', 'plans', 'comparisonSections', 'isActive'
      ],
      editProperties: [
        'countryFallbackName', 'defaultCurrency', 'baseCurrency', 'isYearlyDefault', 'yearlySavingsText',
        'headerBadgeText', 'headingPrefix', 'headingHighlightTemplate', 'subtitle',
        'trustBadges', 'currencies', 'countryCurrencyMapEditor', 'fxRatesEditor', 'plans', 'comparisonSections', 'isActive'
      ],
      properties: {
        key: {
          isVisible: { list: true, filter: true, show: true, edit: false },
          description: 'System identifier for this pricing page configuration.',
        },
        trustBadgesJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        currenciesJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        plansJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        comparisonJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        countryCurrencyMapJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        fxRatesJson: { isVisible: { list: false, filter: false, show: false, edit: false } },
        id: { isVisible: { list: false, filter: false, show: false, edit: false } },
        createdAt: { isVisible: { list: false, filter: false, show: false, edit: false } },
        updatedAt: { isVisible: { list: false, filter: false, show: false, edit: false } },

        countryFallbackName: { description: 'Country name shown in heading when auto-location is unavailable.' },
        defaultCurrency: { description: 'Fallback currency used when no country/currency match is found.' },
        baseCurrency: { description: 'All plan prices are stored in this base currency and auto-converted for users.' },
        isYearlyDefault: { description: 'If enabled, yearly prices are selected by default on page load.' },
        yearlySavingsText: { description: 'Small badge text near yearly toggle (example: Save 20%).' },
        headerBadgeText: { description: 'Small top badge text above heading (example: PRICING PLANS).' },
        headingPrefix: { description: 'First line of heading text.' },
        headingHighlightTemplate: { description: 'Second heading line. Use {country} placeholder (example: pricing for {country}.)' },
        subtitle: { type: 'textarea', description: 'Paragraph below heading that explains your pricing.' },

        countryCurrencyMapEditor: {
          type: 'textarea',
          description: 'Auto country mapping. One line each: COUNTRY_CODE -> CURRENCY_CODE (example: IN -> INR)',
          props: { rows: 6 },
        },

        fxRatesEditor: {
          type: 'textarea',
          description: 'Exchange rates from base currency. One line each: CURRENCY = RATE (example: INR = 83)',
          props: { rows: 6 },
        },
        
        trustBadges: {
          type: 'string',
          isArray: true,
          description: 'Top badges under pricing heading. Add one badge per row (example: No credit card required).',
        },

        currencies: { type: 'mixed', isArray: true },
        'currencies.code': { type: 'string', description: '3-letter currency code (INR, USD, EUR)' },
        'currencies.label': { type: 'string', description: 'Display label shown in currency dropdown' },
        'currencies.symbol': { type: 'string', description: 'Currency symbol shown on price cards (₹, $, €)' },

        plans: { type: 'mixed', isArray: true },
        'plans.name': { type: 'string', description: 'Plan title (Basic, Pro, Enterprise)' },
        'plans.description': { type: 'string', description: 'Short one-line subtitle for the plan card' },
        'plans.buttonText': { type: 'string', description: 'CTA button text shown at bottom of card' },
        'plans.buttonVariant': { availableValues: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }] },
        'plans.isCustomPricing': { type: 'boolean', description: 'Enable for plans like Enterprise where price is Custom' },
        'plans.customPriceLabel': { type: 'string', description: 'Label to show when custom pricing is enabled (example: Custom)' },
        'plans.popular': { type: 'boolean', description: 'Shows Most Popular badge' },
        'plans.displayOrder': { type: 'number', description: 'Card position order (1,2,3...)' },
        'plans.features': { type: 'string', isArray: true, description: 'Perks list. Add one perk per row.' },
        'plans.baseMonthly': { type: 'number', description: 'Monthly price in base currency (number only)' },
        'plans.baseYearly': { type: 'number', description: 'Yearly price in base currency (number only)' },

        comparisonSections: { type: 'mixed', isArray: true },
        'comparisonSections.category': { type: 'string', description: 'Table group heading (example: CORE CAPABILITIES)' },
        'comparisonSections.displayOrder': { type: 'number', description: 'Section order in table' },
        'comparisonSections.isActive': { type: 'boolean', description: 'Show or hide this section' },
        'comparisonSections.items': { type: 'mixed', isArray: true },
        'comparisonSections.items.name': { type: 'string', description: 'Feature/perk name shown in first column' },
        'comparisonSections.items.basic': { type: 'string', description: 'Basic column value: use true, false, or text' },
        'comparisonSections.items.pro': { type: 'string', description: 'Pro column value: use true, false, or text' },
        'comparisonSections.items.enterprise': { type: 'string', description: 'Enterprise column value: use true, false, or text' },
        'comparisonSections.items.displayOrder': { type: 'number', description: 'Row order within this section' },
      },
      actions: {
        new: {
          before: async (request) => {
            if (request.method === 'post' || request.method === 'put') {
              const payload = unflattenObj(request.payload || {});
              const normalizeComparisonValue = (value) => {
                if (typeof value === 'boolean') return value;
                if (typeof value !== 'string') return value;
                const normalized = value.trim().toLowerCase();
                if (normalized === 'true') return true;
                if (normalized === 'false') return false;
                return value;
              };

              if (typeof payload.countryCurrencyMapEditor === 'string') {
                const lines = payload.countryCurrencyMapEditor
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);

                const mapped = {};
                lines.forEach((line) => {
                  const [country, currency] = line.split('->').map((p) => p.trim().toUpperCase());
                  if (country && currency) mapped[country] = currency;
                });

                payload.countryCurrencyMapJson = JSON.stringify(mapped, null, 2);
              }

              if (typeof payload.fxRatesEditor === 'string') {
                const fxLines = payload.fxRatesEditor
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);

                const rates = {};
                fxLines.forEach((line) => {
                  const [code, rate] = line.split('=').map((p) => p.trim());
                  const parsedRate = Number(rate);
                  if (code && Number.isFinite(parsedRate) && parsedRate > 0) {
                    rates[code.toUpperCase()] = parsedRate;
                  }
                });

                payload.fxRatesJson = JSON.stringify(rates, null, 2);
              }
              
              const trustBadges = normalizeArrayLike(payload.trustBadges);
              const currencies = normalizeArrayLike(payload.currencies);
              const plans = normalizeArrayLike(payload.plans);
              const comparisonSections = normalizeArrayLike(payload.comparisonSections);

              if (trustBadges.length) payload.trustBadgesJson = JSON.stringify(trustBadges);
              if (currencies.length) payload.currenciesJson = JSON.stringify(currencies);
              if (plans.length) {
                payload.plans = plans.map((p) => {
                  const toNumber = (val) => {
                    const num = Number(val);
                    return Number.isFinite(num) ? num : 0;
                  };

                  p.baseMonthly = toNumber(p.baseMonthly);
                  p.baseYearly = toNumber(p.baseYearly);
                  p.features = normalizeArrayLike(p.features).map((item) => String(item)).filter(Boolean);
                  return p;
                });
                payload.plansJson = JSON.stringify(payload.plans);
              }
              if (comparisonSections.length) {
                payload.comparisonSections = comparisonSections.map((section) => ({
                  ...section,
                  items: Array.isArray(section.items)
                    ? section.items.map((item) => ({
                        ...item,
                        basic: normalizeComparisonValue(item.basic),
                        pro: normalizeComparisonValue(item.pro),
                        enterprise: normalizeComparisonValue(item.enterprise),
                      }))
                    : [],
                }));
                payload.comparisonJson = JSON.stringify(payload.comparisonSections);
              }

              delete payload.countryCurrencyMapEditor;
              delete payload.fxRatesEditor;

              return { ...request, payload };
            }
            return request;
          },
        },
        edit: {
          before: async (request) => {
            if (request.method === 'post' || request.method === 'put') {
              const payload = unflattenObj(request.payload || {});
              const normalizeComparisonValue = (value) => {
                if (typeof value === 'boolean') return value;
                if (typeof value !== 'string') return value;
                const normalized = value.trim().toLowerCase();
                if (normalized === 'true') return true;
                if (normalized === 'false') return false;
                return value;
              };

              if (typeof payload.countryCurrencyMapEditor === 'string') {
                const lines = payload.countryCurrencyMapEditor
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);

                const mapped = {};
                lines.forEach((line) => {
                  const [country, currency] = line.split('->').map((p) => p.trim().toUpperCase());
                  if (country && currency) mapped[country] = currency;
                });

                payload.countryCurrencyMapJson = JSON.stringify(mapped, null, 2);
              }

              if (typeof payload.fxRatesEditor === 'string') {
                const fxLines = payload.fxRatesEditor
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);

                const rates = {};
                fxLines.forEach((line) => {
                  const [code, rate] = line.split('=').map((p) => p.trim());
                  const parsedRate = Number(rate);
                  if (code && Number.isFinite(parsedRate) && parsedRate > 0) {
                    rates[code.toUpperCase()] = parsedRate;
                  }
                });

                payload.fxRatesJson = JSON.stringify(rates, null, 2);
              }
              
              const trustBadges = normalizeArrayLike(payload.trustBadges);
              const currencies = normalizeArrayLike(payload.currencies);
              const plans = normalizeArrayLike(payload.plans);
              const comparisonSections = normalizeArrayLike(payload.comparisonSections);

              if (trustBadges.length) payload.trustBadgesJson = JSON.stringify(trustBadges);
              if (currencies.length) payload.currenciesJson = JSON.stringify(currencies);
              if (plans.length) {
                payload.plans = plans.map((p) => {
                  const toNumber = (val) => {
                    const num = Number(val);
                    return Number.isFinite(num) ? num : 0;
                  };

                  p.baseMonthly = toNumber(p.baseMonthly);
                  p.baseYearly = toNumber(p.baseYearly);
                  p.features = normalizeArrayLike(p.features).map((item) => String(item)).filter(Boolean);
                  return p;
                });
                payload.plansJson = JSON.stringify(payload.plans);
              }
              if (comparisonSections.length) {
                payload.comparisonSections = comparisonSections.map((section) => ({
                  ...section,
                  items: Array.isArray(section.items)
                    ? section.items.map((item) => ({
                        ...item,
                        basic: normalizeComparisonValue(item.basic),
                        pro: normalizeComparisonValue(item.pro),
                        enterprise: normalizeComparisonValue(item.enterprise),
                      }))
                    : [],
                }));
                payload.comparisonJson = JSON.stringify(payload.comparisonSections);
              }

              delete payload.countryCurrencyMapEditor;
              delete payload.fxRatesEditor;

              return { ...request, payload };
            }
            return request;
          },
        },
      },
    },
  };

  const uploadBase = path.resolve(__dirname, '../../public');

  const pickAllowedFields = (payload = {}, allowedFields = []) => {
    const sanitized = {};
    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        sanitized[field] = payload[field];
      }
    });
    return sanitized;
  };

  const normalizeHomeContentPayload = (payload = {}) => {
    const next = { ...payload };

    const stringFields = [
      'key',
      'heroBadge',
      'heroHeading',
      'heroDescription',
      'heroCtaText',
      'heroImageUrl',
      'heroImageAlt',
      'mainBadgeLabel',
      'mainTitle',
      'mainDescription',
      'mainRating',
      'mainRatingCount',
      'mainCtaText',
      'mainImageUrl',
      'mainImageAlt',
      'sideBadgeLabel',
      'sideTitle',
      'sideDescription',
      'sideCtaText',
      'sideImageUrl',
      'sideImageAlt',
    ];

    stringFields.forEach((field) => {
      if (typeof next[field] === 'string') {
        const trimmed = next[field].trim();
        if (!trimmed) {
          delete next[field];
        } else {
          next[field] = trimmed;
        }
      }
    });

    const parsePrice = (raw) => {
      if (raw === null || raw === undefined || raw === '') return undefined;
      const asString = String(raw).replace(/[^\d.-]/g, '');
      const parsed = Number(asString);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const mainPrice = parsePrice(next.mainPrice);
    if (mainPrice === undefined) delete next.mainPrice;
    else next.mainPrice = mainPrice;

    const sidePrice = parsePrice(next.sidePrice);
    if (sidePrice === undefined) delete next.sidePrice;
    else next.sidePrice = sidePrice;

    if (next.isActive !== undefined) {
      if (typeof next.isActive === 'string') {
        const normalized = next.isActive.toLowerCase();
        next.isActive = normalized === 'true' || normalized === '1' || normalized === 'on';
      } else {
        next.isActive = Boolean(next.isActive);
      }
    }

    if (next.mainBadgeColor !== undefined) {
      const allowed = ['green', 'red'];
      if (!allowed.includes(String(next.mainBadgeColor))) {
        delete next.mainBadgeColor;
      }
    }

    if (next.sideBadgeColor !== undefined) {
      const allowed = ['green', 'red'];
      if (!allowed.includes(String(next.sideBadgeColor))) {
        delete next.sideBadgeColor;
      }
    }

    return next;
  };

  // Only allow updating mutable DB columns (never id or createdAt)
  const HOME_CONTENT_ALLOWED_FIELDS = [
    'key',
    'heroBadge',
    'heroHeading',
    'heroDescription',
    'heroCtaText',
    'heroImageUrl',
    'heroImageAlt',
    'mainBadgeLabel',
    'mainBadgeColor',
    'mainTitle',
    'mainDescription',
    'mainPrice',
    'mainRating',
    'mainRatingCount',
    'mainCtaText',
    'mainImageUrl',
    'mainImageAlt',
    'sideBadgeLabel',
    'sideBadgeColor',
    'sideTitle',
    'sideDescription',
    'sidePrice',
    'sideCtaText',
    'sideImageUrl',
    'sideImageAlt',
    'isActive',
  ];

  const buildImageUploadFeature = ({ folder, keyProperty, fileProperty }) =>
    uploadFeature({
      componentLoader,
      provider: {
        local: {
          bucket: uploadBase,
          opts: { baseUrl: '/public' },
        },
      },
      properties: {
        key: keyProperty,
        file: fileProperty,
        filePath: `${fileProperty}Path`,
        filesToDelete: `${fileProperty}ToDelete`,
      },
      uploadPath: (record, filename) => {
        const id = record?.params?.id || 'new';
        const safeName = String(filename || 'file').replace(/\s+/g, '-');
        return `uploads/home/${folder}/${id}-${Date.now()}-${safeName}`;
      },
      validation: {
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
      },
    });

  const homeContentResource = {
    resource: db.HomeContent,
    options: {
      navigation: { name: 'Website Content', icon: 'Home' },
      listProperties: ['key', 'heroHeading', 'isActive', 'updatedAt'],
      filterProperties: ['key', 'isActive'],
      showProperties: [
        'key',
        'heroBadge',
        'heroHeading',
        'heroDescription',
        'heroCtaText',
        'heroImageUrl',
        'heroImageAlt',
        'mainBadgeLabel',
        'mainBadgeColor',
        'mainTitle',
        'mainDescription',
        'mainPrice',
        'mainRating',
        'mainRatingCount',
        'mainCtaText',
        'mainImageUrl',
        'mainImageAlt',
        'sideBadgeLabel',
        'sideBadgeColor',
        'sideTitle',
        'sideDescription',
        'sidePrice',
        'sideCtaText',
        'sideImageUrl',
        'sideImageAlt',
        'isActive',
        'updatedAt',
      ],
      editProperties: [
        'heroBadge',
        'heroHeading',
        'heroDescription',
        'heroCtaText',
        'heroImageFile',
        'heroImageAlt',
        'mainBadgeLabel',
        'mainBadgeColor',
        'mainTitle',
        'mainDescription',
        'mainPrice',
        'mainRating',
        'mainRatingCount',
        'mainCtaText',
        'mainImageFile',
        'mainImageAlt',
        'sideBadgeLabel',
        'sideBadgeColor',
        'sideTitle',
        'sideDescription',
        'sidePrice',
        'sideCtaText',
        'sideImageFile',
        'sideImageAlt',
        'isActive',
      ],
      properties: {
        key: { isVisible: { list: true, filter: true, show: true, edit: false } },
        createdAt: { isVisible: { list: false, filter: false, show: false, edit: false } },
        updatedAt: { isVisible: { list: false, filter: false, show: false, edit: false } },
        heroDescription: { type: 'textarea' },
        mainDescription: { type: 'textarea' },
        sideDescription: { type: 'textarea' },
        mainBadgeColor: {
          availableValues: [
            { value: 'green', label: 'Green' },
            { value: 'red', label: 'Red' },
          ],
        },
        sideBadgeColor: {
          availableValues: [
            { value: 'green', label: 'Green' },
            { value: 'red', label: 'Red' },
          ],
        },
        heroImageFile: { isVisible: { list: false, filter: false, show: false, edit: true } },
        mainImageFile: { isVisible: { list: false, filter: false, show: false, edit: true } },
        sideImageFile: { isVisible: { list: false, filter: false, show: false, edit: true } },
        heroImageUrl: { isVisible: { list: false, filter: false, show: false, edit: false } },
        mainImageUrl: { isVisible: { list: false, filter: false, show: false, edit: false } },
        sideImageUrl: { isVisible: { list: false, filter: false, show: false, edit: false } },
        heroImageFilePath: { isVisible: { list: false, filter: false, show: false, edit: false } },
        mainImageFilePath: { isVisible: { list: false, filter: false, show: false, edit: false } },
        sideImageFilePath: { isVisible: { list: false, filter: false, show: false, edit: false } },
        heroImageFileToDelete: { isVisible: { list: false, filter: false, show: false, edit: false } },
        mainImageFileToDelete: { isVisible: { list: false, filter: false, show: false, edit: false } },
        sideImageFileToDelete: { isVisible: { list: false, filter: false, show: false, edit: false } },
      },
      actions: {
        new: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const picked = pickAllowedFields(request.payload || {}, HOME_CONTENT_ALLOWED_FIELDS);
            const payload = normalizeHomeContentPayload(picked);

            return { ...request, payload };
          },
        },
        edit: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const picked = pickAllowedFields(request.payload || {}, HOME_CONTENT_ALLOWED_FIELDS);
            const payload = normalizeHomeContentPayload(picked);

            return { ...request, payload };
          },
        },
      },
    },
    features: [
      buildImageUploadFeature({ folder: 'hero', keyProperty: 'heroImageUrl', fileProperty: 'heroImageFile' }),
      buildImageUploadFeature({ folder: 'trending-main', keyProperty: 'mainImageUrl', fileProperty: 'mainImageFile' }),
      buildImageUploadFeature({ folder: 'trending-side', keyProperty: 'sideImageUrl', fileProperty: 'sideImageFile' }),
    ],
  };

  const homeCategoryResource = {
    resource: db.HomeCategory,
    options: {
      navigation: { name: 'Website Content', icon: 'Category' },
      listProperties: ['name', 'displayOrder', 'isActive', 'updatedAt'],
      filterProperties: ['name', 'isActive'],
      editProperties: ['name', 'imageFile', 'displayOrder', 'isActive'],
      properties: {
        imageFile: {
          isVisible: { list: false, filter: false, show: false, edit: true },
          description: 'Upload a new image to replace the current one.',
        },
        imageUrl: { isVisible: { list: false, filter: false, show: false, edit: false } },
        imageFilePath: { isVisible: { list: false, filter: false, show: false, edit: false } },
        imageFileToDelete: { isVisible: { list: false, filter: false, show: false, edit: false } },
      },
      actions: {
        new: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const payload = { ...(request.payload || {}) };

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.created_at;
            delete payload.updated_at;
            delete payload.imageFilePath;
            delete payload.imageFileToDelete;

            return { ...request, payload };
          },
        },
        edit: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const payload = { ...(request.payload || {}) };

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.created_at;
            delete payload.updated_at;
            delete payload.imageFilePath;
            delete payload.imageFileToDelete;

            return { ...request, payload };
          },
        },
      },
    },
    features: [buildImageUploadFeature({ folder: 'categories', keyProperty: 'imageUrl', fileProperty: 'imageFile' })],
  };

  const homeMenuItemResource = {
    resource: db.HomeMenuItem,
    options: {
      navigation: { name: 'Website Content', icon: 'Restaurant' },
      listProperties: ['title', 'price', 'displayOrder', 'isActive', 'updatedAt'],
      filterProperties: ['title', 'isActive'],
      editProperties: ['title', 'description', 'price', 'imageFile', 'displayOrder', 'isActive'],
      properties: {
        description: { type: 'textarea' },
        imageFile: {
          isVisible: { list: false, filter: false, show: false, edit: true },
          description: 'Upload a new image to replace the current one.',
        },
        imageUrl: { isVisible: { list: false, filter: false, show: false, edit: false } },
        imageFilePath: { isVisible: { list: false, filter: false, show: false, edit: false } },
        imageFileToDelete: { isVisible: { list: false, filter: false, show: false, edit: false } },
      },
      actions: {
        new: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const payload = { ...(request.payload || {}) };

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.created_at;
            delete payload.updated_at;
            delete payload.imageFilePath;
            delete payload.imageFileToDelete;

            return { ...request, payload };
          },
        },
        edit: {
          before: async (request) => {
            if (request.method !== 'post' && request.method !== 'put') return request;
            const payload = { ...(request.payload || {}) };

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.created_at;
            delete payload.updated_at;
            delete payload.imageFilePath;
            delete payload.imageFileToDelete;

            return { ...request, payload };
          },
        },
      },
    },
    features: [buildImageUploadFeature({ folder: 'menu', keyProperty: 'imageUrl', fileProperty: 'imageFile' })],
  };

  const homeMenuTabResource = {
    resource: db.HomeMenuTab,
    options: {
      navigation: { name: 'Website Content', icon: 'Menu' },
      listProperties: ['name', 'displayOrder', 'isActive', 'updatedAt'],
      filterProperties: ['name', 'isActive'],
      editProperties: ['name', 'displayOrder', 'isActive'],
    },
  };

  const populateFlat = (params, prefix, obj) => {
    if (Array.isArray(obj)) {
      obj.forEach((val, i) => populateFlat(params, `${prefix}.${i}`, val));
    } else if (obj !== null && typeof obj === 'object') {
      Object.entries(obj).forEach(([k, v]) => populateFlat(params, `${prefix}.${k}`, v));
    } else {
      params[prefix] = obj;
    }
  };

  const syncAdminUI = async (response) => {
    if (response.record && response.record.params) {
      const p = response.record.params;
      
      const tb = safeParseJSON(p.trustBadgesJson, []);
      if (tb.length) populateFlat(p, 'trustBadges', tb);

      const curr = safeParseJSON(p.currenciesJson, []);
      if (curr.length) populateFlat(p, 'currencies', curr);

      const countryMap = safeParseJSON(p.countryCurrencyMapJson, {});
      if (countryMap && typeof countryMap === 'object') {
        p.countryCurrencyMapEditor = Object.entries(countryMap)
          .map(([country, currency]) => `${country} -> ${currency}`)
          .join('\n');
      }

      const fxRates = safeParseJSON(p.fxRatesJson, {});
      if (fxRates && typeof fxRates === 'object') {
        p.fxRatesEditor = Object.entries(fxRates)
          .map(([code, rate]) => `${code} = ${rate}`)
          .join('\n');
      }

      const plans = safeParseJSON(p.plansJson, []);
      if (plans.length) {
        const recordBaseCurrency = String(p.baseCurrency || 'USD').toUpperCase();
        plans.forEach((plan) => {
          plan.baseMonthly = Number(plan.baseMonthly ?? plan.prices?.[recordBaseCurrency]?.monthly ?? 0) || 0;
          plan.baseYearly = Number(plan.baseYearly ?? plan.prices?.[recordBaseCurrency]?.yearly ?? 0) || 0;
          plan.features = normalizeArrayLike(plan.features).map((item) => String(item)).filter(Boolean);
        });
        populateFlat(p, 'plans', plans);
      }

      const comp = safeParseJSON(p.comparisonJson, []);
      if (comp.length) populateFlat(p, 'comparisonSections', comp);
    }
    return response;
  };

  pricingResource.options.actions.new.after = [syncAdminUI];
  pricingResource.options.actions.edit.after = [syncAdminUI];
  pricingResource.options.actions.show = { after: [syncAdminUI] };

  return new AdminJS({
    databases: [db.sequelize],
    rootPath: appConfig.admin.path,
    componentLoader,
    resources: [
      userResource,
      productResource,
      orderResource,
      tableResource,
      pricingResource,
      homeContentResource,
      homeCategoryResource,
      homeMenuItemResource,
      homeMenuTabResource,
    ],
    branding: {
      companyName: 'ZaykaPOS Admin',
      logo: false,
      softwareBrothers: false,
      theme: {
        colors: {
          primary100: '#FF6B35',
          primary80: '#FF8C5A',
          primary60: '#FFB08A',
          primary40: '#FFD0BA',
          primary20: '#FFF0EB',
          accent: '#FF6B35',
          love: '#e05780',
          filterBg: '#ffffff',
          hoverBg: '#fff5f0',
          inputBorder: '#d6d6d6',
        },
      },
    },
    locale: {
      language: 'en',
      translations: {
        en: {
          messages: {
            welcomeOnBoard_title: 'Welcome to ZaykaPOS Admin',
            welcomeOnBoard_subtitle: 'Manage your restaurant - products, orders, tables and users.',
          },
        },
      },
    },
  });
}

module.exports = createAdmin;
