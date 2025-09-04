// /api/generate.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Parse JSON body properly
    const body = req.body || (await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data || "{}")));
    }));

    const { topic, charLength, numParagraphs } = body;

    if (!topic || !charLength || !numParagraphs) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional blog writer. Always write SEO-friendly, luxury, and aesthetic blog posts in the brand's tone."
          },
          {
            role: "user",
            content: `Write a blog post about "${topic}". The post should be around ${charLength} characters long and divided into ${numParagraphs} paragraphs.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();

    // ✅ Safety check
    if (!data.choices || !data.choices.length) {
      console.error("OpenAI response error:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI", details: data });
    }

    const content = data.choices[0].message.content;

    return res.status(200).json({ blog: content });
  } catch (error) {
    console.error("Error in generate API:", error);
    return res.status(500).json({ error: error.message });
  }
}
