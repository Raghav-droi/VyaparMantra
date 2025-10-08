const functions = require('firebase-functions');
const admin = require('firebase-admin');
const CryptoJS = require('crypto-js');
const express = require('express');

admin.initializeApp();

const app = express();
app.use(express.json());

// Enable CORS preflight requests and set allowed origin for all requests
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  next();
});

app.post('/', async (req, res) => {
  const { phone, password } = req.body;

  console.log(`Login attempt for phone: ${phone}`);

  if (!phone || !password) {
    res.status(400).send('Missing phone or password');
    return;
  }

  try {
    const userDoc = await admin.firestore().collection('wholesaler').doc(phone).get();

    if (!userDoc.exists) {
      res.status(401).send('User not found');
      return;
    }

    const hashedPassword = userDoc.data().password;
    const hashedInput = CryptoJS.SHA256(password).toString();

    if (hashedInput !== hashedPassword) {
      res.status(401).send('Incorrect password');
      return;
    }

    const token = await admin.auth().createCustomToken(phone);

    console.log(`Login successful for phone: ${phone}`);

    res.json({ token });
  } catch (err) {
    console.error(`Server error for phone: ${phone}`, err);
    res.status(500).send('Server error');
  }
});

// Export the function specifying region for deployment
exports.loginWithPassword = functions.region('asia-south1').https.onRequest(app);
