const db = require('../../db');

const parseJsonSafely = (value, fallback) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeArrayLike = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key]);
};

const normalizeCurrencyCode = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  const aliasMap = {
    JP: 'JPY',
    IN: 'INR',
    US: 'USD',
    GB: 'GBP',
    UK: 'GBP',
    EU: 'EUR',
    AU: 'AUD',
    CA: 'CAD',
    SG: 'SGD',
    AE: 'AED',
  };
  return aliasMap[normalized] || normalized;
};

const normalizeCurrencies = (currencies, fallbackCurrencies) => {
  const raw = normalizeArrayLike(currencies);
  const effective = raw.length > 0 ? raw : fallbackCurrencies;
  return effective
    .map((currency) => ({
      code: normalizeCurrencyCode(currency?.code),
      label: String(currency?.label || ''),
      symbol: String(currency?.symbol || ''),
    }))
    .filter((currency) => currency.code && currency.label);
};

const normalizeFxRates = (fxRates, fallbackFxRates, baseCurrency) => {
  const source = fxRates && typeof fxRates === 'object' ? fxRates : fallbackFxRates;
  const normalized = {};

  Object.entries(source).forEach(([code, rate]) => {
    const parsed = Number(rate);
    const normalizedCode = normalizeCurrencyCode(code);
    if (Number.isFinite(parsed) && parsed > 0) {
      normalized[normalizedCode] = parsed;
    }
  });

  if (!normalized[baseCurrency]) normalized[baseCurrency] = 1;
  return normalized;
};

const normalizePlan = (plan, baseCurrency) => {
  const legacyBaseMonthly = toNumber(plan?.prices?.[baseCurrency]?.monthly, 0);
  const legacyBaseYearly = toNumber(plan?.prices?.[baseCurrency]?.yearly, 0);

  return {
    name: String(plan?.name || ''),
    description: String(plan?.description || ''),
    baseMonthly: toNumber(plan?.baseMonthly, legacyBaseMonthly),
    baseYearly: toNumber(plan?.baseYearly, legacyBaseYearly),
    isCustomPricing: toBoolean(plan?.isCustomPricing, false),
    customPriceLabel: String(plan?.customPriceLabel || 'Custom'),
    features: normalizeArrayLike(plan?.features).map((item) => String(item)).filter(Boolean),
    buttonText: String(plan?.buttonText || ''),
    buttonVariant: String(plan?.buttonVariant || 'outline'),
    popular: toBoolean(plan?.popular, false),
    displayOrder: toNumber(plan?.displayOrder, 0),
    isActive: toBoolean(plan?.isActive, true),
  };
};

const defaultPayload = {
  countryFallbackName: 'India',
  defaultCurrency: 'INR',
  baseCurrency: 'USD',
  fxRates: {
    USD: 1,
    INR: 83,
    EUR: 0.92,
    JPY: 150,
  },
  isYearlyDefault: true,
  yearlySavingsText: 'Save 20%',
  headerBadgeText: 'PRICING PLANS',
  headingPrefix: 'Simple, transparent',
  headingHighlightTemplate: 'pricing for {country}.',
  subtitle: 'Choose the perfect plan for your retail business. From rapid startups to global enterprise operations.',
  trustBadges: ['No credit card required', 'Cancel anytime'],
  currencies: [
    { code: 'INR', label: 'India (INR)', symbol: '₹' },
    { code: 'USD', label: 'United States (USD)', symbol: '$' },
    { code: 'EUR', label: 'Europe (EUR)', symbol: '€' },
  ],
  countryCurrencyMap: {
    IN: 'INR',
    US: 'USD',
    CA: 'USD',
    AU: 'USD',
    GB: 'EUR',
    FR: 'EUR',
    DE: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
  },
  plans: [
    {
      name: 'Basic',
      description: 'For single store startups.',
      baseMonthly: 0,
      baseYearly: 0,
      isCustomPricing: false,
      customPriceLabel: 'Custom',
      features: ['Up to 1 store', 'Standard support', '2GB Storage'],
      buttonText: 'Start for free',
      buttonVariant: 'outline',
      popular: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Pro',
      description: 'For professional teams scaling up.',
      baseMonthly: 15,
      baseYearly: 12,
      isCustomPricing: false,
      customPriceLabel: 'Custom',
      features: ['Unlimited products', 'Priority support', '50GB Storage', 'Custom branding'],
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'solid',
      popular: true,
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'For large scale organizations.',
      baseMonthly: 0,
      baseYearly: 0,
      isCustomPricing: true,
      customPriceLabel: 'Custom',
      features: ['Dedicated Account Manager', 'SSO and SAML Login', 'Unlimited Storage', 'Custom API limits'],
      buttonText: 'Contact sales',
      buttonVariant: 'outline',
      popular: false,
      displayOrder: 3,
      isActive: true,
    },
  ],
  comparisonSections: [
    {
      category: 'WORKSPACE & USAGE',
      displayOrder: 1,
      isActive: true,
      items: [
        { name: 'Monthly active users', basic: '1,000', pro: '50,000', enterprise: 'Unlimited', displayOrder: 1 },
        { name: 'Total Stores', basic: '1', pro: 'Unlimited', enterprise: 'Unlimited', displayOrder: 2 },
        { name: 'Staff per store', basic: '2', pro: '10', enterprise: 'Unlimited', displayOrder: 3 },
      ],
    },
    {
      category: 'CORE CAPABILITIES',
      displayOrder: 2,
      isActive: true,
      items: [
        { name: 'Custom Branding', basic: false, pro: true, enterprise: true, displayOrder: 1 },
        { name: 'Advanced Analytics', basic: false, pro: true, enterprise: true, displayOrder: 2 },
        { name: 'API Access', basic: 'Limited', pro: true, enterprise: true, displayOrder: 3 },
      ],
    },
    {
      category: 'SUPPORT & SECURITY',
      displayOrder: 3,
      isActive: true,
      items: [
        { name: 'SLA Guarantee', basic: false, pro: false, enterprise: true, displayOrder: 1 },
        { name: 'Security Audits', basic: false, pro: false, enterprise: true, displayOrder: 2 },
        { name: 'Support', basic: 'Community', pro: '24h Response', enterprise: 'Instant Priority', displayOrder: 3 },
      ],
    },
  ],
};

const normalizePricingContent = (record) => {
  if (!record) return defaultPayload;

  const trustBadges = parseJsonSafely(record.trustBadgesJson, defaultPayload.trustBadges);
  const currencies = parseJsonSafely(record.currenciesJson, defaultPayload.currencies);
  const countryCurrencyMap = parseJsonSafely(record.countryCurrencyMapJson, defaultPayload.countryCurrencyMap);
  const fxRates = parseJsonSafely(record.fxRatesJson, defaultPayload.fxRates);
  const plans = parseJsonSafely(record.plansJson, defaultPayload.plans);
  const comparisonSections = parseJsonSafely(record.comparisonJson, defaultPayload.comparisonSections);

  const baseCurrency = normalizeCurrencyCode(record.baseCurrency || defaultPayload.baseCurrency);
  const defaultCurrency = normalizeCurrencyCode(record.defaultCurrency || defaultPayload.defaultCurrency);
  const normalizedCurrencies = normalizeCurrencies(currencies, defaultPayload.currencies);
  const sourceCountryCurrencyMap =
    countryCurrencyMap && typeof countryCurrencyMap === 'object' && Object.keys(countryCurrencyMap).length > 0
      ? countryCurrencyMap
      : defaultPayload.countryCurrencyMap;
  const normalizedCountryCurrencyMap = Object.entries(sourceCountryCurrencyMap).reduce((acc, [country, code]) => {
    const normalizedCountry = String(country || '').trim().toUpperCase();
    const normalizedCode = normalizeCurrencyCode(code);
    if (normalizedCountry && normalizedCode) {
      acc[normalizedCountry] = normalizedCode;
    }
    return acc;
  }, {});
  const normalizedFxRates = normalizeFxRates(fxRates, defaultPayload.fxRates, baseCurrency);
  const normalizedPlans = (Array.isArray(plans) && plans.length > 0 ? plans : defaultPayload.plans).map((plan) =>
    normalizePlan(plan, baseCurrency)
  );

  return {
    countryFallbackName: record.countryFallbackName || defaultPayload.countryFallbackName,
    defaultCurrency,
    baseCurrency,
    isYearlyDefault: typeof record.isYearlyDefault === 'boolean' ? record.isYearlyDefault : defaultPayload.isYearlyDefault,
    yearlySavingsText: record.yearlySavingsText || defaultPayload.yearlySavingsText,
    headerBadgeText: record.headerBadgeText || defaultPayload.headerBadgeText,
    headingPrefix: record.headingPrefix || defaultPayload.headingPrefix,
    headingHighlightTemplate: record.headingHighlightTemplate || defaultPayload.headingHighlightTemplate,
    subtitle: record.subtitle || defaultPayload.subtitle,
    trustBadges: Array.isArray(trustBadges) && trustBadges.length > 0 ? trustBadges : defaultPayload.trustBadges,
    currencies: normalizedCurrencies,
    countryCurrencyMap: normalizedCountryCurrencyMap,
    fxRates: normalizedFxRates,
    plans: normalizedPlans,
    comparisonSections:
      Array.isArray(comparisonSections) && comparisonSections.length > 0
        ? comparisonSections
        : defaultPayload.comparisonSections,
  };
};

exports.getPricingContent = async (req, res) => {
  try {
    const createDefaults = {
      key: 'default',
      countryFallbackName: defaultPayload.countryFallbackName,
      defaultCurrency: defaultPayload.defaultCurrency,
      baseCurrency: defaultPayload.baseCurrency,
      isYearlyDefault: defaultPayload.isYearlyDefault,
      yearlySavingsText: defaultPayload.yearlySavingsText,
      headerBadgeText: defaultPayload.headerBadgeText,
      headingPrefix: defaultPayload.headingPrefix,
      headingHighlightTemplate: defaultPayload.headingHighlightTemplate,
      subtitle: defaultPayload.subtitle,
      trustBadgesJson: JSON.stringify(defaultPayload.trustBadges, null, 2),
      currenciesJson: JSON.stringify(defaultPayload.currencies, null, 2),
      countryCurrencyMapJson: JSON.stringify(defaultPayload.countryCurrencyMap, null, 2),
      fxRatesJson: JSON.stringify(defaultPayload.fxRates, null, 2),
      plansJson: JSON.stringify(defaultPayload.plans, null, 2),
      comparisonJson: JSON.stringify(defaultPayload.comparisonSections, null, 2),
      isActive: true,
    };

    const [record] = await db.PricingContent.findOrCreate({
      where: { key: 'default' },
      defaults: createDefaults,
    });

    const payload = normalizePricingContent(record);

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('[PricingController] getPricingContent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing content',
      error: error.message,
    });
  }
};