
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedContent, PDFSection } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const contentSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A compelling and relevant title for the document."
        },
        sections: {
            type: Type.ARRAY,
            description: "An array of sections, each with a heading and content. Aim for 3-5 sections.",
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: {
                        type: Type.STRING,
                        description: "The heading for this section."
                    },
                    content: {
                        type: Type.STRING,
                        description: "The detailed content for this section. Should be a few paragraphs long."
                    }
                },
                required: ["heading", "content"]
            }
        }
    },
    required: ["title", "sections"]
};


export async function generateContentStructure(prompt: string): Promise<Omit<GeneratedContent, 'sections'> & { sections: Omit<PDFSection, 'imageUrl'>[] }> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Based on the following prompt, generate the content structure for a comprehensive document. The content should be well-organized, detailed, and informative. Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: contentSchema,
            },
        });
        
        const text = response.text.trim();
        const parsedContent = JSON.parse(text);

        // Basic validation
        if (!parsedContent.title || !Array.isArray(parsedContent.sections)) {
            throw new Error("Invalid content structure received from API.");
        }

        return parsedContent;

    } catch (error) {
        console.error("Error generating content structure:", error);
        throw new Error("Failed to generate text content from Gemini API.");
    }
}

export async function generateImageForText(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        
        throw new Error("No image data found in the response.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from Gemini API.");
    }
}
