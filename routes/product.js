const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { ensureUserProgression, buildProgressionPayload } = require("../services/progression");
const { buildProductDashboard, purchaseProduct } = require("../services/product");
const { buildLiveOpsDashboard } = require("../services/liveOps");

const router = express.Router();

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");
  return scheme === "Bearer" && value ? value : null;
}

async function readAuthenticatedUser(request) {
  const token = readToken(request);

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.sub ? User.findById(payload.sub) : null;
  } catch (error) {
    return null;
  }
}

router.get("/dashboard", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para ver tienda y economia." });
    }

    ensureUserProgression(user);
    await user.save();

    return response.json(await buildProductDashboard(user));
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar la tienda." });
  }
});

router.get("/liveops", async (_request, response) => {
  try {
    return response.json(await buildLiveOpsDashboard());
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar live ops." });
  }
});

router.post("/purchase/:itemId", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para comprar." });
    }

    ensureUserProgression(user);
    const result = await purchaseProduct(user, request.params.itemId);
    await user.save();

    return response.status(201).json({
      message: `${result.item.title} desbloqueado.`,
      receipt: {
        id: result.receipt._id.toString(),
        itemId: result.receipt.itemId,
        amount: result.receipt.amount,
        status: result.receipt.status,
        provider: result.receipt.provider,
        createdAt: result.receipt.createdAt,
      },
      grantedItems: result.grantedItems,
      progression: buildProgressionPayload(user),
      product: await buildProductDashboard(user),
    });
  } catch (error) {
    return response.status(400).json({ message: error.message || "No se pudo completar la compra." });
  }
});

module.exports = router;
