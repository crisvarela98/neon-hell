const express = require("express");

const AnalyticsEvent = require("../models/AnalyticsEvent");
const { buildLiveOpsDashboard, setConfigValue } = require("../services/liveOps");

const router = express.Router();

function isAdminRequest(request) {
  const expectedToken = process.env.ADMIN_TOKEN || "";
  const providedToken = request.headers["x-admin-token"];
  return Boolean(expectedToken) && providedToken === expectedToken;
}

router.use((request, response, next) => {
  if (!isAdminRequest(request)) {
    return response.status(401).json({ message: "ADMIN_TOKEN requerido." });
  }

  return next();
});

router.get("/liveops", async (_request, response) => {
  try {
    return response.json(await buildLiveOpsDashboard());
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar live ops." });
  }
});

router.put("/liveops/:key", async (request, response) => {
  try {
    const config = await setConfigValue(request.params.key, request.body.value, "admin");
    return response.json({
      key: config.key,
      value: config.value,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    return response.status(400).json({ message: "No se pudo actualizar la configuracion." });
  }
});

router.get("/analytics", async (_request, response) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$username" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const getCount = (type) => Number(events.find((entry) => entry._id === type)?.count || 0);

    return response.json({
      windowDays: 30,
      events: events.map((entry) => ({
        type: entry._id,
        count: entry.count,
        uniqueUsers: entry.uniqueUsers.filter(Boolean).length,
      })),
      funnel: {
        registration: getCount("register_success"),
        d1Return: getCount("d1_return"),
        d7Return: getCount("d7_return"),
        purchase: getCount("purchase_success"),
        churnRisk: getCount("churn_risk"),
      },
    });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar analytics." });
  }
});

module.exports = router;
