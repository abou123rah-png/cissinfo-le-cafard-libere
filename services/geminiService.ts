import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { DailyReview } from "../types";

// Clé API Gemini depuis .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Revue de presse (sans schéma strict, plus stable)
export const fetchDailyReview = async (date: string): Promise<DailyReview> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Tu es l'intelligence artificielle de l'application 'L'ENSEIGNANT EN SERVICE - Mr Cissé'. Ta mission est de rédiger la revue de presse quotidienne intitulée 'Le Cafard Libéré du Jour'.

Consignes : Nous sommes le ${date}. Utilise tes capacités de recherche pour analyser l'actualité sénégalaise des dernières 24 heures uniquement sur : APS, Seneweb, SeneNews, Le Soleil, Senego, et WiwSport.

Réponds UNIQUEMENT avec un objet JSON valide (pas de texte avant/après, pas de \`\`\`json, pas de markdown). Utilise exactement ces clés :
- "date": string (la date donnée)
- "debateQuestion": string (question de débat)
- "summary": string (résumé principal)
- "headlines": array d'objets { "title": string, "category": string, "source": string, "content": string, "confidence": number }
- "opportunities": array d'objets { "type": string, "title": string, "deadline": string }
- "innovation": objet { "title": string, "description": string }
- "debateDetails": objet { "pro": string, "con": string, "proExpert": string, "conExpert": string }
- "motEnseignant": string
- "sources": array de string
- "caricatureCaption": string (légende pour la caricature)

Ton ton : Éducatif, rigoureux, panafricain et inspirant. Français impeccable avec Teranga, Jambar.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Debug : voir exactement ce que Gemini renvoie
    console.log("Réponse brute Gemini :", text);

    // Nettoyage : enlève markdown si présent
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Réponse Gemini n'est pas un objet JSON valide");
    }

    console.log("JSON parsé OK :", parsed);
    return parsed as DailyReview;

  } catch (error) {
    console.error("Erreur fetchDailyReview :", error);
    throw error;
  }
};

// Génération de caricature avec Hugging Face (FLUX.1-dev, optimisé)
export const generateCaricature = async (caption: string): Promise<string> => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    console.warn("HUGGINGFACE_API_KEY non trouvée → placeholder");
    return `https://picsum.photos/800/600?text=Ajouter+HF_API_KEY`;
  }

  try {
    console.log("Génération caricature HF pour :", caption);

    const prompt = `Crée une caricature satirique très exagérée et humoristique au style bande dessinée sénégalaise moderne, couleurs ultra vives et contrastées, ambiance Teranga et Jambar, expression faciale comique, dramatique et ironique, paysage mixte urbain-rural avec éléments absurdes et drôles. Représente fidèlement et avec précision cette légende exacte : "${caption}". Ajoute une touche d'ironie politique, détails drôles, symboles sénégalais, pas de réalisme. Haute qualité, style dessin animé satirique. Variante unique : ${Math.random().toString(36).substring(7)}`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        inputs: prompt,
        parameters: {
          num_inference_steps: 35,
          guidance_scale: 8.0,
          negative_prompt: "flou, réaliste, photo, moche, basse qualité, terne"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const blob = new Blob([response.data], { type: "image/png" });
    const imageUrl = URL.createObjectURL(blob);

    console.log("Image HF générée OK !");
    return imageUrl;

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur HF génération image :", errMsg);
    return `https://picsum.photos/800/600?text=Erreur+HF`;
  }
};

// Placeholder audio
export const generateAudioBila = async (text: string): Promise<string> => {
  console.warn("Audio-Bila non implémenté → placeholder vide");
  return '';
};