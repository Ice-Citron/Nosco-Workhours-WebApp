const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

exports.calculateFactorial = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const number = parseInt(request.query.number);
    if (isNaN(number) || number < 0) {
      return response.status(400).json({ error: 'Invalid input. Please provide a non-negative integer.' });
    }
    let result = 1;
    for (let i = 2; i <= number; i++) {
      result *= i;
    }
    response.json({ result: result });
  });
});