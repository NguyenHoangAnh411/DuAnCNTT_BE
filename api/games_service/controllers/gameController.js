const { admin, database } = require('../../services/firebaseService');

class GameController {
    static async getGameTypes(req, res) {
      try {
        const gamesRef = database.ref('games');
        const snapshot = await gamesRef.once('value');
        const games = snapshot.val();
    
        if (!games) {
          return res.status(404).json({ error: 'No games found' });
        }

        const gameTypes = Object.keys(games);
    
        res.status(200).json(gameTypes);
      } catch (error) {
        console.error('Error fetching game types:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    static async getGameTypeInfo(req, res) {
      try {
          const { gameType } = req.params;
          const gameTypeRef = database.ref(`games/${gameType}`);
          const snapshot = await gameTypeRef.once("value");
          const gameTypeData = snapshot.val();
  
          if (!gameTypeData) {
              return res.status(404).json({ error: "Game type not found" });
          }
  
          res.status(200).json(gameTypeData);
      } catch (error) {
          console.error("Error fetching game type info:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  }

}

module.exports = GameController;