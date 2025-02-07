const { admin, database, uploadFileToFirebase } = require('../../services/firebaseService');
class ExerciseController {

  static async getGrammarExercises(req, res) {
    try {
      const snapshot = await database.ref('grammar_exercises').once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({ message: 'No exercises found' });
      }

      const exercises = [];
      snapshot.forEach(childSnapshot => {
        exercises.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      res.status(200).json({ exercises });
    } catch (error) {
      console.error('Error retrieving exercises:', error);
      res.status(500).json({ error: 'Failed to retrieve exercises' });
    }
  }

  static async getWritingExercises(req, res) {
    try {
      const snapshot = await database.ref('writing_topics').once('value');
      const data = snapshot.val();

      if (!data) {
        return res.status(404).json({ message: 'No writing topics found' });
      }

      const filterValidTopics = (topics) => {
        if (Array.isArray(topics)) {
          return topics.filter(item => item !== null);
        } else if (typeof topics === 'object' && topics !== null) {
          return Object.values(topics).filter(item => item !== null);
        }
        return [];
      };

      const filteredData = {
        academic_writing: data.academic_writing ? filterValidTopics(data.academic_writing) : [],
        creative_writing: data.creative_writing ? filterValidTopics(data.creative_writing) : [],
        personal_writing: data.personal_writing ? filterValidTopics(data.personal_writing) : [],
      };
  
      res.json(filteredData);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  static async getListeningExercises(req, res) {
    try {
      const snapshot = await database.ref('listening_exercises').once('value');
  
      if (!snapshot.exists()) {
        return res.status(404).json({ message: 'No exercises found' });
      }
  
      const exercises = snapshot.val();

      const exerciseList = Object.keys(exercises).map((key) => {
        return {
          id: key,
          ...exercises[key],
        };
      });
  
      res.status(200).json({ exercises: exerciseList });
    } catch (error) {
      console.error('Error retrieving exercises:', error);
      res.status(500).json({ error: 'Failed to retrieve exercises' });
    }
  }
  static async getSpeakingExercises(req, res) {
    try {
      let query = database.ref('speaking_exercises');

      if (req.query.title) {
        query = query.orderByChild('title').equalTo(req.query.title);
      }

      const snapshot = await query.once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'No exercises found' });
      }

      const exercises = [];
      snapshot.forEach(childSnapshot => {
        exercises.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      res.status(200).json(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ error: 'Failed to fetch speaking exercises', details: error.message });
    }
  }

  static async getSimulatedConversation(req, res) {
    try {
      const snapshot = await database.ref('simulatedConversations').once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ message: 'No conversations found' });
      }

      const conversations = [];
      snapshot.forEach(childSnapshot => {
        conversations.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error fetching simulated conversations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getReadingExercises(req, res) {
    try {
      const snapshot = await database.ref("reading_exercises").once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({ message: "No exercises found" });
      }

      const readings = snapshot.val();
      res.json(readings);
    } catch (error) {
      res.status(500).json({ error: "Không thể đọc dữ liệu bài reading" });
    }
  }

  static async getReadingExerciseById(req, res) {
    try {
      const readingId = req.params.id;

      const snapshot = await database.ref(`reading/${readingId}`).once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Bài reading không tồn tại" });
      }

      const reading = snapshot.val();
      res.json(reading);
    } catch (error) {
      res.status(500).json({ error: "Không thể đọc dữ liệu bài reading" });
    }
  }

  static async AnalyzeSentiment(req, res) {
    try {
        const { text, topic } = req.body;

        if (!text) {
            return res.status(400).json({ 
                error: 'Text is required' 
            });
        }

        const validVocabulary = new Set([
            'climate', 'pollution', 'sustainability', 'green', 'ecosystem', 'conservation',
            'innovation', 'digital', 'AI', 'machine', 'learning', 'future', 'progress', 'development',
            'learning', 'knowledge', 'skills', 'school', 'university', 'study', 'research',
        ]);

        const topicKeywords = {
            'environment': [
                'climate', 'pollution', 'sustainability', 
                'green', 'ecosystem', 'conservation'
            ],
            'technology': [
                'innovation', 'digital', 'AI', 'machine learning', 
                'future', 'progress', 'development'
            ],
            'education': [
                'learning', 'knowledge', 'skills', 'school', 
                'university', 'study', 'research'
            ]
        };

        const evaluationCriteria = {
            relevance: 0,
            vocabulary: 0,
            coherence: 0,
            grammar: 0,
            sentiment: 0,
            validVocabulary: 0
        };

        const tokens = text.toLowerCase().split(/\s+/);

        const validWords = tokens.filter(token => validVocabulary.has(token));
        evaluationCriteria.validVocabulary = 
            Math.min((validWords.length / tokens.length) * 10, 10);

        if (topicKeywords[topic]) {
            const topicRelevantWords = tokens.filter(token => 
                topicKeywords[topic].includes(token)
            );
            evaluationCriteria.relevance = 
                (topicRelevantWords.length / topicKeywords[topic].length) * 10;
        }

        const uniqueWords = new Set(tokens);
        evaluationCriteria.vocabulary = 
            Math.min((uniqueWords.size / tokens.length) * 10, 10);

        try {
            const grammarResponse = await axios.post('https://api.languagetool.org/v2/check', {
                text: text,
                language: 'en-US'
            });
            const grammarErrors = grammarResponse.data.matches.length;
            evaluationCriteria.grammar = Math.max(10 - grammarErrors, 0);
        } catch (error) {
            console.error("Error calling LanguageTool API:", error);
            evaluationCriteria.grammar = 5;
        }

        try {
            const sentimentResponse = await axios.post('https://api.sentimentanalysis.com/analyze', {
                text: text
            });
            const sentimentScore = sentimentResponse.data.score;
            evaluationCriteria.sentiment = (sentimentScore + 1) * 5;
        } catch (error) {
            console.error("Error calling Sentiment Analysis API:", error);
            evaluationCriteria.sentiment = 5;
        }

        const sentenceCount = text.split(/[.!?]+/).length;
        const connectiveWords = [
            'however', 'moreover', 'furthermore', 
            'in addition', 'consequently', 'therefore'
        ];
        const connectiveCount = tokens.filter(token => 
            connectiveWords.includes(token)
        ).length;
        evaluationCriteria.coherence = 
            Math.min((connectiveCount / sentenceCount) * 5, 5);

        const totalScore = Object.values(evaluationCriteria).reduce((a, b) => a + b, 0);

        let evaluation;
        if (totalScore >= 45) evaluation = 'Xuất sắc';
        else if (totalScore >= 35) evaluation = 'Khá';
        else if (totalScore >= 25) evaluation = 'Trung bình';
        else evaluation = 'Cần cải thiện';

        res.json({
            text: text,
            topic: topic,
            evaluation: {
                criteria: evaluationCriteria,
                totalScore: totalScore,
                rating: evaluation
            },
            details: {
                wordCount: tokens.length,
                sentenceCount: sentenceCount,
                uniqueWordCount: uniqueWords.size,
                grammarErrors: evaluationCriteria.grammar < 10 ? 10 - evaluationCriteria.grammar : 0,
                sentiment: evaluationCriteria.sentiment >= 5 ? 'Positive' : 'Negative'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
}
}

module.exports = ExerciseController;
