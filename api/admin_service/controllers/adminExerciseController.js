const { admin, database, uploadFileToFirebase } = require('../../services/firebaseService');
const { v4: uuidv4 } = require('uuid'); 
class AdminExerciseController {
// Writing
static async addWritingTopic(req, res) {
  try {
    const { topic, category } = req.body;

    if (!topic || !category) {
      return res.status(400).json({ error: 'Missing required fields: topic and category' });
    }

    const validCategories = ['academic_writing', 'creative_writing', 'personal_writing'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const newTopicRef = database.ref(`writing_topics/${category}`).push();
    const newTopic = {
      id: newTopicRef.key,
      topic: topic,
    };

    await newTopicRef.set(newTopic);

    res.status(201).json({ message: 'Writing topic added successfully', id: newTopicRef.key, category });
  } catch (error) {
    console.error('Error adding writing topic:', error);
    res.status(500).json({ error: 'Failed to add writing topic', details: error.message });
  }
}

static async updateWritingTopic(req, res) {
  try {
    const topicId = req.params.id;
    const { topic, category } = req.body;

    if (!topic || !category) {
      return res.status(400).json({ error: 'Missing required fields: topic and category' });
    }

    const validCategories = ['academic_writing', 'creative_writing', 'personal_writing'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const topicRef = database.ref(`writing_topics/${category}/${topicId}`);
    const snapshot = await topicRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const updatedTopic = {
      id: topicId,
      topic,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    };

    await topicRef.set(updatedTopic);

    res.status(200).json({ message: 'Writing topic updated successfully', id: topicId, category });
  } catch (error) {
    console.error('Error updating writing topic:', error);
    res.status(500).json({ error: 'Failed to update writing topic', details: error.message });
  }
}

// Grammar
  static async addGrammarExercise(req, res) {
    try {
        const { instructions, questions, type, id } = req.body;

        if (!id || !instructions || !questions || questions.length === 0 || !type) {
            return res.status(400).json({ error: 'Missing required fields: id, instructions, questions, and type' });
        }

        for (const question of questions) {
            if (!question.id || !question.answer || !question.part1 || !question.part2) {
                return res.status(400).json({ error: 'Each question must have id, answer, part1, and part2' });
            }
        }

        const newExercise = {
            id,
            instructions,
            questions,
            type,
            timestamp: admin.database.ServerValue.TIMESTAMP,
        };

        const ref = database.ref(`grammar_exercises/${id}`);
        await ref.set(newExercise);

        res.status(201).json({ message: 'Grammar exercise added successfully', id });
    } catch (error) {
        console.error('Error adding grammar exercise:', error);
        res.status(500).json({ error: 'Failed to add grammar exercise', details: error.message });
    }
}


static async updateGrammarExercise(req, res) {
    try {
        const exerciseId = req.params.id;
        const { difficulty, instructions, questions, type } = req.body;

        const exerciseRef = database.ref(`grammar_exercises/${exerciseId}`);
        const snapshot = await exerciseRef.once('value');
        if (!snapshot.exists()) {
          return res.status(404).json({ error: 'Exercise not found' });
        }

        if (!difficulty || !instructions || !type || !questions || !Array.isArray(questions) || questions.length === 0) {
          return res.status(400).json({ error: 'Missing or invalid required fields' });
        }

        for (const question of questions) {
          if (!question.id || !question.answer || !question.part1 || !question.part2) {
            return res.status(400).json({ error: 'Each question must have id, answer, part1, and part2' });
          }
        }

        const updatedExercise = {
          id: exerciseId,
          difficulty,
          instructions,
          type,
          questions,
          timestamp: admin.database.ServerValue.TIMESTAMP,
        };

        await exerciseRef.set(updatedExercise);

        res.status(200).json({ message: 'Grammar exercise updated successfully', id: exerciseId });
      } catch (error) {
        console.error('Error updating grammar exercise:', error);
        res.status(500).json({ error: 'Failed to update grammar exercise', details: error.message });
      }
  }


// Speaking
static async addSpeakingExercise(req, res) {
  try {
      const { title, subtitle, sample_sentences } = req.body;

      if (!title || !subtitle || !sample_sentences || sample_sentences.length === 0) {
          return res.status(400).json({ error: 'Missing required fields: title, subtitle, and sample_sentences' });
      }

      const newExercise = {
          title,
          subtitle,
          sample_sentences,
      };

      const ref = database.ref('speaking_exercises').push();
      await ref.set(newExercise);

      res.status(201).json({ message: 'Speaking exercise added successfully', id: ref.key });
  } catch (error) {
      console.error('Error adding speaking exercise:', error);
      res.status(500).json({ error: 'Failed to add speaking exercise', details: error.message });
  }
}

static async updateSpeakingExercise(req, res) {
  try {
      const exerciseId = req.params.id;
      const { title, subtitle, sample_sentences } = req.body;

      const exerciseRef = database.ref(`speaking_exercises/${exerciseId}`);
      const snapshot = await exerciseRef.once('value');
      if (!snapshot.exists()) {
          return res.status(404).json({ error: 'Exercise not found' });
      }

      if (!title || !subtitle || !sample_sentences || sample_sentences.length === 0) {
          return res.status(400).json({ error: 'Missing required fields: title, subtitle, and sample_sentences' });
      }

      const updatedExercise = {
          title,
          subtitle,
          sample_sentences,
          timestamp: admin.database.ServerValue.TIMESTAMP,
      };

      await exerciseRef.update(updatedExercise);

      res.status(200).json({ message: 'Speaking exercise updated successfully', id: exerciseId });
  } catch (error) {
      console.error('Error updating speaking exercise:', error);
      res.status(500).json({ error: 'Failed to update speaking exercise', details: error.message });
  }
}

// Reading
static async addReadingExercise(req, res) {
  try {
    const { title, content, id, questions } = req.body;

    const existIdSnapshot = await database.ref('reading_exercises').orderByChild('id').equalTo(id).once('value');
    if (existIdSnapshot.exists()) {
      return res.status(400).json({ error: 'Id already exists' });
    }

    if (!title || !content || !id || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: title, id, content, and questions' });
    }

    const newExerciseRef = database.ref(`reading_exercises/${id}`);
    const newExercise = {
      title,
      content,
      questions: questions,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    };

    await newExerciseRef.set(newExercise);

    res.status(201).json({ message: 'Reading exercise added successfully', id: id });
  } catch (error) {
    console.error('Error adding reading exercise:', error);
    res.status(500).json({ error: 'Failed to add reading exercise', details: error.message });
  }
}

static async updateReadingExercise(req, res) {
  try {
    const exerciseId = req.params.id;
    const { title, content, questions } = req.body;

    const exerciseRef = database.ref(`reading_exercises/${exerciseId}`);
    const snapshot = await exerciseRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    if (!title || !content || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: title, content, and questions' });
    }

    const updatedExercise = {
      title,
      content,
      questions,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    };

    await exerciseRef.update(updatedExercise);

    res.status(200).json({ message: 'Reading exercise updated successfully', id: exerciseId });
  } catch (error) {
    console.error('Error updating reading exercise:', error);
    res.status(500).json({ error: 'Failed to update reading exercise', details: error.message });
  }
}

// Listening
static async addListeningExercise(req, res) {
  const { title, level, transcript, exercises, answers } = req.body;
  const audioFile = req.file;

  if (!title || !level || !transcript || !exercises || !answers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const newExerciseRef = database.ref('listening_exercises').push();
    const flutterId = newExerciseRef.key;

    const filePath = `listening_audios/${flutterId}/${audioFile.originalname}`;
    const audio_url = await uploadFileToFirebase(audioFile);

    let parsedExercises;
    try {
      const parsedData = typeof exercises === 'string' ? JSON.parse(exercises) : exercises;
      if (!Array.isArray(parsedData)) {
        throw new Error('Exercises should be an array');
      }

      parsedExercises = parsedData.map((exercise) => {
        if (!exercise.type || !exercise.questions) {
          throw new Error('Each exercise must have a type and questions');
        }
        return { ...exercise, id: uuidv4() };
      });
    } catch (err) {
      console.error('Invalid exercises format:', err.message);
      return res.status(400).json({ error: 'Invalid exercises format. Ensure it is a JSON array.' });
    }

    let parsedAnswers;
    try {
      parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
      if (typeof parsedAnswers !== 'object' || parsedAnswers === null) {
        throw new Error('Answers should be a valid JSON object');
      }
    } catch (err) {
      console.error('Invalid answers format:', err.message);
      return res.status(400).json({ error: 'Invalid answers format. Ensure it is a valid JSON object.' });
    }

    const newListeningExercise = {
      id: flutterId,
      title: title,
      level,
      transcript,
      exercises: parsedExercises,
      answers: parsedAnswers,
      audio_url: audio_url.url,
    };

    await newExerciseRef.set(newListeningExercise);

    console.log('Listening exercise added successfully');
    res.status(201).json({ message: 'Listening exercise added successfully', id: flutterId });
  } catch (error) {
    console.error('Error adding listening exercise:', error);
    res.status(500).json({ error: 'Failed to add listening exercise', details: error.message });
  }
}

static async updateListeningExercise(req, res) {
  const { id } = req.params;
  const { title, level, transcript, exercises, answers, audio_url } = req.body;

  try {
    const exerciseRef = database.ref(`listening_exercises/${id}`);
    const snapshot = await exerciseRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Listening exercise not found' });
    }

    const currentData = snapshot.val();

    const updatedFields = {};

    if (title !== undefined && title !== currentData.title) {
      updatedFields.title = title;
    }
    if (level !== undefined && level !== currentData.level) {
      updatedFields.level = level;
    }
    if (transcript !== undefined && transcript !== currentData.transcript) {
      updatedFields.transcript = transcript;
    }
    if (exercises !== undefined && JSON.stringify(exercises) !== JSON.stringify(currentData.exercises)) {
      updatedFields.exercises = exercises;
    }
    if (answers !== undefined && JSON.stringify(answers) !== JSON.stringify(currentData.answers)) {
      updatedFields.answers = answers;
    }
    if (audio_url !== undefined && audio_url !== currentData.audio_url) {
      updatedFields.audio_url = audio_url;
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(200).json({ message: 'No changes detected', id });
    }

    await exerciseRef.update(updatedFields);

    console.log('Listening exercise updated successfully');
    res.status(200).json({ message: 'Listening exercise updated successfully', id });
  } catch (error) {
    console.error('Error updating listening exercise:', error);
    res.status(500).json({ error: 'Failed to update listening exercise', details: error.message });
  }
}
// Simulated Conversations
      static async addSimulatedConversations(req, res) {
        try {
          const { title, participants, script } = req.body;
          const newConversation = { title, participants, script, createdAt: new Date() };
          
          const ref = database.ref('simulatedConversations').push();
          await ref.set(newConversation);
    
          res.status(201).json({ id: ref.key, message: 'Simulated conversation added successfully!' });
        } catch (error) {
          console.error('Error adding simulated conversation:', error);
          res.status(500).json({ error: error.message });
        }
      }
      
      static async deleteExercise(req, res) {
        try {
          const exerciseId = req.params.id;
          const skill = req.params.skill;
          const category = req.body.category;
      
          let exerciseRef;
      
          switch (skill) {
            case 'listening':
              exerciseRef = database.ref(`listening_exercises/${exerciseId}`);
              break;
            case 'reading':
              exerciseRef = database.ref(`reading_exercises/${exerciseId}`);
              break;
            case 'grammar':
              exerciseRef = database.ref(`grammar_exercises/${exerciseId}`);
              break;
            case 'speaking':
              exerciseRef = database.ref(`speaking_exercises/${exerciseId}`);
              break;
            case 'writing':
              if (!category) {
                return res.status(400).json({ message: 'Category is required for writing topics' });
              }
              exerciseRef = database.ref(`writing_topics/${category}/${exerciseId}`);
              break;
            default:
              return res.status(400).json({ message: 'Invalid skill type' });
          }
      
          const snapshot = await exerciseRef.once('value');
          if (!snapshot.exists()) {
            return res.status(404).json({ message: 'Exercise not found' });
          }
      
          await exerciseRef.remove();
      
          res.status(200).json({ message: 'Exercise deleted successfully' });
        } catch (error) {
          console.error('Error deleting exercise:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      }
}

module.exports = AdminExerciseController;