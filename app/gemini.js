// Модуль для обработки запросов к Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = class GeminiHandler {
  constructor(_app) {
    this.API_KEY = _app.SETTINGS.gemini;
    this.app = _app;
    this.genAI = new GoogleGenerativeAI(this.API_KEY);
  }

  // Метод для отправки запроса к Gemini
  async handleRequest(prompt) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent(prompt);
    this.app.logger.log(`Gemini: ${result}`, "info");
    
    const response = await result.response;
    const text = response.text();
    return text;
  }
};