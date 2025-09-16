// /api/generate.js
// ESM (package.json should include: { "type": "module" })

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body !== "string") return resolve(req.body);
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

// ----------- STYLE GUIDE -----------
const STYLE_GUIDE = `
[BRAND TONE]
- Voice: refined, editorial, confident, approachable, and rooted in fashion expertise.
- Rhythm: varied sentence lengths; natural transitions; balanced flow (no robotic cadence).
- Diction: use precise fashion vocabulary (silhouettes, fabrics, embellishments, styling cues).
- POV: authoritative but conversational; inclusive and reader-friendly.
- Formality: polished yet warm—write like a seasoned fashion editor speaking to a style-conscious reader.

[WRITING STYLE]
- Open with a strong hook or contextual statement that sets the stage.
- Use subheadings (H2/H3) to structure the piece clearly (especially for guides and listicles).
- Provide descriptive details (fabric, cut, embroidery, drape, finish, accessories, occasions).
- Tie content to cultural or fashion contexts (festive seasons, celebrity styles, runway trends).
- Keep paragraphs concise and skimmable; avoid walls of text.
- When lists are natural, use bullet points or numbered lists for clarity.

[FORMATTING RULES]
- Do NOT use em dashes (—). Instead, use commas, colons, or full stops for smooth readability.
- Do NOT include SEO metadata in the output.
`;

function composeSystemPrompt(styleGuide, topic) {
  return [
    "You are a professional blog writer for a luxury fashion brand.",
    "Your job is to produce SEO-friendly, human-first editorials that read like a seasoned fashion editor.",
    "Follow the BRAND TONE, WRITING STYLE, and FORMATTING RULES strictly. Never copy external sources verbatim.",
    "",
    "== STYLE GUIDE ==",
    styleGuide.trim(),
    "",
    `== CONTEXT ==\nTopic focus: ${topic}`,
  ].join("\n");
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY on server" });
  }

  try {
    const body = await parseBody(req);
    const { topic, charLength, numParagraphs, additional } = body;

    if (!topic || !charLength || !numParagraphs) {
      return res.status(400).json({ error: "Missing required fields: topic, charLength, numParagraphs" });
    }

    const systemPrompt = composeSystemPrompt(STYLE_GUIDE, topic);

    let userPrompt = [
      `Write a blog on: "${topic}".`,
      `Target length: ~${charLength} characters.`,
      `Paragraphs: ${numParagraphs}.`,
      "",
      "Formatting requirements:",
      "- Use H2/H3 subheadings where they improve readability.",
      "- Include light internal structuring (bullets/numbers) when it adds clarity."
    ].join("\n");

    if (additional && String(additional).trim()) {
      userPrompt += `\n\nAdditional requests (must follow): ${additional}`;
    }

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        error: data?.error?.message || "OpenAI API error",
        raw: data,
      });
    }

    const output = data?.choices?.[0]?.message?.content || "";
    if (!output) {
      return res.status(500).json({ error: "No content returned from model", raw: data });
    }

    return res.status(200).json({ output });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
