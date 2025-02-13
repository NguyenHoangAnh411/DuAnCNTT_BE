const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/', require('./admin_service/server'));
app.use('/', require('./chat_service/server'));
app.use('/', require('./course_service/server'));
app.use('/', require('./exercise_service/server'));
app.use('/', require('./forum_service/server'));
app.use('/', require('./games_service/server'));
app.use('/', require('./lesson_service/server'));
app.use('/', require('./personalized_service/server'));
app.use('/', require('./premium_service/server'));
app.use('/', require('./user_service/server'));
app.use('/', require('./vocabulary_service/server'));
app.use('/', require('./chatbot_service/server'));

app.get('/', (req, res) => {
  res.send('Welcome to DUANCNTT Backend!');
});

module.exports = app;
