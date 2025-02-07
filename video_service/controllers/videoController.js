const { admin, database } = require('../../services/firebaseService');

class VideoController {
    static async getTranscript(req, res) {
        try {
            const { transcriptId } = req.params;

            if (!transcriptId) {
                return res.status(400).json({ message: 'transcriptId is required' });
            }

            const transcriptRef = database.ref(`transcript/${transcriptId}`);

            const snapshot = await transcriptRef.once('value');

            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'Transcript not found' });
            }

            const transcriptData = snapshot.val();

            if (!Array.isArray(transcriptData)) {
                return res.status(404).json({ 
                    message: 'Transcript data is invalid',
                    details: 'The transcript data is not an array.'
                });
            }

            const formattedTranscript = transcriptData.map(item => ({
                time: item.time,
                text: item.text,
            }));

            res.status(200).json({ transcript: formattedTranscript });
        } catch (error) {
            console.error('Error fetching transcript:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getVideoTopic(req, res) {
        try {
            const TopicRef = database.ref('video_topics');

            const snapshot = await TopicRef.once('value');

            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'TopicRef not found' });
            }

            const VideoTopicData = snapshot.val();

            res.status(200).json({ topicData: VideoTopicData });
        } catch (error) {
            console.error('Error fetching VideoTopic:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAudioTopics(req, res) {
        try {
            const ref = database.ref('audio_topics');
            const snapshot = await ref.once('value');
            const data = snapshot.val();
        
            if (data) {
              res.status(200).json(data);
            } else {
              res.status(404).json({ error: 'No data found' });
            }
          } catch (error) {
            res.status(500).json({ error: 'Failed to fetch audio topics' });
          }
    }

}

module.exports = VideoController;