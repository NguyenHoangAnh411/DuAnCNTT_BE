require('dotenv').config();
const axios = require('axios');
const { advancedEnglishLearningPrompt } = require('./config/prompts');
const { v4: uuidv4 } = require('uuid');

class ChatbotController {
  static conversationStore = new Map();
  static MAX_HISTORY_LENGTH = 10;

  constructor() {

  }

  async getConversationHistory(sessionId) {
    return ChatbotController.conversationStore.get(sessionId) || [];
  }

  async saveToConversationHistory(sessionId, message, role) {
    let history = ChatbotController.conversationStore.get(sessionId) || [];
    const historyItem = {
      id: uuidv4(),
      role,
      text: message,
      timestamp: Date.now()
    };
    history.push(historyItem);
    if (history.length > ChatbotController.MAX_HISTORY_LENGTH) {
      history.shift();
    }
    ChatbotController.conversationStore.set(sessionId, history);
  }

  buildPrompt(sessionId, message) {
    const context = advancedEnglishLearningPrompt;
    let prompt = `Context: ${context}\n`;
    prompt += "Instruction: Provide a comprehensive, engaging, and contextually appropriate response. Ensure your answer is detailed, insightful, and professionally articulated.\n\n";
    prompt += `Session ID: ${sessionId}\n`;
    prompt += `Current User Message: ${message}\n\n`;
    return prompt;
  }

  static async ChatBot(req, res) {
    try {
      const { message } = req.body;
      const sessionId = req.headers['x-session-id'] || uuidv4();

      const validationResult = ChatbotController.validateInput(message);
      if (!validationResult.valid) {
        return res.status(400).json({
          status: 'error',
          error: 'Invalid input',
          details: validationResult.message
        });
      }

      const chatbotController = new ChatbotController();
      await chatbotController.saveToConversationHistory(sessionId, message, 'User');

      const prompt = chatbotController.buildPrompt(sessionId, message);
      console.log("Built prompt:\n", prompt);

      let responseData = await chatbotController.generateResponse(prompt, sessionId);
      if (responseData?.response?.text) {
        await chatbotController.saveToConversationHistory(sessionId, responseData.response.text, 'Assistant');
      }

      const wikiSummary = await ChatbotController.fetchWikipediaSummary(message);
      if (wikiSummary) {
        responseData.response.text += "\n\n**Additional Information from Wikipedia:**\n" + wikiSummary;
        await chatbotController.saveToConversationHistory(sessionId, wikiSummary, 'Assistant');
      }

      return res.json({
        ...responseData,
        sessionId
      });
    } catch (error) {
      console.error("ChatBot error:", error);
      return res.status(500).json({
        status: 'error',
        error: 'Internal server error'
      });
    }
  }

  async generateResponse(prompt, sessionId) {
    const maxAttempts = 3;
    let attempts = 0;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        const response = await ChatbotController.callLanguageModel(prompt);
        console.log("Raw response from API:", response);
        if (!response || !response.length) {
          throw new Error("Empty response from language model");
        }
        return ChatbotController.formatResponse(response, prompt);
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        lastError = error;
        attempts++;
        await ChatbotController.delay(1000 * attempts);
      }
    }
    return ChatbotController.getFallbackResponse(prompt, lastError);
  }

  static async callLanguageModel(prompt) {
    const model = 'google/flan-t5-large';
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.9,
          top_p: 0.9,
          do_sample: true,
          num_return_sequences: 1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return response.data;
  }

  static validateInput(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, message: 'Message must be a non-empty string' };
    }
    const trimmedMessage = message.trim();
    const messageLength = trimmedMessage.length;
    if (messageLength === 0) {
      return { valid: false, message: 'Message cannot be empty' };
    }
    if (messageLength > 1000) {
      return { valid: false, message: 'Message must be less than 1000 characters' };
    }
    const inappropriateContentRegex = /(\b(fuck|shit|damn)\b)/i;
    if (inappropriateContentRegex.test(trimmedMessage)) {
      return { valid: false, message: 'Inappropriate content detected' };
    }
    return { valid: true };
  }

  static formatResponse(response, originalPrompt) {
    const fullText = response[0]?.generated_text?.trim() || "I apologize, I couldn't generate a response.";
    const marker = "Assistant:";
    const lastMarkerIndex = fullText.lastIndexOf(marker);
    let coreResponse = "";
    if (lastMarkerIndex !== -1) {
      coreResponse = fullText.substring(lastMarkerIndex + marker.length).trim();
    } else {
      coreResponse = fullText;
    }
    if (!coreResponse) {
      coreResponse = fullText;
    }

    let improvedResponse = "**Explanation:**\n" + coreResponse;
    improvedResponse += "\n\n**References:**\nFor further details, please refer to authoritative resources such as the Oxford English Dictionary, Cambridge Dictionary, or relevant Wikipedia articles.";
    
    return {
      status: "success",
      response: {
        text: improvedResponse
      }
    };
  }

  static async getFallbackResponse(prompt, error) {
    return {
      status: "partial_success",
      response: {
        text: "I'm sorry, I'm having trouble processing your request. Please try again.",
        fallback: true,
        error: error?.message
      }
    };
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async fetchWikipediaSummary(query) {
    try {
      const searchResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
        params: {
          action: "query",
          list: "search",
          srsearch: query,
          format: "json",
          origin: "*"
        }
      });
      if (searchResponse.data?.query?.search && searchResponse.data.query.search.length > 0) {
        const title = searchResponse.data.query.search[0].title;
        const summaryResponse = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (summaryResponse.data && summaryResponse.data.extract) {
          return summaryResponse.data.extract + "\nFor more info, visit: " + summaryResponse.data.content_urls.desktop.page;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching Wikipedia summary:", error);
      return null;
    }
  }
}

module.exports = ChatbotController;
