
import { GoogleGenAI } from "@google/genai";
import { DalgonaShape } from '../types';

const API_KEY = process.env.API_KEY;

// if (!API_KEY) {
//   console.warn("API_KEY environment variable not set. Dalgona game will use fallback shapes.");
// }

//const ai = new GoogleGenAI({ apiKey: API_KEY });

const fallbackPaths: Record<DalgonaShape, string> = {
    [DalgonaShape.Triangle]: "M 50 15 L 85 85 L 15 85 Z",
    [DalgonaShape.Circle]: "M 50, 50 m -35, 0 a 35,35 0 1,0 70,0 a 35,35 0 1,0 -70,0",
    [DalgonaShape.Star]: "M 50,5 L 61,40 L 98,40 L 68,62 L 79,96 L 50,75 L 21,96 L 32,62 L 2,40 L 39,40 Z",
    [DalgonaShape.Umbrella]: "M 50 20 C 20 20, 20 50, 20 50 L 80 50 C 80 50, 80 20, 50 20 Z M 50 50 L 50 80 M 40 80 C 40 90, 50 90, 50 80",
};

export const generateDalgonaShape = async (shape: DalgonaShape): Promise<string> => {
  if (!API_KEY) {
    return fallbackPaths[shape];
  }
  try {
    const prompt = `You are an SVG path data generator. Your task is to provide only the 'd' attribute string for an SVG <path> tag. The path should represent a ${shape}. It must be a single, continuous, non-filled line. The shape should be centered within a 100x100 viewBox. Do not provide any explanation, code blocks, or any text other than the path data itself.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const pathData = response.text.trim().replace(/`/g, '');
    
    // Basic validation
    if (pathData.startsWith('M') || pathData.startsWith('m')) {
        return pathData;
    }
    
    console.warn("Received invalid path data from Gemini, using fallback.");
    return fallbackPaths[shape];

  } catch (error) {
    console.error("Error generating Dalgona shape with Gemini API:", error);
    return fallbackPaths[shape];
  }
};
