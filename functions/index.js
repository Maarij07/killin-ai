const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function to delete admin user
exports.deleteAdminUser = functions.https.onCall(async (data, context) => {
  // Verify that the request is coming from an authenticated admin
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required');
  }

  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Log the deletion
    console.log(`Successfully deleted user with UID: ${uid}`);
    
    return { success: true, message: `User ${uid} deleted successfully` };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});

// Optional: Cloud Function to delete admin user and Firestore document atomically
exports.deleteAdminComplete = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, adminDocId } = data;

  if (!uid || !adminDocId) {
    throw new functions.https.HttpsError('invalid-argument', 'UID and adminDocId are required');
  }

  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Delete from Firestore
    await admin.firestore().collection('admins').doc(adminDocId).delete();
    
    console.log(`Successfully deleted admin: Auth UID ${uid}, Firestore Doc ${adminDocId}`);
    
    return { success: true, message: 'Admin completely deleted' };
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete admin: ' + error.message);
  }
});

// Cloud Function to disable/enable admin user
exports.toggleAdminStatus = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, adminDocId, disabled } = data;

  if (!uid || !adminDocId || disabled === undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'UID, adminDocId, and disabled status are required');
  }

  try {
    // Disable/Enable Firebase Auth user
    await admin.auth().updateUser(uid, {
      disabled: disabled
    });
    
    // Update Firestore document
    await admin.firestore().collection('admins').doc(adminDocId).update({
      disabled: disabled,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const action = disabled ? 'disabled' : 'enabled';
    console.log(`Successfully ${action} admin: Auth UID ${uid}, Firestore Doc ${adminDocId}`);
    
    return { success: true, message: `Admin ${action} successfully`, disabled: disabled };
  } catch (error) {
    console.error('Error toggling admin status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to toggle admin status: ' + error.message);
  }
});
