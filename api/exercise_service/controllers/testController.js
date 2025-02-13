const { admin, database } = require('../../services/firebaseService');

class TestController {
    static async getTests(req, res) {
        try {
            const snapshot = await database.ref("tests").once("value");
            const tests = snapshot.val();
            res.status(200).json(tests);
          } catch (error) {
            res.status(500).json({ error: "Lỗi khi lấy danh sách bài kiểm tra" });
          }
    }

    static async getTestQuestion(req, res) {
      const testId = req.params.testId;
      const snapshot = await database
        .ref("questions")
        .orderByChild("testId")
        .equalTo(testId)
        .once("value");
    
      const questions = snapshot.val();
    
      if (!questions || Object.keys(questions).length === 0) {
        return res.status(404).json({ error: "Không tìm thấy câu hỏi cho bài kiểm tra này" });
      }
    
      res.status(200).json(questions);
    }

    static async submitTest(req, res) {
      try {
        const { userId, totalScore } = req.body;
    
        if (!userId || totalScore === undefined) {
          return res.status(400).json({ message: 'Missing userId or totalScore' });
        }
    
        const resultRef = database.ref('results').push();
        await resultRef.set({
          userId,
          totalScore,
          date: new Date().toISOString(),
        });
    
        res.status(201).json({ message: 'Test result saved successfully', resultId: resultRef.key });
      } catch (error) {
        console.error('Error saving test result:', error);
        res.status(500).json({ message: 'Failed to save test result' });
      }
    }

    static async getTestResult(req, res) {
        try {
            const userId = req.params.userId;
            const snapshot = await database
              .ref("results")
              .orderByChild("userId")
              .equalTo(userId)
              .once("value");
            const results = snapshot.val();
            res.status(200).json(results);
          } catch (error) {
            res.status(500).json({ error: "Lỗi khi lấy kết quả bài kiểm tra" });
          }
    }
}

module.exports = TestController;