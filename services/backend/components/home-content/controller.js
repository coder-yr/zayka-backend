const db = require('../../db');

const defaultPayload = {
  heroBanner: {
    badge: 'Limited Offer',
    heading: 'Zayaka',
    description:
      'Experience a curated selection of artisanal dishes crafted by our master chefs. Get 20% off on your first order.',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2574&auto=format&fit=crop',
    alt: 'Food Spread',
  },
  categories: [
    { name: 'Pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop' },
    { name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=300&auto=format&fit=crop' },
    { name: 'Drinks', img: 'https://images.unsplash.com/photo-1500217052183-bc01eee1a74e?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { name: 'Healthy', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Salads', img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=300&auto=format&fit=crop' },
    { name: 'Grills', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=300&auto=format&fit=crop' },
  ],
  trendingBanners: {
    main: {
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
      alt: 'Pizza',
      badgeLabel: 'Pure Veg',
      badgeColor: 'green',
      title: 'Truffle Mushroom Artisan Pizza',
      description: 'Infused with white truffle oil, wild forest mushrooms, and hand-torn fior di latte mozzarella.',
      price: '24.00',
      rating: '4.9',
      ratingCount: '(1.2k+)',
      ctaText: 'Add to Cart',
    },
    side: {
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
      alt: 'Poke Bowl',
      badgeLabel: 'Non-Veg',
      badgeColor: 'red',
      title: 'Pacific Poke Bowl',
      description: 'Sustainably sourced Ahi tuna with wasabi aïoli, avocado, and pickled radish.',
      price: '18.50',
      ctaText: 'Add to Cart',
    },
  },
  menuTabs: ['All', 'Breakfast', 'Lunch', 'Dinner', 'Beverages'],
  menuItems: [
    { title: 'Buffalo Glazed Wings', desc: 'Spicy honey glaze with blue cheese dip.', price: 12, img: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?q=80&w=600&auto=format&fit=crop' },
    { title: 'Seared Sea Scallops', desc: 'Butter basted with citrus micro-greens.', price: 31, img: 'https://images.unsplash.com/photo-1626790680587-41802dc94c2c?q=80&w=600&auto=format&fit=crop' },
    { title: 'Burrata Caprese', desc: 'Creamy burrata, heirloom tomatoes.', price: 15, img: 'https://images.unsplash.com/photo-1608897013039-887f214b985c?q=80&w=600&auto=format&fit=crop' },
    { title: 'Velvet Berry Cheesecake', desc: 'New York style with forest berry coulis.', price: 9, img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop' },
  ],
};

exports.getHomeContent = async (req, res) => {
  try {
    const createDefaults = {
      key: 'default',
      heroBadge: defaultPayload.heroBanner.badge,
      heroHeading: defaultPayload.heroBanner.heading,
      heroDescription: defaultPayload.heroBanner.description,
      heroCtaText: defaultPayload.heroBanner.ctaText,
      heroImageUrl: defaultPayload.heroBanner.imageUrl,
      heroImageAlt: defaultPayload.heroBanner.alt,
      mainBadgeLabel: defaultPayload.trendingBanners.main.badgeLabel,
      mainBadgeColor: defaultPayload.trendingBanners.main.badgeColor,
      mainTitle: defaultPayload.trendingBanners.main.title,
      mainDescription: defaultPayload.trendingBanners.main.description,
      mainPrice: defaultPayload.trendingBanners.main.price,
      mainRating: defaultPayload.trendingBanners.main.rating,
      mainRatingCount: defaultPayload.trendingBanners.main.ratingCount,
      mainCtaText: defaultPayload.trendingBanners.main.ctaText,
      mainImageUrl: defaultPayload.trendingBanners.main.imageUrl,
      mainImageAlt: defaultPayload.trendingBanners.main.alt,
      sideBadgeLabel: defaultPayload.trendingBanners.side.badgeLabel,
      sideBadgeColor: defaultPayload.trendingBanners.side.badgeColor,
      sideTitle: defaultPayload.trendingBanners.side.title,
      sideDescription: defaultPayload.trendingBanners.side.description,
      sidePrice: defaultPayload.trendingBanners.side.price,
      sideCtaText: defaultPayload.trendingBanners.side.ctaText,
      sideImageUrl: defaultPayload.trendingBanners.side.imageUrl,
      sideImageAlt: defaultPayload.trendingBanners.side.alt,
      isActive: true,
    };

    const [record] = await db.HomeContent.findOrCreate({
      where: { key: 'default' },
      defaults: createDefaults,
    });

    const categories = await db.HomeCategory.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    const menuTabs = await db.HomeMenuTab.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    const menuItems = await db.HomeMenuItem.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    const payload = {
      heroBanner: {
        badge: record.heroBadge || defaultPayload.heroBanner.badge,
        heading: record.heroHeading || defaultPayload.heroBanner.heading,
        description: record.heroDescription || defaultPayload.heroBanner.description,
        ctaText: record.heroCtaText || defaultPayload.heroBanner.ctaText,
        imageUrl: record.heroImageUrl || defaultPayload.heroBanner.imageUrl,
        alt: record.heroImageAlt || defaultPayload.heroBanner.alt,
      },
      categories: categories.length
        ? categories.map((cat) => ({
            name: cat.name,
            img: cat.imageUrl || defaultPayload.heroBanner.imageUrl,
          }))
        : defaultPayload.categories,
      trendingBanners: {
        main: {
          imageUrl: record.mainImageUrl || defaultPayload.trendingBanners.main.imageUrl,
          alt: record.mainImageAlt || defaultPayload.trendingBanners.main.alt,
          badgeLabel: record.mainBadgeLabel || defaultPayload.trendingBanners.main.badgeLabel,
          badgeColor: record.mainBadgeColor || defaultPayload.trendingBanners.main.badgeColor,
          title: record.mainTitle || defaultPayload.trendingBanners.main.title,
          description: record.mainDescription || defaultPayload.trendingBanners.main.description,
          price: String(record.mainPrice ?? defaultPayload.trendingBanners.main.price),
          rating: record.mainRating || defaultPayload.trendingBanners.main.rating,
          ratingCount: record.mainRatingCount || defaultPayload.trendingBanners.main.ratingCount,
          ctaText: record.mainCtaText || defaultPayload.trendingBanners.main.ctaText,
        },
        side: {
          imageUrl: record.sideImageUrl || defaultPayload.trendingBanners.side.imageUrl,
          alt: record.sideImageAlt || defaultPayload.trendingBanners.side.alt,
          badgeLabel: record.sideBadgeLabel || defaultPayload.trendingBanners.side.badgeLabel,
          badgeColor: record.sideBadgeColor || defaultPayload.trendingBanners.side.badgeColor,
          title: record.sideTitle || defaultPayload.trendingBanners.side.title,
          description: record.sideDescription || defaultPayload.trendingBanners.side.description,
          price: String(record.sidePrice ?? defaultPayload.trendingBanners.side.price),
          ctaText: record.sideCtaText || defaultPayload.trendingBanners.side.ctaText,
        },
      },
      menuTabs: menuTabs.length ? menuTabs.map((tab) => tab.name) : defaultPayload.menuTabs,
      menuItems: menuItems.length
        ? menuItems.map((item) => ({
            title: item.title,
            desc: item.description,
            price: Number(item.price),
            img: item.imageUrl || defaultPayload.heroBanner.imageUrl,
          }))
        : defaultPayload.menuItems,
    };

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('[HomeContentController] getHomeContent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content',
      error: error.message,
    });
  }
};
