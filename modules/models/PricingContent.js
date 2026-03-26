const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const PricingContent = sequelize.define(
    'PricingContent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        defaultValue: 'default',
      },
      countryFallbackName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      defaultCurrency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },
      baseCurrency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      isYearlyDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      yearlySavingsText: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Save 20%',
      },
      headerBadgeText: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'PRICING PLANS',
      },
      headingPrefix: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Simple, transparent',
      },
      headingHighlightTemplate: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'pricing for {country}.',
      },
      subtitle: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Choose the perfect plan for your retail business. From rapid startups to global enterprise operations.',
      },
      trustBadgesJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      currenciesJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      countryCurrencyMapJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      fxRatesJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      plansJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      comparisonJson: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'pricing_contents',
    }
  );

  return PricingContent;
};