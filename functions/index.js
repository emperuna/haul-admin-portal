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
