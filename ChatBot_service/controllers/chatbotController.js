require('dotenv').config();
const axios = require('axios');
const ContextManager = require('./services/ContextManager');
const CacheService = require('./services/CacheService');
const ErrorHandler = require('./services/ErrorHandler');
const { englishLearningPrompt } = require('./config/prompts');
const { analyzeGrammar, analyzeSentiment } = require('./services/LanguageAnalyzer');

class ChatbotController {
    // Constants for configuration
    static RATE_LIMIT = {
        WINDOW_MS: 60000, // 1 minute
        MAX_REQUESTS: 20
    };

    static CACHE_TTL = 3600; // 1 hour
    static MAX_RETRIES = 3;
    static TIMEOUT_MS = 30000; // 30 seconds

    static async ChatBot(req, res) {
        try {
            const { message, userId, options = {} } = req.body;
            
            // Input validation
            if (!ChatbotController.validateInput(message)) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Invalid input',
                    details: 'Message must be between 1 and 1000 characters'
                });
            }

            // Check rate limiting
            const rateLimitResult = await ChatbotController.checkRateLimit(userId);
            if (!rateLimitResult.allowed) {
                return res.status(429).json({
                    status: 'error',
                    error: 'Rate limit exceeded',
                    retryAfter: rateLimitResult.retryAfter
                });
            }

            // Check cache if enabled
            if (!options.skipCache) {
                const cacheKey = `chat_${userId}_${message}`;
                const cachedResponse = await CacheService.get(cacheKey);
                if (cachedResponse) {
                    return res.json({
                        ...cachedResponse,
                        fromCache: true
                    });
                }
            }

            // Analyze input
            const analysis = await ChatbotController.analyzeInput(message);

            // Generate response
            const response = await ChatbotController.generateResponse(message, analysis, userId, options);

            // Update context if enabled
            if (!options.skipContext) {
                await ContextManager.updateContext(userId, message, response);
            }

            // Cache response if enabled
            if (!options.skipCache) {
                const cacheKey = `chat_${userId}_${message}`;
                await CacheService.set(cacheKey, response, ChatbotController.CACHE_TTL);
            }

            // Log interaction
            await ChatbotController.logInteraction(userId, message, response, analysis);

            return res.json(response);

        } catch (error) {
            const errorResponse = await ErrorHandler.handle(error);
            return res.status(errorResponse.status).json(errorResponse);
        }
    }

    static async analyzeInput(message) {
        try {
            const grammarAnalysis = analyzeGrammar(message); // Call the fixed grammar analysis function
            const sentimentAnalysis = analyzeSentiment(message);
    
            return {
                grammar: grammarAnalysis,
                sentiment: sentimentAnalysis
            };
        } catch (error) {
            console.error('Input analysis error:', error);
            return {
                error: 'Input analysis failed'
            };
        }
    }

    static async generateResponse(message, analysis, userId, options) {
        // Ensure analysis is not undefined
        if (!analysis) {
            analysis = await ChatbotController.analyzeInput(message);
        }
    
        const context = options.skipContext ? [] : await ContextManager.getContext(userId);
        const prompt = ChatbotController.buildPrompt(message, analysis, context);
        
        let attempts = 0;
        let lastError = null;
    
        while (attempts < ChatbotController.MAX_RETRIES) {
            try {
                const response = await ChatbotController.callLanguageModel(prompt, options);
                
                // Additional check for response validity
                if (!response || !response.length) {
                    throw new Error('Empty response from language model');
                }
                
                return ChatbotController.formatResponse(response, analysis);
            } catch (error) {
                console.error('Response generation error:', error);
                lastError = error;
                attempts++;
                await ChatbotController.delay(1000 * attempts);
            }
        }
    
        console.error('Failed to generate response after retries:', lastError);
        return await ChatbotController.getFallbackResponse(message, lastError);
    }

    static async callLanguageModel(prompt, options = {}) {
        const model = options.model || 'microsoft/DialoGPT-medium';
        
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                inputs: prompt,
                parameters: {
                    max_length: options.maxLength || 300, // Increased length
                    temperature: options.temperature || 0.7,
                    top_p: options.topP || 0.9,
                    do_sample: true,
                    num_return_sequences: 1
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: ChatbotController.TIMEOUT_MS
            }
        );
    
        return response.data;
    }

    static validateInput(message) {
        if (!message || typeof message !== 'string') return false;
        
        const trimmedMessage = message.trim();
        if (trimmedMessage.length === 0 || trimmedMessage.length > 1000) return false;
        
        // Check for inappropriate content
        const inappropriatePattern = /\b(badword1|badword2)\b/i; // Add actual bad words
        if (inappropriatePattern.test(message)) return false;

        return true;
    }

    static analyzeComplexity(message) {
        return {
            readability: ChatbotController.calculateReadability(message),
            vocabulary: ChatbotController.assessVocabulary(message),
            structure: ChatbotController.analyzeStructure(message),
            metrics: {
                averageWordLength: ChatbotController.calculateAverageWordLength(message),
                sentenceVariety: ChatbotController.analyzeSentenceVariety(message)
            }
        };
    }

    static calculateReadability(text) {
        // Implement Flesch-Kincaid readability score
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        const syllables = ChatbotController.countSyllables(text);

        const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

        return {
            score: Math.round(score * 100) / 100,
            level: ChatbotController.getReadabilityLevel(score)
        };
    }

    static countSyllables(text) {
        // Basic syllable counting implementation
        return text.toLowerCase()
            .replace(/[^a-z]/g, '')
            .replace(/[^aeiouy]*[aeiouy]+/g, 'a')
            .length;
    }

    static getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    static assessVocabulary(text) {
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        
        return {
            level: ChatbotController.getVocabularyLevel(words),
            uniqueWords: uniqueWords.size,
            totalWords: words.length,
            lexicalDiversity: uniqueWords.size / words.length
        };
    }

    static analyzeStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        
        return {
            sentenceCount: sentences.length,
            averageLength: text.length / sentences.length,
            types: ChatbotController.classifySentences(sentences),
            complexity: ChatbotController.calculateStructuralComplexity(sentences)
        };
    }

    static async checkRateLimit(userId) {
        try {
            const key = `ratelimit_${userId}`;
            const requests = await CacheService.get(key) || 0;
            
            if (requests >= ChatbotController.RATE_LIMIT.MAX_REQUESTS) {
                return {
                    allowed: false,
                    retryAfter: ChatbotController.RATE_LIMIT.WINDOW_MS
                };
            }

            await CacheService.set(key, requests + 1, ChatbotController.RATE_LIMIT.WINDOW_MS);
            
            return {
                allowed: true,
                remaining: ChatbotController.RATE_LIMIT.MAX_REQUESTS - requests - 1
            };
        } catch (error) {
            console.error('Rate limit error:', error);
            return { allowed: true }; // Fail open
        }
    }

    static buildPrompt(message, analysis, context) {
        const contextString = context.map(c => 
            `User: ${c.message}\nBot: ${c.response}`
        ).join('\n');
    
        return `You are an expert English language tutor providing a detailed explanation about past tense.
    
        Context: ${contextString}
        
        User's specific question: ${message}
        
        Provide a comprehensive explanation of past tense that includes:
        - Definition of past tense
        - Different types of past tense (simple past, past continuous, past perfect)
        - How and when to use each type
        - Clear examples for each type of past tense
        - Common mistakes to avoid
        
        Explanation:`.trim();
    }

    static extractCorrections(analysis) {
        if (!analysis.grammar || analysis.grammar.error) return [];

        return analysis.grammar.issues.map(issue => ({
            type: issue.type,
            description: issue.description,
            suggestedCorrection: issue.suggestedCorrection
        }));
    }

    static generateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.complexity.vocabulary.lexicalDiversity < 0.5) {
            suggestions.push({
                type: 'vocabulary',
                suggestion: 'Try using more varied vocabulary to express your ideas.'
            });
        }

        if (analysis.grammar && analysis.grammar.issues.length > 0) {
            suggestions.push({
                type: 'grammar',
                suggestion: 'Consider reviewing basic grammar rules to improve your writing.'
            });
        }
        
        return suggestions;
    }

    static generateExplanations(analysis) {
        const explanations = [];

        if (analysis.grammar && analysis.grammar.issues.length > 0) {
            analysis.grammar.issues.forEach(issue => {
                explanations.push({
                    type: 'grammar',
                    explanation: `The sentence has a ${issue.type} issue: ${issue.description}.`
                });
            });
        }

        if (analysis.sentiment) {
            explanations.push({
                type: 'sentiment',
                explanation: `The overall sentiment of your message is ${analysis.sentiment.score > 0 ? 'positive' : 'negative'}.`
            });
        }
        
        return explanations;
    }

    static calculateConfidence(response) {
        if (!response || !response[0]?.generated_text) return 0;

        const text = response[0].generated_text;
        const lengthConfidence = Math.min(1, text.length / 100);
        const contentConfidence = text.includes('?') ? 0.8 : 1.0;
        
        return Math.round((lengthConfidence * contentConfidence) * 100) / 100;
    }

    static formatResponse(response, analysis) {
        // Extract only the actual response, removing the system prompt
        const fullText = response[0]?.generated_text?.trim() || 'I apologize, I couldn\'t generate a response.';
        
        // Try to extract the response after the "Response:" marker
        const responseMatch = fullText.split(/\n\s*Response:\s*/).pop();
        const actualResponse = responseMatch ? responseMatch.trim() : fullText;
    
        return {
            status: 'success',
            response: {
                text: actualResponse,
                corrections: analysis && !analysis.error ? ChatbotController.extractCorrections(analysis) : [],
                suggestions: analysis && !analysis.error ? ChatbotController.generateSuggestions(analysis) : [],
                explanations: analysis && !analysis.error ? ChatbotController.generateExplanations(analysis) : []
            },
            analysis: analysis || {},
            metadata: {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - (analysis?.metadata?.timestamp || Date.now()),
                confidence: ChatbotController.calculateConfidence(response)
            }
        };
    }

    static async getFallbackResponse(message, error) {
        return {
            status: 'partial_success',
            response: {
                text: 'I apologize, but I\'m having trouble processing your request. Please try again.',
                fallback: true,
                error: error?.message
            },
            timestamp: new Date().toISOString()
        };
    }

    static async logInteraction(userId, message, response, analysis) {
        // Implement logging logic
        try {
            // Log to database or monitoring service
            console.log('Interaction logged:', {
                userId,
                timestamp: new Date(),
                message: message.substring(0, 100), // Truncate for logging
                responseStatus: response.status,
                analysisSuccess: !analysis.error
            });
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ChatbotController;
