'use client';

import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { auth } from './firebase';

export interface LogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  category: 'ADMIN_MANAGEMENT' | 'USER_MANAGEMENT' | 'SYSTEM' | 'AUTHENTICATION' | 'SETTINGS';
  details: string;
  metadata?: {
    targetUser?: string;
    targetEmail?: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
    createdBy?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class Logger {
  private db = getFirestore();
  private logsCollection = collection(this.db, 'activity_logs');

  /**
   * Log an admin activity
   */
  async logActivity(
    action: string,
    category: LogEntry['category'],
    details: string,
    severity: LogEntry['severity'] = 'MEDIUM',
    metadata?: LogEntry['metadata']
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user found for logging');
        return;
      }

      const logEntry: Omit<LogEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown Admin',
        adminEmail: currentUser.email || 'unknown@example.com',
        action,
        category,
        details,
        severity,
        metadata: {
          ...metadata,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
          ipAddress: 'Client-side' // Would need server-side implementation for real IP
        }
      };

      await addDoc(this.logsCollection, logEntry);
      console.log('Activity logged:', action);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid disrupting main functionality
    }
  }

  /**
   * Get recent activity logs
   */
  async getRecentLogs(limitCount: number = 100): Promise<LogEntry[]> {
    try {
      const logsQuery = query(
        this.logsCollection,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logs: LogEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        } as LogEntry);
      });
      
      return logs;
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return [];
    }
  }

  /**
   * Get logs by admin
   */
  async getLogsByAdmin(adminId: string, limitCount: number = 50): Promise<LogEntry[]> {
    try {
      const logsQuery = query(
        this.logsCollection,
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logs: LogEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        } as LogEntry);
      });
      
      return logs;
    } catch (error) {
      console.error('Failed to fetch admin logs:', error);
      return [];
    }
  }

  /**
   * Get logs by category
   */
  async getLogsByCategory(category: LogEntry['category'], limitCount: number = 50): Promise<LogEntry[]> {
    try {
      const logsQuery = query(
        this.logsCollection,
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logs: LogEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        } as LogEntry);
      });
      
      return logs;
    } catch (error) {
      console.error('Failed to fetch category logs:', error);
      return [];
    }
  }

  // Convenience methods for specific admin actions only
  async logPromptChanged(userEmail: string, userName: string, changes: { oldPrompt?: string, newPrompt?: string }) {
    await this.logActivity(
      'PROMPT_CHANGED',
      'USER_MANAGEMENT', 
      `Admin changed prompt for ${userName} (${userEmail})`,
      'MEDIUM',
      {
        targetEmail: userEmail,
        targetUser: userName,
        oldValue: changes.oldPrompt,
        newValue: changes.newPrompt
      }
    );
  }

  async logMinutesAdded(userEmail: string, userName: string, minutesAdded: number, newTotal: number) {
    await this.logActivity(
      'MINUTES_ADDED',
      'USER_MANAGEMENT',
      `Admin added ${minutesAdded} minutes to ${userName} (${userEmail}). New total: ${newTotal} minutes`,
      'MEDIUM',
      {
        targetEmail: userEmail,
        targetUser: userName,
        oldValue: newTotal - minutesAdded,
        newValue: newTotal
      }
    );
  }

  async logAdminCreated(createdAdminEmail: string, createdByEmail: string) {
    await this.logActivity(
      'ADMIN_CREATED',
      'ADMIN_MANAGEMENT',
      `New admin account created: ${createdAdminEmail} by ${createdByEmail}`,
      'HIGH',
      {
        targetEmail: createdAdminEmail,
        createdBy: createdByEmail
      }
    );
  }

  // Keep other existing admin methods for backwards compatibility
  async logAdminDeleted(deletedAdminEmail: string) {
    await this.logActivity(
      'ADMIN_DELETED',
      'ADMIN_MANAGEMENT',
      `Admin account deleted: ${deletedAdminEmail}`,
      'CRITICAL',
      {
        targetEmail: deletedAdminEmail
      }
    );
  }

  async logAdminUpdated(updatedAdminEmail: string, changes: Record<string, unknown>) {
    await this.logActivity(
      'ADMIN_UPDATED',
      'ADMIN_MANAGEMENT',
      `Admin account updated: ${updatedAdminEmail}`,
      'MEDIUM',
      {
        targetEmail: updatedAdminEmail,
        newValue: changes
      }
    );
  }

  // Keep legacy methods for backwards compatibility - but they won't be used for new logs
  async logUserAction(action: string, userEmail: string, details: string) {
    // Only log if it's not a login/logout action
    if (!action.includes('LOGIN') && !action.includes('LOGOUT')) {
      await this.logActivity(
        action,
        'USER_MANAGEMENT',
        details,
        'MEDIUM',
        {
          targetEmail: userEmail
        }
      );
    }
  }

  async logSystemAction(action: string, details: string, severity: LogEntry['severity'] = 'LOW') {
    // Only log if it's not a login/logout action  
    if (!action.includes('LOGIN') && !action.includes('LOGOUT') && !action.includes('ADMIN_SIGNIN')) {
      await this.logActivity(
        action,
        'SYSTEM',
        details,
        severity
      );
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logActivity = logger.logActivity.bind(logger);
export const getRecentLogs = logger.getRecentLogs.bind(logger);
export const getLogsByAdmin = logger.getLogsByAdmin.bind(logger);
export const getLogsByCategory = logger.getLogsByCategory.bind(logger);
