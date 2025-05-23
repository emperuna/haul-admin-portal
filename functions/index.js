/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// This function retrieves the actual user creation date from Firebase Auth
exports.getUserCreationDate = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
  }
  // Verify admin permissions
  const callerUid = context.auth.uid;
  const callerData = await admin.firestore().collection("users").doc(callerUid).get();
  if (!callerData.exists || !callerData.data().roles || !callerData.data().roles.includes("admin")) {
    throw new functions.https.HttpsError("permission-denied", "Must be an admin");
  }
  // Get the user record with creation metadata
  try {
    const userRecord = await admin.auth().getUser(data.userId);
    return {
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

// Function to get all users for admin dashboard
exports.getAllUsers = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
  }
  
  // Verify admin permissions
  const callerUid = context.auth.uid;
  const callerData = await admin.firestore().collection("users").doc(callerUid).get();
  
  if (!callerData.exists || !callerData.data().roles || !callerData.data().roles.includes("admin")) {
    throw new functions.https.HttpsError("permission-denied", "Must be an admin");
  }
  
  // Fetch users with pagination
  const { pageSize = 10, lastVisible = null } = data;
  
  try {
    let usersQuery = admin.firestore().collection("users").limit(pageSize);
    
    if (lastVisible) {
      usersQuery = usersQuery.startAfter(lastVisible);
    }
    
    const snapshot = await usersQuery.get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    return {
      users,
      lastVisible: lastDoc ? lastDoc.id : null
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new functions.https.HttpsError("internal", "Error fetching users");
  }
});

// Function to get dashboard statistics
exports.getDashboardStats = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
  }
  
  // Verify admin permissions
  const callerUid = context.auth.uid;
  const callerData = await admin.firestore().collection("users").doc(callerUid).get();
  
  if (!callerData.exists || !callerData.data().roles || !callerData.data().roles.includes("admin")) {
    throw new functions.https.HttpsError("permission-denied", "Must be an admin");
  }
  
  try {
    // Get user count
    const userSnapshot = await admin.firestore().collection("users").get();
    const userCount = userSnapshot.size;
    
    // Get product count
    const productSnapshot = await admin.firestore().collection("products").get();
    const productCount = productSnapshot.size;
    
    // Get order count
    const orderSnapshot = await admin.firestore().collection("orders").get();
    const orderCount = orderSnapshot.size;
    
    // Get seller count
    const sellerSnapshot = await admin.firestore().collection("sellers").get();
    const sellerCount = sellerSnapshot.size;
    
    return {
      userCount,
      productCount,
      orderCount,
      sellerCount
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new functions.https.HttpsError("internal", "Error fetching dashboard statistics");
  }
});
