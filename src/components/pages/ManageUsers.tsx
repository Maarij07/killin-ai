'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowPathIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';
import Modal from '../Modal';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  plan: string;
  minutes_allowed: number;
  minutes_used: number;
  description: string;
  location: string;
  created_at: string;
  updated_at: string;
  join_date: string;
  agent_id: string | null;
  prompt: string | null;
  assistant_status?: 'synced' | 'out_of_sync' | 'no_assistant' | 'error';
  last_synced?: string;
}

interface VapiAssistant {
  id: string;
  firstMessage?: string;
  backgroundSound?: string;
  model?: {
    provider?: string;
    model?: string;
    messages?: Array<{
      content?: string;
      role?: string;
    }>;
  };
}


// Custom styles for dropdown hover effects
const dropdownStyles = `
  .custom-select {
    accent-color: ${colors.colors.primary};
  }
  .custom-select option {
    background-color: white;
    color: black;
  }
  .custom-select option:hover {
    background-color: ${colors.colors.primary} !important;
    background: ${colors.colors.primary} !important;
    color: white !important;
  }
  .custom-select option:focus {
    background-color: ${colors.colors.primary} !important;
    background: ${colors.colors.primary} !important;
    color: white !important;
  }
  .custom-select option:checked {
    background-color: ${colors.colors.primary} !important;
    background: ${colors.colors.primary} !important;
    color: white !important;
  }
  .custom-select option[selected] {
    background-color: ${colors.colors.primary} !important;
    background: ${colors.colors.primary} !important;
    color: white !important;
  }
  
  /* Dark mode styles */
  .dark .custom-select option {
    background-color: #374151;
    color: white;
  }
  .dark .custom-select option:hover {
    background-color: ${colors.colors.primary} !important;
    background: ${colors.colors.primary} !important;
    color: white !important;
  }
`;

const API_BASE_URL = 'https://server.kallin.ai/api';
const VAPI_API_KEY = '4214a0ea-b594-435d-9abb-599c1f3a81ea';
const VAPI_BASE_URL = 'https://api.vapi.ai';

export default function ManageUsers() {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({ 
    isOpen: false, 
    user: null 
  });
  const [manageModal, setManageModal] = useState<{ isOpen: boolean; user: User | null }>({ 
    isOpen: false, 
    user: null 
  });
  const [vapiModal, setVapiModal] = useState<{ isOpen: boolean; user: User | null }>({ 
    isOpen: false, 
    user: null 
  });
  const [editForm, setEditForm] = useState({
    status: '',
    addMinutes: '1',
    planSubscription: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [vapiForm, setVapiForm] = useState({
    selectedUser: '',
    startingMessage: '',
    systemPrompt: '',
    isEditing: false
  });

  // Fetch users from API and sync with VAPI
  useEffect(() => {
    const fetchUsersAndSync = async () => {
      try {
        console.log('🔄 Fetching users and syncing with VAPI...');
        
        // Step 1: Fetch users from database
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: {
            // Production server - no special headers needed
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const usersData = data.users || data || [];
          console.log('📊 Fetched users from database:', usersData.length);
          
          // Step 2: Sync with VAPI to get live assistant data
          const syncedUsers = await syncUsersWithVAPI(usersData);
          setUsers(syncedUsers);
          setLastSyncTime(new Date());
          
        } else {
          console.error('Failed to fetch users:', response.status);
          showError('Failed to load users data');
          
          // Log fetch failure
          logger.logSystemAction(
            'USER_DATA_FETCH_FAILED',
            `Failed to fetch users: HTTP ${response.status}`,
            'MEDIUM'
          );
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        showError('Failed to connect to API');
        
        // Log API connection error
        logger.logSystemAction(
          'USER_API_CONNECTION_FAILED',
          `Failed to connect to user API: ${error}`,
          'HIGH'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersAndSync();
  }, [showError]);

  // Function to sync users with VAPI and get live data
  const syncUsersWithVAPI = async (usersData: User[]): Promise<User[]> => {
    try {
      console.log('🔄 Starting VAPI sync for users...');
      
      // Fetch all VAPI assistants
      const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!vapiResponse.ok) {
        console.warn('⚠️ VAPI sync failed, using database data only');
        return usersData.map(user => ({
          ...user,
          assistant_status: user.agent_id ? ('error' as const) : ('no_assistant' as const),
          last_synced: new Date().toISOString()
        }));
      }

      const vapiAssistants: VapiAssistant[] = await vapiResponse.json();
      console.log('📦 Fetched VAPI assistants:', vapiAssistants.length);

      // Create a map of agent_id to assistant data
      const assistantMap = new Map();
      vapiAssistants.forEach((assistant: VapiAssistant) => {
        if (assistant.id) {
          let systemPrompt = '';
          if (assistant.model?.messages && Array.isArray(assistant.model.messages)) {
            const systemMessage = assistant.model.messages.find(msg => msg.role === 'system');
            if (systemMessage) {
              systemPrompt = systemMessage.content || '';
            }
          }
          
          assistantMap.set(assistant.id, {
            firstMessage: assistant.firstMessage || '',
            systemPrompt: systemPrompt,
            lastSynced: new Date().toISOString()
          });
        }
      });

      // Update users with VAPI sync status and data
      const syncedUsers = usersData.map(user => {
        if (!user.agent_id) {
          return {
            ...user,
            assistant_status: 'no_assistant' as const,
            last_synced: new Date().toISOString()
          };
        }

        if (assistantMap.has(user.agent_id)) {
          const assistantData = assistantMap.get(user.agent_id);
          const isInSync = user.prompt === assistantData.systemPrompt;
          
          return {
            ...user,
            prompt: assistantData.systemPrompt, // Update with live VAPI data
            assistant_status: isInSync ? ('synced' as const) : ('out_of_sync' as const),
            last_synced: assistantData.lastSynced
          };
        } else {
          return {
            ...user,
            assistant_status: 'error' as const,
            last_synced: new Date().toISOString()
          };
        }
      });

      console.log('✅ VAPI sync completed for users');
      return syncedUsers;
    } catch (error) {
      console.error('❌ Error syncing with VAPI:', error);
      return usersData.map(user => ({
        ...user,
        assistant_status: user.agent_id ? ('error' as const) : ('no_assistant' as const),
        last_synced: new Date().toISOString()
      }));
    }
  };

  // Manual VAPI sync function
  const handleVAPISync = async () => {
    setIsSyncing(true);
    try {
      console.log('🔄 Manual VAPI sync initiated...');
      const syncedUsers = await syncUsersWithVAPI(users);
      setUsers(syncedUsers);
      setLastSyncTime(new Date());
      showSuccess('Successfully synced with VAPI assistants');
      
      // Log the sync action
      logger.logSystemAction(
        'USER_VAPI_SYNC_COMPLETED',
        `Successfully synced ${syncedUsers.filter(u => u.agent_id).length} users with VAPI assistants`,
        'MEDIUM'
      );
    } catch (error) {
      console.error('❌ Manual VAPI sync failed:', error);
      showError(`Failed to sync with VAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log the sync error
      logger.logSystemAction(
        'USER_VAPI_SYNC_FAILED',
        `Failed to sync users with VAPI: ${error}`,
        'HIGH'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Get assistant status color and icon
  const getAssistantStatusInfo = (status?: string) => {
    switch (status) {
      case 'synced':
        return { 
          color: '#10B981', 
          bgColor: '#ECFDF5', 
          text: 'Synced', 
          icon: '✅',
          description: 'Assistant is in sync with VAPI'
        };
      case 'out_of_sync':
        return { 
          color: '#F59E0B', 
          bgColor: '#FFFBEB', 
          text: 'Out of Sync', 
          icon: '⚠️',
          description: 'Assistant data differs from VAPI'
        };
      case 'error':
        return { 
          color: '#EF4444', 
          bgColor: '#FEF2F2', 
          text: 'Error', 
          icon: '❌',
          description: 'Failed to connect to VAPI'
        };
      case 'no_assistant':
      default:
        return { 
          color: '#6B7280', 
          bgColor: '#F9FAFB', 
          text: 'No Assistant', 
          icon: '➖',
          description: 'No assistant configured'
        };
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' }; // Green
      case 'inactive':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // Yellow
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; // Gray
    }
  };

  const getPlanColor = (plan: string) => {
    const normalizedPlan = (plan || '').toLowerCase();
    switch (normalizedPlan) {
      case 'basic':
      case '':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' }; // Blue
      case 'premium':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // Green
      case 'enterprise':
        return { bg: '#E9D5FF', text: '#7C3AED', border: '#C4B5FD' }; // Purple
      // Legacy plan names for backward compatibility
      case 'free':
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' }; // Gray
      case 'starter':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' }; // Blue
      case 'popular':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // Green
      case 'pro':
        return { bg: '#E9D5FF', text: '#7C3AED', border: '#C4B5FD' }; // Purple
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; // Gray
    }
  };

  // Helper function to get display name for plan
  const getPlanDisplayName = (plan: string) => {
    if (!plan || plan.trim() === '') {
      return 'Free';
    }
    return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
  };

  
  const handleVapiSettings = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      // Check if user has an agent_id
      if (!user.agent_id) {
        // Fallback to defaults if no agent_id
        const defaultGreeting = `Hello, Thank you for calling ${user.name}. How can I help you today?`;
        const defaultSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${user.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
        
        setVapiForm({
          selectedUser: userId.toString(),
          startingMessage: defaultGreeting,
          systemPrompt: defaultSystemPrompt,
          isEditing: false
        });
        setVapiModal({ isOpen: true, user });
        return;
      }

      // Fetch data directly from VAPI API
      console.log(`🔄 Fetching assistant configuration from VAPI for user ${user.name} (Agent ID: ${user.agent_id})`);
      
      try {
        const response = await fetch(`${VAPI_BASE_URL}/assistant/${user.agent_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const assistantData = await response.json();
          console.log('📦 Fetched assistant data from VAPI:', JSON.stringify(assistantData, null, 2));
          
          // Extract data from VAPI response
          const vapiStartingMessage = assistantData.firstMessage || `Hello, Thank you for calling ${user.name}. How can I help you today?`;
          let vapiSystemPrompt = '';
          
          // Extract system prompt from model messages
          if (assistantData.model?.messages && Array.isArray(assistantData.model.messages)) {
            const systemMessage = assistantData.model.messages.find((msg: { role: string; content?: string }) => msg.role === 'system');
            if (systemMessage && systemMessage.content) {
              vapiSystemPrompt = systemMessage.content;
            }
          }
          
          // If no system prompt found in VAPI, use default
          if (!vapiSystemPrompt) {
            vapiSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${user.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          }
          
          console.log('✅ Using VAPI data:');
          console.log('   Starting Message:', vapiStartingMessage);
          console.log('   System Prompt:', vapiSystemPrompt.substring(0, 100) + '...');
          
          // Pre-populate form with VAPI data
          setVapiForm({
            selectedUser: userId.toString(),
            startingMessage: vapiStartingMessage,
            systemPrompt: vapiSystemPrompt,
            isEditing: false
          });
          
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ Failed to fetch assistant from VAPI:', response.status, errorData);
          
          // Fallback to defaults if VAPI fetch fails
          const fallbackGreeting = `Hello, Thank you for calling ${user.name}. How can I help you today?`;
          const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${user.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          
          console.log('⚠️ Using fallback defaults due to VAPI fetch failure');
          
          setVapiForm({
            selectedUser: userId.toString(),
            startingMessage: fallbackGreeting,
            systemPrompt: fallbackSystemPrompt,
            isEditing: false
          });
        }
        
      } catch (error) {
        console.error('❌ Error fetching assistant from VAPI:', error);
        
        // Fallback to defaults if VAPI fetch fails
        const fallbackGreeting = `Hello, Thank you for calling ${user.name}. How can I help you today?`;
        const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${user.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
        
        console.log('⚠️ Using fallback defaults due to VAPI error');
        
        setVapiForm({
          selectedUser: userId.toString(),
          startingMessage: fallbackGreeting,
          systemPrompt: fallbackSystemPrompt,
          isEditing: false
        });
      }
      
      setVapiModal({ isOpen: true, user });
    }
  };

  const handleEdit = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      
      setEditForm({
        status: user.status,
        addMinutes: '1', // Default to 1 for add minutes
        planSubscription: user.plan || 'basic' // Default to 'basic' if plan is null or empty
      });
      setManageModal({ isOpen: true, user });
    }
  };

  const handleDelete = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      
      setDeleteModal({ isOpen: true, user });
    }
  };

  const confirmDelete = () => {
    if (deleteModal.user) {
      // Log user deletion
      logger.logUserAction(
        'USER_DELETED',
        deleteModal.user.email,
        `Admin deleted user: ${deleteModal.user.name} (ID: ${deleteModal.user.id})`
      );
      
      // Here you would implement the actual delete logic
      showSuccess(`User ${deleteModal.user.name} has been deleted successfully`);
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleSaveChanges = async () => {
    if (manageModal.user) {
      setIsSaving(true);
      
      // Calculate new total minutes by adding addMinutes to current allowed minutes
      const addMinutesValue = parseInt(editForm.addMinutes) || 0;
      const newTotalMinutes = manageModal.user.minutes_allowed + addMinutesValue;
      
      // Log user update with details of changes
      const changes = {
        oldStatus: manageModal.user.status,
        newStatus: editForm.status,
        oldMinutes: manageModal.user.minutes_allowed.toString(),
        addedMinutes: addMinutesValue.toString(),
        newMinutes: newTotalMinutes.toString(),
        oldPlan: manageModal.user.plan || 'basic',
        newPlan: editForm.planSubscription
      };
      
      // Log minutes added if any minutes were added
      if (addMinutesValue > 0) {
        logger.logMinutesAdded(
          manageModal.user.email,
          manageModal.user.name,
          addMinutesValue,
          newTotalMinutes
        );
      }
      
      try {
        // Determine plan type based on changes
        let planType = "custom";
        
        // Map current plan names to API expected names
        const planMapping: { [key: string]: string } = {
          'basic': 'basic',
          'premium': 'premium',
          'enterprise': 'enterprise'
        };
        
        // Check if plan actually changed
        if (changes.oldPlan !== changes.newPlan) {
          planType = planMapping[changes.newPlan] || 'basic';
        } else {
          // If only minutes changed (same plan), set plan_type as "custom"
          planType = "custom";
        }
        
        // Prepare API payload with admin flag - send only the minutes to ADD, not the total
        const payload = {
          user_id: manageModal.user.id,
          plan_type: planType,
          amount_paid: 0,
          transaction_id: "",
          payment_intent_id: "",
          minutes: addMinutesValue, // Send only the minutes to add, not the calculated total
          is_admin: true
        };
        
        console.log('Sending payment confirmation API call:', payload);
        
        // Make API call to confirm payment/update user
        const response = await fetch(`${API_BASE_URL}/stripe/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Production server - no special headers needed
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Payment confirmation API response:', result);
          
          // Log successful API call
          logger.logUserAction(
            'USER_PAYMENT_CONFIRMED',
            manageModal.user.email,
            `Admin updated user via payment API: ${manageModal.user.name} (ID: ${manageModal.user.id}). Plan: ${planType}, Minutes: ${newTotalMinutes}`
          );
          
          showSuccess(`Changes saved for ${manageModal.user.name}`);
          
          // Refresh users data to reflect changes with VAPI sync
          const fetchUsers = async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/auth/users`, {
                headers: {
                  // Production server - no special headers needed
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const usersData = data.users || data || [];
                
                // Re-sync with VAPI to maintain assistant status
                const syncedUsers = await syncUsersWithVAPI(usersData);
                setUsers(syncedUsers);
                setLastSyncTime(new Date());
              }
            } catch (error) {
              console.error('Error refreshing users:', error);
            }
          };
          fetchUsers();
          
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Payment confirmation API failed:', response.status, errorData);
          
          // Log API failure
          logger.logUserAction(
            'USER_PAYMENT_CONFIRMATION_FAILED',
            manageModal.user.email,
            `Admin failed to update user via payment API: ${manageModal.user.name} (ID: ${manageModal.user.id}). Error: ${response.status} - ${JSON.stringify(errorData)}`
          );
          
          showError(`Failed to save changes: ${errorData.message || errorData.error || 'API request failed'}`);
          return; // Don't close modal if API fails
        }
      } catch (error) {
        console.error('Error calling payment confirmation API:', error);
        
        // Log connection error
        logger.logUserAction(
          'USER_PAYMENT_API_ERROR',
          manageModal.user.email,
          `Admin encountered error calling payment API for user: ${manageModal.user.name} (ID: ${manageModal.user.id}). Error: ${error}`
        );
        
        showError(`Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return; // Don't close modal if API fails
      } finally {
        setIsSaving(false);
      }
      
      setManageModal({ isOpen: false, user: null });
    }
  };

  const handleCancelManage = () => {
    setManageModal({ isOpen: false, user: null });
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // VAPI Configuration Handlers
  const handleVapiFormChange = async (field: string, value: string) => {
    setVapiForm(prev => ({ ...prev, [field]: value }));
    
    // When user selects a user from dropdown, load their configuration from VAPI API
    if (field === 'selectedUser' && value) {
      const selectedUser = users.find(u => u.id.toString() === value);
      if (selectedUser) {
        
        // Check if user has an agent_id
        if (!selectedUser.agent_id) {
          // Fallback to defaults if no agent_id
          const defaultGreeting = `Hello, Thank you for calling ${selectedUser.name}. How can I help you today?`;
          const defaultSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUser.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          
          setVapiForm(prev => ({
            ...prev,
            selectedUser: value,
            startingMessage: defaultGreeting,
            systemPrompt: defaultSystemPrompt
          }));
          return;
        }

        // Fetch data directly from VAPI API
        console.log(`🔄 [Dropdown] Fetching assistant configuration from VAPI for user ${selectedUser.name} (Agent ID: ${selectedUser.agent_id})`);
        
        try {
          const response = await fetch(`${VAPI_BASE_URL}/assistant/${selectedUser.agent_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const assistantData = await response.json();
            console.log('📦 [Dropdown] Fetched assistant data from VAPI:', JSON.stringify(assistantData, null, 2));
            
            // Extract data from VAPI response
            const vapiStartingMessage = assistantData.firstMessage || `Hello, Thank you for calling ${selectedUser.name}. How can I help you today?`;
            let vapiSystemPrompt = '';
            
            // Extract system prompt from model messages
            if (assistantData.model?.messages && Array.isArray(assistantData.model.messages)) {
              const systemMessage = assistantData.model.messages.find((msg: { role: string; content?: string }) => msg.role === 'system');
              if (systemMessage && systemMessage.content) {
                vapiSystemPrompt = systemMessage.content;
              }
            }
            
            // If no system prompt found in VAPI, use default
            if (!vapiSystemPrompt) {
              vapiSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUser.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
            }
            
            console.log('✅ [Dropdown] Using VAPI data:');
            console.log('   Starting Message:', vapiStartingMessage);
            console.log('   System Prompt:', vapiSystemPrompt.substring(0, 100) + '...');
            
            // Pre-populate form with VAPI data
            setVapiForm(prev => ({
              ...prev,
              selectedUser: value,
              startingMessage: vapiStartingMessage,
              systemPrompt: vapiSystemPrompt
            }));
            
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [Dropdown] Failed to fetch assistant from VAPI:', response.status, errorData);
            
            // Fallback to defaults if VAPI fetch fails
            const fallbackGreeting = `Hello, Thank you for calling ${selectedUser.name}. How can I help you today?`;
            const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUser.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
            
            console.log('⚠️ [Dropdown] Using fallback defaults due to VAPI fetch failure');
            
            setVapiForm(prev => ({
              ...prev,
              selectedUser: value,
              startingMessage: fallbackGreeting,
              systemPrompt: fallbackSystemPrompt
            }));
          }
          
        } catch (error) {
          console.error('❌ [Dropdown] Error fetching assistant from VAPI:', error);
          
          // Fallback to defaults if VAPI fetch fails
          const fallbackGreeting = `Hello, Thank you for calling ${selectedUser.name}. How can I help you today?`;
          const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUser.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          
          console.log('⚠️ [Dropdown] Using fallback defaults due to VAPI error');
          
          setVapiForm(prev => ({
            ...prev,
            selectedUser: value,
            startingMessage: fallbackGreeting,
            systemPrompt: fallbackSystemPrompt
          }));
        }
      }
    }
  };

  const startVapiEdit = () => {
    console.log('🔧 Starting VAPI edit mode');
    setVapiForm(prev => ({ ...prev, isEditing: true }));
  };

  const saveVapiChanges = async () => {
    console.log('💾 saveVapiChanges function called!');
    console.log('Current vapiForm state:', vapiForm);
    
    if (vapiForm.selectedUser) {
      const selectedUser = users.find(u => u.id.toString() === vapiForm.selectedUser);
      console.log('Selected user data:', selectedUser);
      
      if (selectedUser) {
        console.log('Agent ID found:', selectedUser.agent_id);
        
        // Check if user has an agent_id (assistant_id)
        if (!selectedUser.agent_id) {
          showError(`No agent ID found for ${selectedUser.name}. Cannot update VAPI assistant.`);
          logger.logUserAction(
            'USER_VAPI_UPDATE_FAILED',
            selectedUser.email,
            `Admin attempted to update VAPI configuration but no agent_id found for user: ${selectedUser.name} (ID: ${selectedUser.id})`
          );
          return;
        }

        try {
          // 🔍 DETAILED AGENT ID DEBUGGING
          console.log('🔍 === AGENT ID DEBUGGING ===');
          console.log('selectedUser object:', JSON.stringify(selectedUser, null, 2));
          console.log('selectedUser.agent_id:', selectedUser.agent_id);
          console.log('typeof selectedUser.agent_id:', typeof selectedUser.agent_id);
          console.log('selectedUser.agent_id length:', selectedUser.agent_id ? selectedUser.agent_id.length : 'null');
          console.log('=== END AGENT ID DEBUGGING ===');

          // First, try to GET the assistant to see if it exists
          console.log('Testing assistant existence with GET request...');
          const testResponse = await fetch(`https://api.vapi.ai/assistant/${selectedUser.agent_id}`, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer 4214a0ea-b594-435d-9abb-599c1f3a81ea',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('GET Response Status:', testResponse.status);
          if (testResponse.ok) {
            const assistantData = await testResponse.json();
            console.log('🔍 Current Assistant Data:', JSON.stringify(assistantData, null, 2));
            
            // Check if this assistant has toolIds
            if (assistantData.model && assistantData.model.toolIds) {
              console.log('⚠️ WARNING: Assistant currently has toolIds:', assistantData.model.toolIds);
            } else {
              console.log('✅ Assistant does NOT currently have toolIds');
            }
          } else {
            const errorData = await testResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Assistant GET failed:', testResponse.status, errorData);
            
            // If GET fails, maybe the agent_id is wrong?
            if (testResponse.status === 404) {
              console.error('🚨 AGENT NOT FOUND! The agent_id might be incorrect.');
              showError(`Assistant with ID ${selectedUser.agent_id} not found. Please check the agent ID.`);
              return;
            }
          }

          // Log the request details for debugging
          const requestUrl = `https://api.vapi.ai/assistant/${selectedUser.agent_id}`;
          
          // Use same structure as working ManageAssistants
          const requestBody = {
            firstMessage: vapiForm.startingMessage,
            backgroundSound: "office",
            model: {
              provider: "openai",
              model: "gpt-4o",
              toolIds: ['351ff32f-5b41-4f96-a103-1d2b90b64574'],
              messages: [
                {
                  content: vapiForm.systemPrompt,
                  role: "system"
                }
              ]
            }
          };
          
          console.log('🚀 === MINIMAL VAPI API REQUEST TEST ===');
          console.log('URL:', requestUrl);
          console.log('Method: PATCH');
          console.log('Headers:', {
            'Authorization': 'Bearer 4214a0ea-b594-435d-9abb-599c1f3a81ea',
            'Content-Type': 'application/json'
          });
          console.log('Body:', JSON.stringify(requestBody, null, 2));
          console.log('Agent ID:', selectedUser.agent_id);
          console.log('=== END REQUEST DETAILS ===');
          
          // Call VAPI API to update the assistant
          const response = await fetch(requestUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': 'Bearer 4214a0ea-b594-435d-9abb-599c1f3a81ea',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const result = await response.json();
            console.log('VAPI assistant updated successfully:', result);
            
            // Log prompt change
            logger.logPromptChanged(
              selectedUser.email,
              selectedUser.name,
              {
                oldPrompt: selectedUser.prompt || undefined,
                newPrompt: vapiForm.systemPrompt
              }
            );
            
            showSuccess(`VAPI configuration saved for ${selectedUser.name}`);
            setVapiForm(prev => ({ ...prev, isEditing: false }));
            
            // Immediately fetch the updated assistant data to refresh the form
            try {
              console.log('🔄 Fetching updated assistant data from VAPI...');
              console.log('🔍 Agent ID being used:', selectedUser.agent_id);
              
              // Add a small delay to ensure VAPI has processed the update
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Fetch the specific assistant that was just updated
              const updatedAssistantResponse = await fetch(`${VAPI_BASE_URL}/assistant/${selectedUser.agent_id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${VAPI_API_KEY}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('📡 Updated assistant response status:', updatedAssistantResponse.status);
              
              if (updatedAssistantResponse.ok) {
                const updatedAssistant = await updatedAssistantResponse.json();
                console.log('📦 Fetched updated assistant full data:', JSON.stringify(updatedAssistant, null, 2));
                
                // Extract the updated system prompt
                let updatedSystemPrompt = '';
                const updatedStartingMessage = updatedAssistant.firstMessage || '';
                
                if (updatedAssistant.model?.messages && Array.isArray(updatedAssistant.model.messages)) {
                  const systemMessage = updatedAssistant.model.messages.find((msg: { role: string; content?: string }) => msg.role === 'system');
                  if (systemMessage) {
                    updatedSystemPrompt = systemMessage.content || '';
                  }
                }
                
                console.log('📝 Extracted data:');
                console.log('   Starting Message:', updatedStartingMessage);
                console.log('   System Prompt (first 100 chars):', updatedSystemPrompt.substring(0, 100) + '...');
                
                // Update the local users state with the new prompt
                const updatedUsers = users.map(user => {
                  if (user.id === selectedUser.id) {
                    return {
                      ...user,
                      prompt: updatedSystemPrompt
                    };
                  }
                  return user;
                });
                
                console.log('🔄 Updating users state...');
                setUsers(updatedUsers);
                
                // Update the VAPI form with the fresh data from the API
                console.log('🔄 Updating VAPI form state...');
                const newFormState = {
                  selectedUser: selectedUser.id.toString(),
                  startingMessage: updatedStartingMessage,
                  systemPrompt: updatedSystemPrompt,
                  isEditing: false
                };
                
                console.log('📝 New form state:', newFormState);
                setVapiForm(newFormState);
                
                // 🔥 REAL-TIME VERIFICATION: Show what VAPI actually has vs what frontend shows
                console.log('\n🔥 === REAL-TIME SYNC VERIFICATION ===');
                console.log('📊 VAPI API Response Data:');
                console.log('   Starting Message (firstMessage):', `"${updatedStartingMessage}"`);
                console.log('   System Prompt (model.messages[0].content):');
                console.log('   ', updatedSystemPrompt.substring(0, 200) + '...');
                console.log('\n📱 Frontend Form State:');
                console.log('   Starting Message:', `"${newFormState.startingMessage}"`);
                console.log('   System Prompt:');
                console.log('   ', newFormState.systemPrompt.substring(0, 200) + '...');
                console.log('\n🎯 Sync Status:');
                console.log('   Starting Messages Match:', updatedStartingMessage === newFormState.startingMessage ? '✅ YES' : '❌ NO');
                console.log('   System Prompts Match:', updatedSystemPrompt === newFormState.systemPrompt ? '✅ YES' : '❌ NO');
                console.log('🔥 === END VERIFICATION ===\n');
                
                // Update database with new prompt (optional - don't let this break the VAPI update)
                try {
                  console.log(`📝 Attempting to update prompt for user ${selectedUser.name} (ID: ${selectedUser.id}) in database`);
                  
                  // Add timeout to prevent hanging
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                  
                  const updateResponse = await fetch(`${API_BASE_URL}/auth/users/${selectedUser.id}/prompt`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      // Production server - no special headers needed
                      'Accept': 'application/json'
                    },
                    body: JSON.stringify({ prompt: updatedSystemPrompt }),
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);

                  if (!updateResponse.ok) {
                    console.warn(`⚠️ Database update failed for user ${selectedUser.id}:`, updateResponse.status, 'This is optional and won\'t affect VAPI functionality');
                  } else {
                    console.log(`✅ Successfully updated prompt for user ${selectedUser.name} in database`);
                  }
                } catch (dbError) {
                  console.warn('⚠️ Database update failed (optional):', dbError instanceof Error ? dbError.message : 'Unknown error', '- VAPI update was successful');
                }
                
                console.log('✅ VAPI form refreshed with updated data');
                
                // Force a re-render by updating the form again after a short delay
                setTimeout(() => {
                  console.log('🔄 Force refreshing form state...');
                  setVapiForm({
                    selectedUser: selectedUser.id.toString(),
                    startingMessage: updatedStartingMessage,
                    systemPrompt: updatedSystemPrompt,
                    isEditing: false
                  });
                }, 100);
                
              } else {
                const errorText = await updatedAssistantResponse.text();
                console.error('Failed to fetch updated assistant:', updatedAssistantResponse.status, errorText);
                // If we can't fetch the updated data, use what we just sent
                console.log('🔄 Using locally saved data since fetch failed...');
                setVapiForm(prev => ({
                  ...prev,
                  isEditing: false
                }));
              }
            } catch (syncError) {
              console.error('Error fetching updated assistant data:', syncError);
              // If sync fails, use what we just sent
              console.log('🔄 Using locally saved data due to sync error...');
              setVapiForm(prev => ({
                ...prev,
                isEditing: false
              }));
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to update VAPI assistant:', response.status, errorData);
            
            // Log API failure
            logger.logUserAction(
              'USER_VAPI_UPDATE_FAILED',
              selectedUser.email,
              `Admin failed to update VAPI configuration for user: ${selectedUser.name} (ID: ${selectedUser.id}). API Error: ${response.status} - ${JSON.stringify(errorData)}`
            );
            
            showError(`Failed to update VAPI configuration: ${errorData.error || 'API request failed'}`);
          }
        } catch (error) {
          console.error('Error updating VAPI assistant:', error);
          
          // Log connection error
          logger.logUserAction(
            'USER_VAPI_UPDATE_ERROR',
            selectedUser.email,
            `Admin encountered error updating VAPI configuration for user: ${selectedUser.name} (ID: ${selectedUser.id}). Error: ${error}`
          );
          
          showError(`Failed to connect to VAPI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };

  const cancelVapiEdit = () => {
    // Reset to original values or reload from selected user
    if (vapiForm.selectedUser) {
      handleVapiFormChange('selectedUser', vapiForm.selectedUser);
    }
    setVapiForm(prev => ({ ...prev, isEditing: false }));
  };

  const handleCancelVapi = () => {
    setVapiModal({ isOpen: false, user: null });
    setVapiForm({
      selectedUser: '',
      startingMessage: '',
      systemPrompt: '',
      isEditing: false
    });
  };

  return (
    <>
      {/* Custom Styles for Dropdown Hover */}
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />
      
      <div className="space-y-6">
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading users...</p>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage user accounts, permissions, and access controls
            {lastSyncTime && (
              <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                • Last synced: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* VAPI Sync Button */}
          <button
            onClick={handleVAPISync}
            disabled={isSyncing || isLoading}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              isSyncing || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
              borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300]
            }}
            onMouseEnter={(e) => {
              if (!isSyncing && !isLoading) {
                e.currentTarget.style.backgroundColor = isDark ? colors.colors.grey[700] : colors.colors.grey[50];
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Sync with VAPI to get latest assistant data"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync VAPI'}
          </button>
          
          {/* Search Bar */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm shadow-sm ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors`}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  SR.
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  NAME
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  STATUS
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  PLAN
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  MINUTES
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ASSISTANT
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.map((user) => {
                const statusColors = getStatusColor(user.status);
                const planColors = getPlanColor(user.plan);
                
                return (
                  <tr key={user.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      #{user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.colors.primary}20` }}>
                            <UserCircleIcon className="h-5 w-5" style={{ color: colors.colors.primary }} />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          borderColor: statusColors.border
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: planColors.bg,
                          color: planColors.text,
                          borderColor: planColors.border
                        }}
                      >
                        {getPlanDisplayName(user.plan)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.minutes_used}/{user.minutes_allowed}</span>
                        <div className={`w-16 h-1 rounded-full mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-1 rounded-full bg-orange-500"
                            style={{ width: `${Math.min((user.minutes_used / user.minutes_allowed) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const statusInfo = getAssistantStatusInfo(user.assistant_status);
                        return (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="flex items-center px-2 py-1 text-xs font-medium rounded-full border"
                              style={{
                                backgroundColor: statusInfo.bgColor,
                                color: statusInfo.color,
                                borderColor: statusInfo.color + '40'
                              }}
                              title={statusInfo.description}
                            >
                              <span className="mr-1">{statusInfo.icon}</span>
                              {statusInfo.text}
                            </div>
                            {user.agent_id && (
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <SignalIcon className="h-3 w-3 inline mr-1" />
                                {user.last_synced ? new Date(user.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        {/* Settings Button - VAPI Configuration - Show for users with agent_id, invisible placeholder for others */}
                        {user.agent_id ? (
                          <button
                            onClick={() => handleVapiSettings(user.id)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="VAPI Configuration"
                          >
                            <Cog6ToothIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="p-1.5 w-7 h-7"> {/* Invisible placeholder to maintain spacing */}
                          </div>
                        )}
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(user.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Edit User"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                          }`}
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              No users found
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>

      {/* Manage User Modal */}
      <Modal
        isOpen={manageModal.isOpen}
        onClose={handleCancelManage}
        title="Manage User"
        customContent={
          manageModal.user ? (
            <div className="space-y-4">
              {/* User Info Section */}
              <div className="flex items-center space-x-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: colors.colors.primary }}
                  >
                    LOGO
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {manageModal.user.name}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {manageModal.user.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {manageModal.user.minutes_used}/{manageModal.user.minutes_allowed} minutes
                      </p>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-1.5 rounded-full"
                      style={{ 
                        backgroundColor: colors.colors.primary,
                        width: `${Math.min((manageModal.user.minutes_used / manageModal.user.minutes_allowed) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields - 2 Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* User Status */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      User Status
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        disabled={isSaving}
                        className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Add Minutes */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Add Minutes
                    </label>
                    <input
                      type="number"
                      value={editForm.addMinutes}
                      onChange={(e) => handleFormChange('addMinutes', e.target.value)}
                      disabled={isSaving}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        isSaving ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isDark
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                      placeholder="Enter minutes to add"
                      min="1"
                    />
                  </div>

                  {/* Plan Subscription */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Plan Subscription
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.planSubscription}
                        onChange={(e) => handleFormChange('planSubscription', e.target.value)}
                        disabled={isSaving}
                        className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                      >
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Restaurant Location */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Restaurant Location
                    </label>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      {manageModal.user?.location || 'No location specified'}
                    </p>
                  </div>

                  {/* Restaurant Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Restaurant Description
                    </label>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {manageModal.user?.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
        primaryButton={{
          text: isSaving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Saving...
            </div>
          ) : 'Save Changes',
          onClick: handleSaveChanges,
          disabled: isSaving
        }}
        secondaryButton={{
          text: 'Cancel',
          onClick: handleCancelManage
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        icon={<ExclamationTriangleIcon className="h-8 w-8" />}
        title="Delete User"
        description={deleteModal.user ? `Are you sure you want to delete "${deleteModal.user.name}"? This action cannot be undone and will permanently remove all data associated with this user account.` : ''}
        primaryButton={{
          text: 'Delete User',
          onClick: confirmDelete
        }}
        secondaryButton={{
          text: 'Cancel',
          onClick: cancelDelete
        }}
      />

      {/* VAPI Configuration Modal */}
      <Modal
        isOpen={vapiModal.isOpen}
        onClose={handleCancelVapi}
        title="VAPI Configuration"
        customContent={
          <div className="space-y-6">
            {/* Header with Edit Controls */}
            <div className="flex items-center justify-end space-x-2">
              {!vapiForm.isEditing ? (
                <button
                  onClick={startVapiEdit}
                  disabled={!vapiForm.selectedUser}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    !vapiForm.selectedUser 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  style={{
                    color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                    borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300]
                  }}
                  onMouseEnter={(e) => {
                    if (vapiForm.selectedUser) {
                      e.currentTarget.style.backgroundColor = isDark ? colors.colors.grey[700] : colors.colors.grey[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelVapiEdit}
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors`}
                    style={{
                      color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                      borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? colors.colors.grey[700] : colors.colors.grey[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveVapiChanges}
                    className="px-3 py-2 text-sm font-medium text-white rounded-md transition-colors"
                    style={{ backgroundColor: colors.colors.primary }}
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>

            {/* User Selection Dropdown */}
            <div>
              <div className="mb-2">
                <label 
                  className={`text-sm font-medium`}
                  style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                >
                  Select User
                </label>
              </div>
              <div className="relative">
                <select
                  value={vapiForm.selectedUser}
                  onChange={(e) => handleVapiFormChange('selectedUser', e.target.value)}
                  className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                >
                  <option value="">-- Select a user --</option>
                  {users.filter(user => user.agent_id).map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.name} (#{user.id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {!vapiForm.selectedUser && (
              <div className="text-center py-12">
                <UsersIcon 
                  className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} 
                  style={{ color: isDark ? colors.colors.grey[600] : colors.colors.grey[400] }}
                />
                <h3 
                  className={`mt-2 text-sm font-medium`}
                  style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[900] }}
                >
                  Select a user to manage their VAPI configurations
                </h3>
                <p 
                  className={`mt-1 text-sm`}
                  style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}
                >
                  Choose a user from the dropdown above to configure their assistant settings.
                </p>
              </div>
            )}

            {/* User Information Section - Only show when user is selected */}
            {vapiForm.selectedUser && (
              <>
                {/* User Information Display */}
                <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border p-4 mb-4`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    User Information
                  </h4>
                  {(() => {
                    const selectedUserData = users.find(u => u.id.toString() === vapiForm.selectedUser);
                    return selectedUserData ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Restaurant Name
                          </label>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUserData.name}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Email
                          </label>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedUserData.email}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Agent ID
                          </label>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedUserData.agent_id ? (
                              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                {selectedUserData.agent_id}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">No agent assigned</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Status
                          </label>
                          <p className="text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedUserData.status.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}>
                              {selectedUserData.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
                
                {/* Configuration Fields */}
                <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Starting Message */}
                <div>
                  <div className="mb-2">
                    <label 
                      className={`text-sm font-medium`}
                      style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                    >
                      Starting Message
                    </label>
                  </div>
                  
                  {vapiForm.isEditing ? (
                    <input
                      type="text"
                      value={vapiForm.startingMessage}
                      onChange={(e) => handleVapiFormChange('startingMessage', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                      style={{
                        backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.white,
                        borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300],
                        color: isDark ? colors.colors.white : colors.colors.grey[900]
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.colors.primary;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isDark ? colors.colors.grey[600] : colors.colors.grey[300];
                      }}
                      placeholder="Enter starting message"
                    />
                  ) : (
                    <p 
                      className={`text-sm rounded-md p-3`}
                      style={{
                        color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                        backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[100]
                      }}
                    >
                      {vapiForm.startingMessage}
                    </p>
                  )}
                </div>

                {/* Right Column - System Prompt */}
                <div>
                  <div className="mb-2">
                    <label 
                      className={`text-sm font-medium`}
                      style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                    >
                      System Prompt
                    </label>
                  </div>
                  
                  {vapiForm.isEditing ? (
                    <textarea
                      rows={8}
                      value={vapiForm.systemPrompt}
                      onChange={(e) => handleVapiFormChange('systemPrompt', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                      style={{
                        backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.white,
                        borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300],
                        color: isDark ? colors.colors.white : colors.colors.grey[900]
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.colors.primary;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isDark ? colors.colors.grey[600] : colors.colors.grey[300];
                      }}
                      placeholder="Enter system prompt"
                    />
                  ) : (
                    <div 
                      className={`text-sm rounded-md p-3 whitespace-pre-wrap max-h-48 overflow-y-auto`}
                      style={{
                        color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                        backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[100]
                      }}
                    >
                      {vapiForm.systemPrompt}
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </div>
        }
        secondaryButton={{
          text: 'Close',
          onClick: handleCancelVapi
        }}
      />
      </>
      )}
      </div>
    </>
  );
}
