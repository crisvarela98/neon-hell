const express = require("express");
const jwt = require("jsonwebtoken");

const AnalyticsEvent = require("../models/AnalyticsEvent");

const router = express.Router();

function readUsername(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");

  if (scheme !== "Bearer" || !value || !process.env.JWT_SECRET) {
    return "";
  }

  try {
    return jwt.verify(value, process.env.JWT_SECRET)?.username || "";
  } catch (error) {
    return "";
  }
}

router.post("/events", async (request, response) => {
  try {
    const type = String(request.body.type || "").trim().slice(0, 80);

    if (!type) {
      return response.status(400).json({ message: "Falta tipo de evento." });
    }

    await AnalyticsEvent.create({
      username: readUsername(request),
      type,
      properties: request.body.properties || {},
    });

    return response.status(202).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo registrar analytics." });
  }
});

module.exports = router;
