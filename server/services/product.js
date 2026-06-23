const Receipt = require("../models/Receipt");

const COSMETIC_LABELS = {
  titles: {
    "season-founder": "Season Founder",
    "void-runner": "Void Runner",
    "squad-anchor": "Squad Anchor",
  },
  banners: {
    "black-signal-premium": "Black Signal Premium",
    "horde-veteran": "Horde Veteran",
    "market-neon": "Market Neon",
  },
  emotes: {
    "gg-signal": "GG Signal",
    "breach-flex": "Breach Flex",
  },
  weaponSkins: {
    "golden-repeater": "Golden Repeater",
    "carbon-hellburst": "Carbon Hellburst",
    "ruby-shotgun": "Ruby Shotgun",
  },
};

const STORE_BUNDLES = [
  {
    id: "starter-neon-pack",
    title: "Starter Neon Pack",
    price: 250,
    type: "cosmetic-bundle",
    items: [
      { type: "banner", id: "market-neon" },
      { type: "emote", id: "gg-signal" },
    ],
  },
  {
    id: "horde-veteran-pack",
    title: "Horde Veteran Pack",
    price: 420,
    type: "cosmetic-bundle",
    items: [
      { type: "title", id: "void-runner" },
      { type: "banner", id: "horde-veteran" },
      { type: "weaponSkin", id: "ruby-shotgun" },
    ],
  },
  {
    id: "heavy-metal-pack",
    title: "Heavy Metal Pack",
    price: 520,
    type: "cosmetic-bundle",
    items: [
      { type: "weaponSkin", id: "carbon-hellburst" },
      { type: "emote", id: "breach-flex" },
    ],
  },
];

const PREMIUM_PASS_ITEM = {
  id: "black-signal-premium-pass",
  title: "Black Signal Premium Pass",
  price: 900,
  type: "premium-pass",
  items: [
    { type: "title", id: "season-founder" },
    { type: "banner", id: "black-signal-premium" },
    { type: "weaponSkin", id: "golden-repeater" },
  ],
};

function getCollectionKey(type) {
  return type === "weaponSkin" ? "weaponSkins" : `${type}s`;
}

function getLabel(item) {
  return COSMETIC_LABELS[getCollectionKey(item.type)]?.[item.id] || item.id;
}

function ensureEconomy(user) {
  if (!user.wallet) {
    user.wallet = {};
  }

  if (typeof user.wallet.softCurrency !== "number") {
    user.wallet.softCurrency = 500;
  }

  if (typeof user.wallet.lifetimeSoftCurrency !== "number") {
    user.wallet.lifetimeSoftCurrency = user.wallet.softCurrency;
  }

  if (!user.cosmetics) {
    user.cosmetics = {};
  }

  if (!user.cosmetics.inventory) {
    user.cosmetics.inventory = {};
  }

  user.cosmetics.inventory.titles = [...new Set(user.cosmetics.inventory.titles || [])];
  user.cosmetics.inventory.banners = [...new Set(user.cosmetics.inventory.banners || [])];
  user.cosmetics.inventory.emotes = [...new Set(user.cosmetics.inventory.emotes || [])];
  user.cosmetics.inventory.weaponSkins = [...new Set(user.cosmetics.inventory.weaponSkins || [])];
}

function getRotatingStore(now = new Date()) {
  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const rotation = dayIndex % STORE_BUNDLES.length;
  const bundles = [
    STORE_BUNDLES[rotation],
    STORE_BUNDLES[(rotation + 1) % STORE_BUNDLES.length],
  ];

  return {
    softCurrencyName: "Neon Credits",
    resetAt: new Date((dayIndex + 1) * 24 * 60 * 60 * 1000),
    premiumPass: {
      ...PREMIUM_PASS_ITEM,
      items: PREMIUM_PASS_ITEM.items.map((item) => ({
        ...item,
        label: getLabel(item),
      })),
    },
    bundles: bundles.map((bundle) => ({
      ...bundle,
      items: bundle.items.map((item) => ({
        ...item,
        label: getLabel(item),
      })),
    })),
  };
}

function grantCosmetic(user, item) {
  const collectionKey = getCollectionKey(item.type);
  const current = new Set(user.cosmetics.inventory[collectionKey] || []);
  const alreadyOwned = current.has(item.id);

  current.add(item.id);
  user.cosmetics.inventory[collectionKey] = [...current];

  if (!user.cosmetics.equipped) {
    user.cosmetics.equipped = {};
  }

  const equippedKey = item.type === "weaponSkin" ? "weaponSkin" : item.type;

  if (!user.cosmetics.equipped[equippedKey]) {
    user.cosmetics.equipped[equippedKey] = item.id;
  }

  return {
    ...item,
    label: getLabel(item),
    alreadyOwned,
  };
}

async function purchaseProduct(user, itemId) {
  ensureEconomy(user);
  const store = getRotatingStore();
  const item = [store.premiumPass, ...store.bundles].find((entry) => entry.id === itemId);

  if (!item) {
    throw new Error("Producto no disponible en la tienda actual.");
  }

  if (user.wallet.softCurrency < item.price) {
    throw new Error("No tienes Neon Credits suficientes.");
  }

  user.wallet.softCurrency -= item.price;
  const grantedItems = item.items.map((cosmetic) => grantCosmetic(user, cosmetic));

  if (item.type === "premium-pass") {
    if (!user.seasonState) {
      user.seasonState = {};
    }
    user.seasonState.premiumOwned = true;
  }

  const receipt = await Receipt.create({
    username: user.username,
    type: item.type,
    itemId: item.id,
    amount: item.price,
    metadata: {
      title: item.title,
      grantedItems,
    },
  });

  return {
    receipt,
    item,
    grantedItems,
  };
}

async function buildProductDashboard(user) {
  ensureEconomy(user);
  const [receipts, store] = await Promise.all([
    Receipt.find({ username: user.username }).sort({ createdAt: -1 }).limit(8).lean(),
    Promise.resolve(getRotatingStore()),
  ]);

  return {
    wallet: {
      softCurrency: user.wallet.softCurrency,
      lifetimeSoftCurrency: user.wallet.lifetimeSoftCurrency,
    },
    premiumOwned: Boolean(user.seasonState?.premiumOwned),
    store,
    receipts: receipts.map((receipt) => ({
      id: receipt._id.toString(),
      type: receipt.type,
      itemId: receipt.itemId,
      amount: receipt.amount,
      status: receipt.status,
      provider: receipt.provider,
      createdAt: receipt.createdAt,
      title: receipt.metadata?.title || receipt.itemId,
    })),
  };
}

module.exports = {
  PREMIUM_PASS_ITEM,
  STORE_BUNDLES,
  buildProductDashboard,
  ensureEconomy,
  getRotatingStore,
  purchaseProduct,
};
