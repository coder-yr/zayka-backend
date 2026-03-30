const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const HomeContent = sequelize.define(
    'HomeContent',
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
      heroBadge: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Limited Offer',
      },
      heroHeading: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: 'Zayaka',
      },
      heroDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Experience a curated selection of artisanal dishes crafted by our master chefs. Get 20% off on your first order.',
      },
      heroCtaText: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Order Now',
      },
      heroImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      heroImageAlt: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Food Spread',
      },
      mainBadgeLabel: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Pure Veg',
      },
      mainBadgeColor: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'green',
      },
      mainTitle: {
        type: DataTypes.STRING(180),
        allowNull: false,
        defaultValue: 'Truffle Mushroom Artisan Pizza',
      },
      mainDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Infused with white truffle oil, wild forest mushrooms, and hand-torn fior di latte mozzarella.',
      },
      mainPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 24,
      },
      mainRating: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '4.9',
      },
      mainRatingCount: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: '(1.2k+)',
      },
      mainCtaText: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Add to Cart',
      },
      mainImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mainImageAlt: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Pizza',
      },
      sideBadgeLabel: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Non-Veg',
      },
      sideBadgeColor: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'red',
      },
      sideTitle: {
        type: DataTypes.STRING(180),
        allowNull: false,
        defaultValue: 'Pacific Poke Bowl',
      },
      sideDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Sustainably sourced Ahi tuna with wasabi aïoli, avocado, and pickled radish.',
      },
      sidePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 18.5,
      },
      sideCtaText: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Add to Cart',
      },
      sideImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sideImageAlt: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Poke Bowl',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'home_contents',
    }
  );

  return HomeContent;
};
