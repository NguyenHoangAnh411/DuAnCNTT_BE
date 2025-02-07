const { database } = require('../../services/firebaseService');

class SimulatedController {
  static async getAllDialogues(req, res) {
    try {
      const dialoguesRef = database.ref('dialogues');
      const snapshot = await dialoguesRef.once('value');
      const dialogues = snapshot.val();
      res.status(200).json({ dialogues });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dialogues' });
    }
  }

  static async getDialogueById(req, res) {
    try {
      const { dialogueId } = req.params;
      const dialogueRef = database.ref(`dialogues/${dialogueId}`);
      const snapshot = await dialogueRef.once('value');
      const dialogue = snapshot.val();
      if (!dialogue) {
        return res.status(404).json({ error: 'Dialogue not found' });
      }
      res.status(200).json({ dialogue });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dialogue' });
    }
  }

  static async saveUserProgress(req, res) {
    try {
      const { userId, dialogueId, score } = req.body;
      const userProgressRef = database.ref(`userProgress/${userId}/${dialogueId}`);
      await userProgressRef.set({
        score,
        lastAttempt: new Date().toISOString(),
      });
      res.status(200).json({ message: 'Progress saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save progress' });
    }
  }

  static async addDialogue(req, res) {
    try {
      const { dialogueId, title, scenes } = req.body;

      const dialogueRef = database.ref(`dialogues/${dialogueId}`);
      const snapshot = await dialogueRef.once('value');
      if (snapshot.exists()) {
        return res.status(400).json({ error: 'Dialogue ID already exists' });
      }

      await dialogueRef.set({ title, scenes });
      res.status(201).json({ message: 'Dialogue added successfully', dialogueId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add dialogue' });
    }
  }
}

module.exports = SimulatedController;