const vader = require('vader-sentiment');

const analyzeSentiment = (text) => {
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    
    // More detailed sentiment analysis
    return {
        overall: getOverallSentiment(intensity.compound),
        details: {
            positive: intensity.pos,
            negative: intensity.neg,
            neutral: intensity.neu,
            compound: intensity.compound
        },
        confidence: calculateSentimentConfidence(intensity)
    };
};

const compromise = require('compromise');

const analyzeGrammar = (message) => {
    try {
        const doc = compromise(message);

        // Extract nouns (subjects)
        const subjects = doc.nouns().out('array');

        // Return analysis results
        return {
            subjects: subjects,
            grammarAnalysis: 'Grammar analysis completed successfully'
        };
    } catch (error) {
        console.error('Grammar analysis error:', error);
        return {
            error: 'Grammar analysis failed'
        };
    }
};

module.exports = { analyzeGrammar, analyzeSentiment };