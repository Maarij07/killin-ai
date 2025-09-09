import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { logger } from './logger';

interface FreeTrialRecord {
  userId: string;
  email: string;
  usedAt: Timestamp;
  backendConfirmed: boolean;
}

const db = getFirestore();
const COLLECTION_NAME = 'freeTrials';

/**
 * Check if a user has already used their free trial
 */
export async function hasUsedFreeTrial(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    const hasUsed = docSnap.exists();
    console.log(`Free trial check for user ${userId}:`, hasUsed ? 'USED' : 'AVAILABLE');
    
    return hasUsed;
  } catch (error) {
    console.error('Error checking free trial status:', error);
    await logger.logSystemAction(
      'FREE_TRIAL_CHECK_FAILED',
      `Failed to check free trial status for user ${userId}: ${error}`,
      'MEDIUM'
    );
    // Default to true (used) for safety if we can't check
    return true;
  }
}

/**
 * Record that a user has used their free trial
 */
export async function recordFreeTrialUsage(userId: string, userEmail: string): Promise<boolean> {
  try {
    // Check if already used (prevent double usage)
    const alreadyUsed = await hasUsedFreeTrial(userId);
    if (alreadyUsed) {
      console.log(`User ${userId} has already used their free trial`);
      return false;
    }

    const freeTrialRecord: FreeTrialRecord = {
      userId,
      email: userEmail,
      usedAt: Timestamp.now(),
      backendConfirmed: false // Will be updated to true after backend confirmation
    };

    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, freeTrialRecord);

    console.log(`✅ Free trial usage recorded for user ${userId}`);
    
    await logger.logSystemAction(
      'FREE_TRIAL_RECORDED',
      `Free trial usage recorded for user ${userId} (${userEmail})`,
      'LOW'
    );

    return true;
  } catch (error) {
    console.error('Error recording free trial usage:', error);
    await logger.logSystemAction(
      'FREE_TRIAL_RECORD_FAILED',
      `Failed to record free trial usage for user ${userId}: ${error}`,
      'HIGH'
    );
    return false;
  }
}

/**
 * Update the free trial record to indicate backend confirmation
 */
export async function confirmFreeTrialWithBackend(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, { backendConfirmed: true }, { merge: true });

    console.log(`✅ Free trial backend confirmation updated for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating free trial backend confirmation:', error);
    await logger.logSystemAction(
      'FREE_TRIAL_CONFIRM_FAILED',
      `Failed to update backend confirmation for user ${userId}: ${error}`,
      'MEDIUM'
    );
    return false;
  }
}

/**
 * Get free trial record details (for admin purposes)
 */
export async function getFreeTrialRecord(userId: string): Promise<FreeTrialRecord | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FreeTrialRecord;
    }
    return null;
  } catch (error) {
    console.error('Error getting free trial record:', error);
    return null;
  }
}
