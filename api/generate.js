export default async function handler(req, res) {
  try {
    const { topic, charLength, numParagraphs } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // ✅ secure here
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional blog writer for a luxury fashion brand. Always write in a refined, elegant, and human-like tone. Make content SEO-friendly with natural keyword usage. Avoid AI-like phrasing, repetition, and generic filler."
          },
          {
            role: "user",
            content: `Write a blog post about "${topic}". The post should be around ${charLength} characters long and have ${numParagraphs} paragraphs.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Invalid response from OpenAI", details: data });
    }

    res.status(200).json({ output: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    res.status(500).json({ error: "Failed to generate blog" });
  }
}
