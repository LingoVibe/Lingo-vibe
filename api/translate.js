
import { franc } from "franc-min";

function splitText(text, maxLength = 150) {
  const words = text.match(/\S+\s*/g) || [];
  const chunks = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length > maxLength && current) {
      chunks.push(current.trim());
      current = "";
    }

    if (word.length > maxLength) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }

      for (let i = 0; i < word.length; i += maxLength) {
        chunks.push(word.slice(i, i + maxLength));
      }
    } else {
      current += word;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

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

    const sourceLanguage = sourceLanguages[detectedLanguage];

    if (!sourceLanguage) {
      return res.status(400).json({
        error: "Langue non détectée. Essayez avec un texte plus long."
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.status(200).json({
        detectedLanguage: sourceLanguage,
        translatedText: text
      });
    }

    const chunks = splitText(text, 150);
    const translations = [];

    for (const chunk of chunks) {
      const url = new URL(
        "https://api.mymemory.translated.net/get"
      );

      url.searchParams.set("q", chunk);
      url.searchParams.set(
        "langpair",
        `${sourceLanguage}|${targetLanguage}`
      );

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.responseStatus !== 200) {
        throw new Error(
          data.responseDetails || "La traduction a échoué."
        );
      }

      translations.push(
        data.responseData.translatedText
      );
    }

    return res.status(200).json({
      detectedLanguage: sourceLanguage,
      translatedText: translations.join(" ")
    });

  } catch (error) {
    console.error("Translation error:", error);

    return res.status(502).json({
      error: error.message ||
        "Erreur de connexion au service de traduction."
    });
  }
}
