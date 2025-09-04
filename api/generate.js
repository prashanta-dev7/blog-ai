export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, charLength, numParagraphs } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  try {
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
            content:
              "You are a professional blog writer for a luxury fashion brand. Always write in a refined, elegant, and human-like tone. Make content SEO-friendly with natural keyword usage. Avoid AI-like phrasing, repetition, and generic filler. Every blog must read as if written by an experienced human fashion editor.",
          },
          {
            role: "user",
            content: `Write a blog post about "${topic}". The post should be around ${charLength} characters long and have ${numParagraphs} paragraphs.`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ content: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: data.error?.message || "Failed to generate" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
