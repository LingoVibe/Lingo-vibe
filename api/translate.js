export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  try {
    const { text, target, source } = req.body || {};

    if (!text || !target) {
      return res.status(400).json({
        error: "Texte ou langue cible manquant."
      });
    }

    const languages = {
      ht: "ht",
      fr: "fr",
      en: "en",
      es: "es",
      pt: "pt",
      de: "de",
      it: "it",
      ar: "ar",
      zh: "zh-CN"
    };

    const sourceLanguage = languages[source || "ht"];
    const targetLanguage = languages[target];

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: "Langue non prise en charge."
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.status(200).json({
        translatedText: text
      });
    }

    const url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) +
      "&langpair=" +
      encodeURIComponent(sourceLanguage) +
      "%7C" +
      encodeURIComponent(targetLanguage);

    const response = await fetch(url);
    const data = await response.json();

    if (
      !response.ok ||
      data.responseStatus !== 200 ||
      !data.responseData
    ) {
      return res.status(502).json({
        error:
          data.responseDetails ||
          "La traduction a échoué."
      });
    }

    return res.status(200).json({
      translatedText: data.responseData.translatedText
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur de connexion au service de traduction."
    });
  }
}