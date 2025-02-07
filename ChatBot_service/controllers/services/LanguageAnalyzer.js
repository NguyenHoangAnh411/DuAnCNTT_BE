const vader = require('vader-sentiment');
const compromise = require('compromise');

class LanguageAnalyzer {
    static COMPLEXITY_THRESHOLDS = {
        SIMPLE: 5,
        INTERMEDIATE: 10,
        COMPLEX: 15
    };

    static analyzeGrammar(message) {
        const doc = compromise(message);
        const errors = [];
        const suggestions = [];
        
        // Sentence structure analysis
        const sentences = doc.sentences().out('array');
        
        sentences.forEach((sentence, index) => {
            const sentenceDoc = compromise(sentence); // Process each sentence individually
    
            // Extract nouns and verbs
            const subjects = sentenceDoc.nouns().out('array'); // Extract nouns as potential subjects
            const verbs = sentenceDoc.verbs(); // Extract verbs as a compromise object
    
            // Debug log for verbs
            console.log(`Verbs for sentence ${index + 1}:`, verbs.out('array'));
    
            // Subject-verb agreement
            if (subjects.length === 0 && verbs.length > 0) {
                errors.push(`Missing subject in sentence ${index + 1}`);
                suggestions.push(`Consider adding a clear subject to sentence ${index + 1}`);
            } else if (verbs.length === 0 && subjects.length > 0) {
                errors.push(`Missing verb in sentence ${index + 1}`);
                suggestions.push(`Consider adding a verb to complete the sentence ${index + 1}`);
            } else if (subjects.length === 0 && verbs.length === 0) {
                errors.push(`Incomplete sentence ${index + 1}: missing both subject and verb`);
                suggestions.push(`Ensure sentence ${index + 1} has both a subject and a verb`);
            }
    
            // Tense consistency
            const tenses = this.analyzeTenses(verbs);
            if (this.hasTenseMismatch(tenses)) {
                errors.push(`Inconsistent tense usage in sentence ${index + 1}`);
                suggestions.push(`Maintain consistent tense throughout sentence ${index + 1}`);
            }
    
            // Punctuation
            if (!this.hasProperPunctuation(sentence)) {
                errors.push(`Improper punctuation in sentence ${index + 1}`);
                suggestions.push(`Check punctuation in sentence ${index + 1}`);
            }
    
            // Article usage
            this.checkArticles(sentence, errors);
    
            // Preposition usage
            this.checkPrepositions(sentence, errors);
        });
    
        return {
            errors,
            suggestions,
            details: this.getGrammarDetails(doc)
        };
    }
    

    static analyzeSentiment(text) {
        const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
        
        return {
            overall: this.getOverallSentiment(intensity.compound),
            details: {
                positive: intensity.pos,
                negative: intensity.neg,
                neutral: intensity.neu,
                compound: intensity.compound
            },
            confidence: this.calculateSentimentConfidence(intensity),
            mood: this.analyzeMood(intensity),
            intensity: this.getIntensityLevel(intensity)
        };
    }

    static analyzeTenses(verbs) {
        if (!verbs || verbs.length === 0) return []; // Return an empty array if no verbs are found

        const tenses = [];
        const verbList = verbs.out('array'); // This extracts all verbs as strings

        verbList.forEach(verb => {
            if (verb.includes('ing')) {
                tenses.push('present_continuous');
            } else if (verb.includes('ed')) {
                tenses.push('past');
            } else {
                tenses.push('present');
            }
        });

        return tenses;
    }

    static hasTenseMismatch(tenses) {
        if (tenses.length <= 1) return false;

        const mainTense = tenses[0];
        return tenses.some(tense => tense !== mainTense);
    }

    static hasProperPunctuation(sentence) {
        const endPunctuation = /[.!?]$/;
        return endPunctuation.test(sentence.trim());
    }

    static checkArticles(sentence, errors) {
        const doc = compromise(sentence);
        const nouns = doc.nouns().out('array');
        
        nouns.forEach(noun => {
            const words = sentence.split(' ');
            const nounIndex = words.indexOf(noun);
            
            if (nounIndex > 0) {
                const prevWord = words[nounIndex - 1].toLowerCase();
                if (!['a', 'an', 'the'].includes(prevWord) && this.needsArticle(noun)) {
                    errors.push(`Missing article before "${noun}"`);
                }
            }
        });
    }

    static needsArticle(noun) {
        // Basic check - can be expanded
        return !['water', 'air', 'money', 'happiness'].includes(noun.toLowerCase());
    }

    static checkPrepositions(sentence, errors) {
        const commonPrepositions = ['in', 'on', 'at', 'to', 'for', 'with', 'by'];
        const words = sentence.split(' ');
        
        words.forEach((word, index) => {
            if (commonPrepositions.includes(word.toLowerCase())) {
                if (index === words.length - 1) {
                    errors.push(`Dangling preposition "${word}" at the end of sentence`);
                }
            }
        });
    }

    static getGrammarDetails(doc) {
        return {
            wordCount: doc.words().length,
            sentenceCount: doc.sentences().length,
            complexity: this.calculateComplexity(doc),
            readabilityScore: this.calculateReadabilityScore(doc),
            partsOfSpeech: this.analyzePartsOfSpeech(doc)
        };
    }

    static calculateComplexity(doc) {
        const avgWordsPerSentence = doc.words().length / doc.sentences().length;
        
        if (avgWordsPerSentence <= this.COMPLEXITY_THRESHOLDS.SIMPLE) {
            return 'simple';
        } else if (avgWordsPerSentence <= this.COMPLEXITY_THRESHOLDS.INTERMEDIATE) {
            return 'intermediate';
        } else {
            return 'complex';
        }
    }

    static calculateReadabilityScore(doc) {
        const words = doc.words().length;
        const sentences = doc.sentences().out('array');
        const syllables = this.countSyllables(doc.text());
        
        // Simplified Flesch-Kincaid Grade Level
        const score = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
        return Math.round(score * 10) / 10;
    }

    static countSyllables(text) {
        // Basic syllable counting - can be improved
        return text.toLowerCase()
            .replace(/[^a-z]/g, '')
            .replace(/[^aeiouy]*[aeiouy]+/g, 'a')
            .length;
    }

    static analyzePartsOfSpeech(doc) {
        return {
            nouns: doc.nouns().length,
            verbs: doc.verbs().length,
            adjectives: doc.adjectives().length,
            adverbs: doc.adverbs().length
        };
    }

    static getOverallSentiment(compound) {
        if (compound >= 0.05) return 'positive';
        if (compound <= -0.05) return 'negative';
        return 'neutral';
    }

    static calculateSentimentConfidence(intensity) {
        return Math.round(Math.abs(intensity.compound) * 100);
    }

    static analyzeMood(intensity) {
        if (intensity.compound >= 0.5) return 'very positive';
        if (intensity.compound >= 0.05) return 'somewhat positive';
        if (intensity.compound <= -0.5) return 'very negative';
        if (intensity.compound <= -0.05) return 'somewhat negative';
        return 'neutral';
    }

    static getIntensityLevel(intensity) {
        const totalIntensity = intensity.pos + Math.abs(intensity.neg);
        if (totalIntensity >= 0.75) return 'high';
        if (totalIntensity >= 0.5) return 'moderate';
        return 'low';
    }

    static getSuggestions(errors, text) {
        const suggestions = [];
        
        if (errors.length > 0) {
            suggestions.push('Consider reviewing the following:');
            errors.forEach(error => {
                suggestions.push(`- ${error}`);
            });
        }

        const doc = compromise(text);
        if (doc.words().length > 30) {
            suggestions.push('Consider breaking down long sentences for better clarity');
        }

        return suggestions;
    }
}

module.exports = LanguageAnalyzer;
