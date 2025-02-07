class ContextManager {
    // Store contexts in memory using Map
    static contexts = new Map();
    
    // Maximum number of messages to keep in context
    static MAX_CONTEXT_LENGTH = 10;
    
    // Maximum age of context in milliseconds (30 minutes)
    static CONTEXT_TTL = 30 * 60 * 1000;
    
    /**
     * Get conversation context for a user
     * @param {string} userId - User identifier
     * @returns {Array} Array of context messages
     */
    static async getContext(userId) {
        try {
            const userContext = this.contexts.get(userId);
            
            if (!userContext) {
                return [];
            }

            // Check if context has expired
            if (Date.now() - userContext.lastUpdated > this.CONTEXT_TTL) {
                await this.clearContext(userId);
                return [];
            }

            return userContext.messages;
        } catch (error) {
            console.error('Error getting context:', error);
            return [];
        }
    }

    /**
     * Update conversation context with new message and response
     * @param {string} userId - User identifier
     * @param {string} message - User message
     * @param {string} response - Bot response
     */
    static async updateContext(userId, message, response) {
        try {
            let userContext = this.contexts.get(userId);

            if (!userContext) {
                userContext = {
                    messages: [],
                    lastUpdated: Date.now()
                };
            }

            // Add new message and response
            const newContext = {
                timestamp: Date.now(),
                message: message,
                response: response
            };

            userContext.messages.push(newContext);

            // Keep only the latest MAX_CONTEXT_LENGTH messages
            if (userContext.messages.length > this.MAX_CONTEXT_LENGTH) {
                userContext.messages = userContext.messages.slice(-this.MAX_CONTEXT_LENGTH);
            }

            userContext.lastUpdated = Date.now();

            // Update context in map
            this.contexts.set(userId, userContext);

            // Optional: Save to persistent storage
            await this.saveContextToDisk();

        } catch (error) {
            console.error('Error updating context:', error);
        }
    }

    /**
     * Clear context for a user
     * @param {string} userId - User identifier
     */
    static async clearContext(userId) {
        try {
            this.contexts.delete(userId);
            // Optional: Update persistent storage
            await this.saveContextToDisk();
        } catch (error) {
            console.error('Error clearing context:', error);
        }
    }

    /**
     * Get formatted context for AI prompt
     * @param {string} userId - User identifier
     * @returns {string} Formatted context string
     */
    static async getFormattedContext(userId) {
        const context = await this.getContext(userId);
        if (!context.length) return '';

        return context.map(ctx => 
            `User: ${ctx.message}\nBot: ${ctx.response}`
        ).join('\n');
    }

    /**
     * Clean up expired contexts
     */
    static async cleanupExpiredContexts() {
        const now = Date.now();
        for (const [userId, context] of this.contexts.entries()) {
            if (now - context.lastUpdated > this.CONTEXT_TTL) {
                await this.clearContext(userId);
            }
        }
    }

    /**
     * Optional: Save contexts to disk
     */
    static async saveContextToDisk() {
        try {
            // Convert Map to object for serialization
            const contextObject = Object.fromEntries(this.contexts);
            
            // If you want to save to a file:
            // await fs.writeFile('contexts.json', JSON.stringify(contextObject, null, 2));
            
        } catch (error) {
            console.error('Error saving contexts to disk:', error);
        }
    }

    /**
     * Optional: Load contexts from disk
     */
    static async loadContextsFromDisk() {
        try {
            // If you want to load from a file:
            // const data = await fs.readFile('contexts.json', 'utf8');
            // const contextObject = JSON.parse(data);
            // this.contexts = new Map(Object.entries(contextObject));
            
        } catch (error) {
            console.error('Error loading contexts from disk:', error);
        }
    }

    /**
     * Get all active contexts
     * @returns {Map} Map of all contexts
     */
    static async getAllContexts() {
        return this.contexts;
    }

    /**
     * Get context size for a user
     * @param {string} userId - User identifier
     * @returns {number} Number of messages in context
     */
    static async getContextSize(userId) {
        const context = await this.getContext(userId);
        return context.length;
    }

    /**
     * Check if user has active context
     * @param {string} userId - User identifier
     * @returns {boolean} Whether user has active context
     */
    static async hasActiveContext(userId) {
        const context = this.contexts.get(userId);
        if (!context) return false;
        
        return Date.now() - context.lastUpdated <= this.CONTEXT_TTL;
    }

    /**
     * Initialize context manager
     */
    static async initialize() {
        // Load saved contexts if any
        await this.loadContextsFromDisk();

        // Set up periodic cleanup
        setInterval(() => {
            this.cleanupExpiredContexts();
        }, 5 * 60 * 1000); // Clean up every 5 minutes
    }
}

module.exports = ContextManager;
