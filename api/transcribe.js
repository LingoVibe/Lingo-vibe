
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Clé API OpenAI manquante."
      });
    }

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({
        error: "Format de fichier invalide."
      });
    }

    const boundary = contentType.split("boundary=")[1];

    if (!boundary) {
      return res.status(400).json({
        error: "Fichier audio manquant."
      });
    }

    const parts = buffer.toString("latin1").split("--" + boundary);

    let audioBuffer = null;
    let filename = "audio.mp3";

    for (const part of parts) {
      if (part.includes('name="file"')) {
        const separator = part.indexOf("\r\n\r\n");

        if (separator !== -1) {
          let fileContent = part.slice(separator + 4);
          fileContent = fileContent.replace(/\r\n$/, "");

          const header = part.slice(0, separator);
          const match = header.match(/filename="([^"]+)"/);

          if (match) filename = match[1];

          audioBuffer = Buffer.from(fileContent, "latin1");
          break;
        }
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        error: "Aucun fichier audio reçu."
      });
    }

    const form = new FormData();

    form.append(
      "file",
      new Blob([audioBuffer]),
      filename
    );

    form.append("model", "gpt-4o-mini-transcribe");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: form
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || "Transcription échouée."
      });
    }

    return res.status(200).json({
      transcript: data.text
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur pendant la transcription audio."
    });
  }
}