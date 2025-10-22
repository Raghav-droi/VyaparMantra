// ===== Imports =====
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const CryptoJS = require('crypto-js');
const express = require('express');
const cors = require('cors');

// ===== Initialize Firebase Admin =====
admin.initializeApp();

// ===== Express App Setup =====
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ===== Global CORS Handling =====
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

// ===== Wholesaler Login (Phone + Password) =====
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
    res.json({ token, userType: 'wholesale' });
  } catch (err) {
    console.error(`Server error for phone: ${phone}`, err);
    res.status(500).send('Server error');
  }
});

// ===== Retailer Login =====
app.post('/retailer-login', async (req, res) => {
  const { phone, password } = req.body;
  console.log('Retailer login attempt for phone:', phone);

  if (!phone || !password) {
    res.status(400).send('Missing phone or password');
    return;
  }

  try {
    const retailerDoc = await admin.firestore().collection('retailer').doc(phone).get();
    console.log('Retailer doc exists:', retailerDoc.exists);

    if (!retailerDoc.exists) {
      res.status(401).send('User not found');
      return;
    }

    const hashedPassword = retailerDoc.data().password;
    const hashedInput = CryptoJS.SHA256(password).toString();

    if (hashedInput !== hashedPassword) {
      res.status(401).send('Incorrect password');
      return;
    }

    const token = await admin.auth().createCustomToken(phone);
    console.log(`Retailer login successful for phone: ${phone}`);
    res.json({ token, userType: 'retail' });
  } catch (err) {
    console.error(`Server error for retailer phone: ${phone}`, err);
    res.status(500).send('Server error');
  }
});

// ===== Exports =====

// ✅ Express endpoint for login (1st Gen)
exports.loginWithPassword = functions
  .region('asia-south1')
  .https.onRequest(app);

// ✅ Callable function for order status updates
exports.updateOrderStatus = functions
  .region('asia-south1')
  .https.onCall(async (data, context) => {
    const { orderId, status } = data || {};
    const allowed = ['requested', 'confirmed', 'shipped', 'delivered'];

    if (!orderId || !allowed.includes(status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid order status payload');
    }

    const db = admin.firestore();
    const ref = db.collection('orders').doc(orderId);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    await ref.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    const order = snap.data();
    await db.collection('notifications').add({
      type: 'order_status',
      orderId,
      retailerId: order.retailerId,
      wholesalerId: order.wholesalerId,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true };
  });

// ✅ Firestore Trigger - When new order is created
exports.onOrderCreate = functions
  .region('asia-south1')
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const db = admin.firestore();

    await db.collection('notifications').add({
      type: 'order_created',
      orderId: context.params.orderId,
      retailerId: order.retailerId,
      wholesalerId: order.wholesalerId,
      status: order.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
