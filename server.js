// Packweight backend — serves the app and researches lighter gear tiers via Claude.
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
// Cheaper model keeps you well under the $20/mo cap. Bump to claude-opus-5 for max quality.
const MODEL = process.env.PACKWEIGHT_MODEL || "claude-sonnet-5";

const SYSTEM = `You help hunters and backcountry hikers find lighter versions of gear they already own.

Given ONE item the user owns (its name and current weight in ounces), reply with:
- category: a short label for what it is (e.g. "Shelter", "Sleep", "Pack", "Footwear", "Optics", "Firearm", "Clothing", "Cook & Water", "Tools").
- tiers: EXACTLY three real, currently-sold replacement products that are genuinely lighter and serve the SAME purpose, ordered heaviest-first: tier 1 = smallest weight drop ("low tier"), tier 3 = the lightest ("high tier").

Hard rules:
- Same realm only. A backcountry hunting boot's replacements are lighter backcountry/hiking boots — never a sandal or a heavy insulated snow boot. A semi-automatic .308 stays a semi-automatic .308 (not a bolt-action). A rangefinding binocular stays a rangefinding binocular.
- Every tier MUST weigh less than the user's item. Do not suggest a product that weighs the same or more — that is not an upgrade.
- If genuinely lighter options barely exist for this item, still return the three lightest credible ones (small savings are fine and honest).
- Use real brand + model names, realistic per-unit weights in ounces, and realistic current U.S. street prices in dollars.
- weight_oz and price_usd must be plain numbers.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    tiers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          weight_oz: { type: "number" },
          price_usd: { type: "number" }
        },
        required: ["name", "weight_oz", "price_usd"]
      }
    }
  },
  required: ["category", "tiers"]
};

app.post("/api/research", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const weight = Number(req.body?.weight);
    if (!name) return res.status(400).json({ error: "Missing gear name." });

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{
        role: "user",
        content: `Item: ${name}\nCurrent weight: ${isFinite(weight) ? weight + " oz" : "unknown"}`
      }]
    });

    const text = (resp.content.find(b => b.type === "text") || {}).text || "{}";
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    console.error("research error:", e?.message || e);
    res.status(500).json({ error: "Couldn't research that item — try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Packweight listening on port " + PORT));
