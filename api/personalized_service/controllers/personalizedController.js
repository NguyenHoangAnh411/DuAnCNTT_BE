const { admin, database } = require('../../services/firebaseService');

class PersonalizedController {
    static async addLearningHistory(req, res) {
        try {
            const { userId, lessonType, lessonId, score, duration } = req.body;

            if (!userId || !lessonType || !lessonId || score === undefined || duration === undefined) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const historyRef = database.ref(`learningHistory/${userId}`);
            const newHistory = {
                lessonType,
                lessonId,
                timestamp: new Date().toISOString(),
                score,
                duration
            };

            await historyRef.push(newHistory);
            return res.status(201).json({ message: 'Learning history added successfully' });
        } catch (error) {
            console.error('Error adding learning history:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    static async getLearningHistory(req, res) {
        try {
            const { userId } = req.params;
            const historyRef = database.ref(`learningHistory/${userId}`);
            const snapshot = await historyRef.once('value');
            const history = snapshot.val();

            if (!history) {
                return res.status(404).json({ message: 'No learning history found' });
            }

            const historyArray = Object.keys(history).map(key => ({
                historyId: key,
                ...history[key]
            }));

            return res.status(200).json(historyArray);
        } catch (error) {
            console.error('Error fetching learning history:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    static async updateUserProfile(req, res) {
        try {
            const { userId, displayName, level, learningGoals, preferredTopics, preferredLearningStyle } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'Missing userId' });
            }

            const profileRef = database.ref(`users/${userId}/`);
            const profileData = {
                displayName: displayName || null,
                level: level || null,
                learningGoals: learningGoals || [],
                preferredTopics: preferredTopics || [],
                preferredLearningStyle: preferredLearningStyle || null,
                updatedAt: new Date().toISOString()
            };

            await profileRef.update(profileData);
            return res.status(200).json({ message: 'User profile updated successfully' });
        } catch (error) {
            console.error('Error updating user profile:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    static async getPersonalizedRecommendations(req, res) {
        try {
          const { userId } = req.params;
          if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
          }

          const profileRef = database.ref(`users/${userId}/`);
          const profileSnapshot = await profileRef.once('value');
          const profile = profileSnapshot.val();
      
          if (!profile) {
            return res.status(404).json({ message: 'User profile not found' });
          }

          const recommendedLessons = await generateRecommendedLessons(profile, userId);
      
          return res.status(200).json({ recommendations: recommendedLessons });
        } catch (error) {
          console.error('Error fetching personalized recommendations:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
      }
}

/**
 * @param {Object} profile
 * @param {String} userId
 * @returns {Array}
 */

async function generateRecommendedLessons(profile = {}, userId) {
    const {
        level = null,
        learningGoals = [],
        preferredTopics = [],
        preferredLearningStyle = null
    } = profile;

    const userHistorySnapshot = await database.ref(`learningHistory/${userId}`).once('value');
    const userHistoryData = userHistorySnapshot.val() || {};

    const userBestScores = {};
    for (const historyKey in userHistoryData) {
        const { lessonId, score } = userHistoryData[historyKey] || {};
        if (lessonId) {
            userBestScores[lessonId] = Math.max(userBestScores[lessonId] || 0, score);
        }
    }

    const skillNodes = [
        'lessons',
        'reading_exercises',
        'writing_topics',
        'speaking_exercises',
        'listening_exercises',
        'grammar_exercises'
    ];

    const queries = skillNodes.map(async (node) => {
        let query = database.ref(node);

        if (level) {
            query = query.orderByChild('level').equalTo(level);
        }
    
        const snapshot = await query.once('value');
        const nodeData = snapshot.val() || {};
    
        return Object.values(nodeData)
            .filter(item => !level || item.level === level)
            .map(item => ({ ...item, sourceNode: node }));
    });
    
    let allData = (await Promise.all(queries)).flat();

    let potentialLessons = allData.map((item) => ({
        ...item,
        level: item.level || 'default',
        tags: Array.isArray(item.tags) ? item.tags : [],
    })).filter(item => Array.isArray(item.tags));

    if (learningGoals.length > 0) {
        potentialLessons = potentialLessons.filter((lesson) =>
            lesson.tags.some(tag => learningGoals.includes(tag))
        );
    }

    if (preferredTopics.length > 0) {
        potentialLessons = potentialLessons.filter((lesson) =>
            lesson.tags.some(tag => preferredTopics.includes(tag))
        );
    }

    if (preferredLearningStyle) {
        potentialLessons = potentialLessons.filter(
            (lesson) => lesson.learningStyle === preferredLearningStyle
        );
    }

    potentialLessons = potentialLessons.filter((lesson) => {
        const lessonId = lesson.id || lesson.lessonId;
        return !lessonId || (userBestScores[lessonId] || 0) < 80;
    });

    potentialLessons.sort((a, b) => (a.difficulty || 3) - (b.difficulty || 3));

    return potentialLessons.slice(0, 10);
    // return potentialLessons;
}



module.exports = PersonalizedController;
