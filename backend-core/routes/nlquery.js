const express = require("express");
const axios = require("axios");
const store = require("../lib/store");
const { getLedger } = require("../lib/services");

function buildNlQueryRouter() {
  const router = express.Router();

  router.post("/nlquery", async (req, res) => {
    const { question } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question (string) is required" });
    }

    try {
      const rooms = Object.values(store.rooms);
      const alerts = store.alerts;
      const remoteLedger = await getLedger();
      const ledger = remoteLedger || store.ledger;

      const context = {
        rooms,
        alerts,
        ledger: {
          total_kwh_saved: ledger.total_kwh_saved,
          total_rupees_saved: ledger.total_rupees_saved,
         total_co2_kg_saved: ledger.total_co2_saved_kg,
        },
      };

      const prompt = `You are the ClassWatch assistant. Answer questions about classroom
energy usage using ONLY the live data provided below. Be concise (2-3 sentences max).
If the data doesn't contain the answer, say so plainly instead of guessing.

DATA:
${JSON.stringify(context, null, 2)}

QUESTION: ${question}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      );

      const answer = response.data.candidates[0].content.parts[0].text.trim();
      res.json({ answer, chart_data: null });
    } catch (err) {
      console.error(`[nlquery] error: ${err.message}`);
      if (err.response) {
        console.error(`[nlquery] Gemini response:`, JSON.stringify(err.response.data));
      }
      res.status(500).json({ answer: "Sorry, I couldn't process that question right now.", chart_data: null });
    }
  });

  return router;
}

module.exports = buildNlQueryRouter;