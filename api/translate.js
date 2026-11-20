
import { franc } from "franc-min";

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

    const targetLanguage = languages[target.toLowerCase()];

    if (!targetLanguage) {
      return res.status(400).json({
        error: "Langue non prise en charge."
      });
    }

    const detectedLanguage = franc(text);

    const sourceLanguages = {
      hat: "ht",
      fra: "fr",
      eng: "en",
      spa: "es",
      por: "pt",
      deu: "de",
      ita: "it",
      ara: "ar",
      cmn: "zh-CN"
    };

    const sourceLanguage =
      sourceLanguages[detectedLanguage];

    if (!sourceLanguage) {
      return res.status(400).json({
        error: "Langue non détectée. Écrivez un texte plus long."
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.status(200).json({
        detectedLanguage: sourceLanguage,
        translatedText: text
      });
    }

    const langPair = `${sourceLanguage}|${targetLanguage}`;

    const url = new URL(
      "https://api.mymemory.translated.net/get"
    );

    url.searchParams.set("q", text);
    url.searchParams.set("langpair", langPair);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.responseStatus !== 200) {
      return res.status(502).json({
        error: data.responseDetails || "La traduction a échoué."
      });
    }

    return res.status(200).json({
      detectedLanguage: sourceLanguage,
      translatedText: data.responseData.translatedText
    });

  } catch (error) {
    console.error("Translation error:", error);

    return res.status(500).json({
      error: "Erreur de connexion au service de traduction."
    });
  }
}
