// /api/generate.js

export default async function handler(req, res) {
  // --- Handle CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request → just return OK
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, charLength, numParagraphs } = req.body;

    if (!topic || !charLength || !numParagraphs) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- Call OpenAI ---
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // you can switch to gpt-4.1 or gpt-4.1-turbo for bigger blogs
        messages: [
          {
            role: "system",
            content: "You are a professional blog writer. Always write SEO-friendly, luxury, and aesthetic blog posts in the brand's tone. Keep paragraphs structured and engaging."
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenAI API call failed");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return res.status(200).json({ blog: content });
  } catch (error) {
    console.error("Error in generate API:", error);
    return res.status(500).json({ error: error.message });
  }
}
