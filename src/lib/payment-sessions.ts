// Simple in-memory session store to prevent duplicate payment intents
// In production, you should use Redis or a database for this

interface PaymentSession {
  userId: string;
  planId: string;
  paymentIntentId: string;
  clientSecret: string;
  createdAt: Date;
  expiresAt: Date;
}

class PaymentSessionManager {
  private sessions = new Map<string, PaymentSession>();
  private readonly EXPIRY_MINUTES = 15; // Payment sessions expire after 15 minutes

  // Generate a session key from user and plan
  private getSessionKey(userId: string, planId: string): string {
    return `${userId}-${planId}`;
  }

  // Check if a valid session exists
  public getExistingSession(userId: string, planId: string): PaymentSession | null {
    const key = this.getSessionKey(userId, planId);
    const session = this.sessions.get(key);
    
    if (!session) {
      return null;
    }
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(key);
      return null;
    }
    
    return session;
  }

  // Create a new session
  public createSession(userId: string, planId: string, paymentIntentId: string, clientSecret: string): PaymentSession {
    const key = this.getSessionKey(userId, planId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.EXPIRY_MINUTES * 60 * 1000));
    
    const session: PaymentSession = {
      userId,
      planId,
      paymentIntentId,
      clientSecret,
      createdAt: now,
      expiresAt
    };
    
    this.sessions.set(key, session);
    console.log(`Created payment session for user ${userId}, plan ${planId}, expires at ${expiresAt}`);
    
    return session;
  }

  // Complete a session (remove it from the store)
  public completeSession(userId: string, planId: string): void {
    const key = this.getSessionKey(userId, planId);
    const session = this.sessions.get(key);
    
    if (session) {
      this.sessions.delete(key);
      console.log(`Completed payment session for user ${userId}, plan ${planId}`);
    }
  }

  // Clean up expired sessions (should be called periodically)
  public cleanupExpiredSessions(): void {
    const now = new Date();
    let cleaned = 0;
    
    for (const [key, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired payment sessions`);
    }
  }

  // Get session stats (for debugging)
  public getStats(): { totalSessions: number; activeSessions: number } {
    this.cleanupExpiredSessions();
    return {
      totalSessions: this.sessions.size,
      activeSessions: this.sessions.size
    };
  }
}

// Export singleton instance
export const paymentSessions = new PaymentSessionManager();

// Set up periodic cleanup (every 5 minutes)
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    paymentSessions.cleanupExpiredSessions();
  }, 5 * 60 * 1000); // 5 minutes
}
