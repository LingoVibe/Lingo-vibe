
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  try {
    const { text, target } = req.body || {};

    if (!text || !target) {
      return res.status(400).json({
        error: "Texte ou langue manquant."
      });
    }

    const apiKey = process.env.LIBRETRANSLATE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "La clé API de traduction n'est pas encore configurée sur Vercel."
      });
    }

    const response = await fetch(
      "https://libretranslate.com/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: target,
          format: "text",
          api_key: apiKey
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Le service de traduction a refusé la demande."
      });
    }

    return res.status(200).json({
      translatedText: data.translatedText
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur de connexion au service de traduction."
    });
  }
}
