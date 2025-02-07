class ErrorHandler {
    static async handle(error) {
        console.error('Error:', error);

        if (error.response?.status === 429) {
            return {
                status: 429,
                error: 'Rate limit exceeded'
            };
        }

        if (error.code === 'ETIMEDOUT') {
            return {
                status: 504,
                error: 'Request timeout'
            };
        }

        return {
            status: 500,
            error: 'Internal server error'
        };
    }
}

module.exports = ErrorHandler;
