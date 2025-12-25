import { GoogleGenerativeAI, SchemaType, GenerateContentResponse } from "@google/generative-ai";
import { DailyReview } from "../types";

// Use GEMINI_API_KEY from .env (Vite exposes it via process.env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const fetchDailyReview = async (date: string): Promise<DailyReview> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Tu es l'intelligence artificielle de l'application 'L'ENSEIGNANT EN SERVICE - Mr Cissé'. Ta mission est de rédiger la revue de presse quotidienne intitulée 'Le Cafard Libéré du Jour'.
  
  Consignes : Nous sommes le ${date}. Utilise tes capacités de recherche pour analyser l'actualité sénégalaise des dernières 24 heures uniquement sur : APS, Seneweb, SeneNews, Le Soleil, Senego, et WiwSport.
  
  Génère une réponse structurée en JSON strictement selon le schéma suivant. 
  Ton ton doit être : Éducatif, rigoureux, panafricain et inspirant. Utilise un français impeccable avec quelques expressions sénégalaises subtiles (ex: Teranga, Jambar).`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          debateQuestion: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          headlines: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING },
                source: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER },
              },
              required: ["title", "category", "source", "content", "confidence"]
            }
          },
          opportunities: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                type: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                deadline: { type: SchemaType.STRING }
              },
              required: ["type", "title", "deadline"]
            }
          },
          innovation: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING }
            },
            required: ["title", "description"]
          },
          debateDetails: {
            type: SchemaType.OBJECT,
            properties: {
              pro: { type: SchemaType.STRING },
              con: { type: SchemaType.STRING },
              proExpert: { type: SchemaType.STRING },
              conExpert: { type: SchemaType.STRING }
            },
            required: ["pro", "con", "proExpert", "conExpert"]
          },
          motEnseignant: { type: SchemaType.STRING },
          sources: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          caricatureCaption: { type: SchemaType.STRING }
        },
        required: ["date", "debateQuestion", "summary", "headlines", "opportunities", "innovation", "debateDetails", "motEnseignant", "sources", "caricatureCaption"]
      }
    }
  });

  const response = await result.response;
  return JSON.parse(response.text());
};

export const generateCaricature = async (caption: string): Promise<string> => {
  // Note: Gemini API doesn't generate images. Placeholder for now (use a real image gen API if needed).
  console.warn("Image generation not supported; returning placeholder.");
  return 'https://picsum.photos/800/600';
};

export const generateAudioBila = async (text: string): Promise<string> => {
  // Note: Gemini API doesn't generate audio/TTS. Placeholder for now (use Google Cloud TTS or browser SpeechSynthesis if needed).
  console.warn("Audio generation not supported; returning empty base64.");
  return '';  // Or throw new Error("Audio not supported");
};