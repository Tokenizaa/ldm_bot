import { GoogleGenerativeAI } from "@google/genai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const aiService = {
  async generateProductDescription(productTitle: string, brand: string, specs: string) {
    if (!process.env.GEMINI_API_KEY) {
      return "Resumo IA: Ferramenta de alta qualidade para uso profissional e industrial.";
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Gere uma descrição curta (máximo 300 caracteres) e persuasiva em português para o produto: ${productTitle} da marca ${brand}. Destaque as especificações: ${specs}. A descrição deve ser técnica porém atrativa para profissionais.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Erro ao gerar descrição remota:", error);
      return "Resumo IA: Alta performance e durabilidade garantida para serviços pesados.";
    }
  },

  async getOpportunityScore(price: number, oldPrice: number, category: string) {
    // Logic to calculate opportunity score
    const discount = ((oldPrice - price) / oldPrice) * 100;
    let score = 50 + (discount * 0.8);
    
    if (discount > 40) score += 10;
    if (price < 100) score += 5;
    
    return Math.min(Math.round(score), 100);
  }
};
