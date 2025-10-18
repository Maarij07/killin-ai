'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import { PencilIcon, UsersIcon, ArrowPathIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import colors from '../../../colors.json';

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

export default function ManageAssistants() {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [selectedUser, setSelectedUser] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(systemPrompt || '');
      showSuccess('Prompt copied to clipboard');
    } catch (e) {
      showError('Failed to copy prompt');
    }
  };

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: {
            // Production server - no special headers needed
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || data || []);
          
        } else {
          console.error('Failed to fetch users:', response.status);
          showError('Failed to load users data');
          
          // Log fetch failure
          logger.logSystemAction(
            'ASSISTANT_USER_DATA_FETCH_FAILED',
            `Failed to fetch users: HTTP ${response.status}`,
            'MEDIUM'
          );
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        showError('Failed to connect to API');
        
        // Log API connection error
        logger.logSystemAction(
          'ASSISTANT_USER_API_CONNECTION_FAILED',
          `Failed to connect to user API: ${error}`,
          'HIGH'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [showError]);

  // Function to sync VAPI assistants with our database
  const syncVapiAssistants = async () => {
    setIsSyncing(true);
    try {
      console.log('🔄 Starting VAPI sync process...');
      
      // Step 1: Fetch all VAPI assistants
      const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!vapiResponse.ok) {
        throw new Error(`Failed to fetch VAPI assistants: ${vapiResponse.status}`);
      }

      const vapiAssistants: VapiAssistant[] = await vapiResponse.json();
      console.log('📦 Fetched VAPI assistants:', vapiAssistants);

      // Step 2: Create a map of agent_id to assistant data
      const assistantMap = new Map();
      vapiAssistants.forEach((assistant: VapiAssistant) => {
        if (assistant.id) {
          // Extract system prompt from assistant model messages
          let systemPrompt = '';
          if (assistant.model?.messages && Array.isArray(assistant.model.messages)) {
            const systemMessage = assistant.model.messages.find(msg => msg.role === 'system');
            if (systemMessage) {
              systemPrompt = systemMessage.content || '';
            }
          }
          
          assistantMap.set(assistant.id, {
            firstMessage: assistant.firstMessage || '',
            systemPrompt: systemPrompt
          });
        }
      });

      console.log('🗺️ Assistant mapping:', Array.from(assistantMap.entries()));

      // Step 3: Update users with matching agent_ids
      const updatedUsers = users.map(user => {
        if (user.agent_id && assistantMap.has(user.agent_id)) {
          const assistantData = assistantMap.get(user.agent_id);
          console.log(`🔄 Updating user ${user.name} (${user.agent_id}):`, assistantData);
          
          // Combine firstMessage and systemPrompt into a single prompt
          // This matches how we extract them in handleUserChange
          const combinedPrompt = assistantData.systemPrompt;
          
          return {
            ...user,
            prompt: combinedPrompt
          };
        }
        return user;
      });

      // Step 4: Update database with new prompts
      try {
        const usersToUpdate = updatedUsers.filter(user => {
          const originalUser = users.find(u => u.id === user.id);
          return originalUser && originalUser.prompt !== user.prompt;
        });

        console.log('🗃️ Updating database with new prompts for users:', usersToUpdate.map(u => ({ id: u.id, name: u.name })));

        for (const user of usersToUpdate) {
          console.log(`📝 Updating prompt for user ${user.name} (ID: ${user.id})`);
          const updateResponse = await fetch(`${API_BASE_URL}/auth/users/${user.id}/prompt`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              // Production server - no special headers needed
            },
            body: JSON.stringify({ prompt: user.prompt })
          });

          if (!updateResponse.ok) {
            console.warn(`Failed to update prompt for user ${user.id} in database:`, updateResponse.status);
          } else {
            console.log(`✅ Successfully updated prompt for user ${user.name} in database`);
          }
        }
      } catch (dbError) {
        console.warn('Failed to update database with new prompts:', dbError);
      }

      // Step 5: Update local state
      setUsers(updatedUsers);
      
      // Step 6: Re-select current user to refresh the form with updated data
      if (selectedUser) {
        const updatedUserData = updatedUsers.find(u => u.id.toString() === selectedUser);
        if (updatedUserData) {
          console.log('🔄 Refreshing form with updated user data:', updatedUserData);
          
          // Extract greeting and system prompt from VAPI data
          let extractedGreeting = `Hello, Thank you for calling ${updatedUserData.name}. How can I help you today?`;
          let extractedSystemPrompt = updatedUserData.prompt || '';
          
          // Get the actual VAPI assistant data to extract the firstMessage
          if (updatedUserData.agent_id && assistantMap.has(updatedUserData.agent_id)) {
            const assistantData = assistantMap.get(updatedUserData.agent_id);
            extractedGreeting = assistantData.firstMessage || extractedGreeting;
            extractedSystemPrompt = assistantData.systemPrompt || extractedSystemPrompt;
          } else if (updatedUserData.prompt) {
          // Fallback: try to extract a greeting from the prompt
          const greetingMatch = updatedUserData.prompt?.match(/(?:Hello|Hi|Thank you for calling)[^.!?]*[.!?]/i);
          if (greetingMatch) {
            extractedGreeting = greetingMatch[0].trim();
          }
            extractedSystemPrompt = updatedUserData.prompt;
          }
          
          console.log('🔄 Setting form state to:', {
            greetingMessage: extractedGreeting,
            systemPrompt: extractedSystemPrompt
          });
          
          setGreetingMessage(extractedGreeting);
          setSystemPrompt(extractedSystemPrompt);
        }
      }

      console.log('✅ VAPI sync completed successfully');
      showSuccess('Successfully synced with VAPI assistants');
      
      // Log the sync action
      logger.logSystemAction(
        'VAPI_ASSISTANTS_SYNCED',
        `Successfully synced ${assistantMap.size} VAPI assistants with user database`,
        'MEDIUM'
      );

    } catch (error) {
      console.error('❌ Error syncing VAPI assistants:', error);
      showError(`Failed to sync with VAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log the sync error
      logger.logSystemAction(
        'VAPI_SYNC_FAILED',
        `Failed to sync VAPI assistants: ${error}`,
        'HIGH'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUserChange = async (userId: string) => {
    setSelectedUser(userId);
    
    if (userId) {
      const selectedUserData = users.find(u => u.id.toString() === userId);
      if (selectedUserData) {
        
        // Check if user has an agent_id
        if (!selectedUserData.agent_id) {
          // Fallback to defaults if no agent_id
          const defaultGreeting = `Hello, Thank you for calling ${selectedUserData.name}. How can I help you today?`;
          const defaultSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUserData.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          
          setGreetingMessage(defaultGreeting);
          setSystemPrompt(defaultSystemPrompt);
          return;
        }

        // Fetch data directly from VAPI API
        console.log(`🔄 [Dropdown] Fetching assistant configuration from VAPI for user ${selectedUserData.name} (Agent ID: ${selectedUserData.agent_id})`);
        
        try {
          const response = await fetch(`${VAPI_BASE_URL}/assistant/${selectedUserData.agent_id}`, {
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
            const vapiStartingMessage = assistantData.firstMessage || `Hello, Thank you for calling ${selectedUserData.name}. How can I help you today?`;
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
              vapiSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUserData.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or dessents.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
            }
            
            console.log('✅ [Dropdown] Using VAPI data:');
            console.log('   Starting Message:', vapiStartingMessage);
            console.log('   System Prompt:', vapiSystemPrompt.substring(0, 100) + '...');
            
            // Pre-populate form with VAPI data
            setGreetingMessage(vapiStartingMessage);
            setSystemPrompt(vapiSystemPrompt);
            
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [Dropdown] Failed to fetch assistant from VAPI:', response.status, errorData);
            
            // Fallback to defaults if VAPI fetch fails
            const fallbackGreeting = `Hello, Thank you for calling ${selectedUserData.name}. How can I help you today?`;
            const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUserData.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
            
            console.log('⚠️ [Dropdown] Using fallback defaults due to VAPI fetch failure');
            
            setGreetingMessage(fallbackGreeting);
            setSystemPrompt(fallbackSystemPrompt);
          }
          
        } catch (error) {
          console.error('❌ [Dropdown] Error fetching assistant from VAPI:', error);
          
          // Fallback to defaults if VAPI fetch fails
          const fallbackGreeting = `Hello, Thank you for calling ${selectedUserData.name}. How can I help you today?`;
          const fallbackSystemPrompt = `You are a friendly, fast restaurant phone attendant for ${selectedUserData.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`;
          
          console.log('⚠️ [Dropdown] Using fallback defaults due to VAPI error');
          
          setGreetingMessage(fallbackGreeting);
          setSystemPrompt(fallbackSystemPrompt);
        }
      }
    } else {
      setGreetingMessage('');
      setSystemPrompt('');
    }
  };

  const startEdit = () => {
    if (selectedUser) {
      const selectedUserData = users.find(u => u.id.toString() === selectedUser);
      if (selectedUserData) {
      }
    }
    setIsEditing(true);
  };

  const saveChanges = async () => {
    if (selectedUser) {
      const selectedUserData = users.find(u => u.id.toString() === selectedUser);
      if (selectedUserData) {
        if (!selectedUserData.agent_id) {
          showError(`No agent ID found for ${selectedUserData.name}. Cannot update VAPI assistant.`);
          return;
        }

        try {
          // Step 1: Update VAPI assistant
          const requestBody = {
            firstMessage: greetingMessage,
            backgroundSound: "office",
            model: {
              provider: "openai",
              model: "gpt-4o",
              toolIds: ['351ff32f-5b41-4f96-a103-1d2b90b64574'],
              messages: [
                {
                  content: systemPrompt,
                  role: "system"
                }
              ]
            }
          };
          
          console.log('🚀 Updating VAPI assistant:', selectedUserData.agent_id);
          console.log('📝 Request body:', requestBody);
          
          const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant/${selectedUserData.agent_id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (vapiResponse.ok) {
            const vapiResult = await vapiResponse.json();
            console.log('✅ VAPI assistant updated successfully:', vapiResult);
            
            // Log current form state BEFORE sync
            console.log('📋 BEFORE SYNC - Form State:', {
              greetingMessage,
              systemPrompt,
              selectedUser: selectedUser,
              userAgentId: selectedUserData.agent_id
            });
            
            // Step 2: Update our local database by syncing with VAPI
            await syncVapiAssistants();
            
            // Log current form state AFTER sync
            console.log('📋 AFTER SYNC - Form State:', {
              greetingMessage,
              systemPrompt,
              selectedUser: selectedUser,
              userAgentId: selectedUserData.agent_id
            });
            
            // Verify that VAPI data matches form data
            const updatedUserData = users.find(u => u.id.toString() === selectedUser);
            if (updatedUserData) {
              console.log('🔍 VERIFICATION - Updated User Data:', {
                userName: updatedUserData.name,
                prompt: updatedUserData.prompt,
                formSystemPrompt: systemPrompt,
                doTheyMatch: updatedUserData.prompt === systemPrompt
              });
            }
            
            // Log prompt change
            logger.logPromptChanged(
              selectedUserData.email,
              selectedUserData.name,
              {
                oldPrompt: selectedUserData.prompt || undefined,
                newPrompt: systemPrompt
              }
            );
            
            showSuccess(`Assistant configuration updated for ${selectedUserData.name}`);
            
          } else {
            const errorData = await vapiResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to update VAPI assistant:', vapiResponse.status, errorData);
            
            logger.logSystemAction(
              'ASSISTANT_CONFIGURATION_FAILED',
              `Failed to update VAPI assistant for: ${selectedUserData.name} - ${JSON.stringify(errorData)}`,
              'HIGH'
            );
            
            showError(`Failed to update VAPI assistant: ${errorData.error || errorData.message || 'API request failed'}`);
            return;
          }
          
        } catch (error) {
          console.error('❌ Error updating VAPI assistant:', error);
          
          logger.logSystemAction(
            'ASSISTANT_CONFIGURATION_ERROR',
            `Error updating VAPI assistant for: ${selectedUserData.name} - ${error}`,
            'HIGH'
          );
          
          showError(`Failed to connect to VAPI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
    } else {
      showSuccess('Changes saved successfully');
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    // Reset to original values based on selected user
    if (selectedUser) {
      handleUserChange(selectedUser);
    } else {
      setGreetingMessage('');
      setSystemPrompt('');
    }
    setIsEditing(false);
  };

  return (
    <>
      {/* Custom Styles for Dropdown Hover */}
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Assistant Management
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure AI assistant prompts and settings for each restaurant
            </p>
          </div>
          
          {/* Sync Button */}
          <button
            onClick={syncVapiAssistants}
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
            title="Sync with VAPI assistants to get latest prompts"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync VAPI'}
          </button>
        </div>

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
            {/* User Selection Dropdown */}
            <div>
              <div className="mb-2">
                <label 
                  className="text-sm font-medium"
                  style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                >
                  Select User
                </label>
              </div>
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => handleUserChange(e.target.value)}
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
            {!selectedUser && (
              <div className="text-center py-12">
                <UsersIcon 
                  className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} 
                  style={{ color: isDark ? colors.colors.grey[600] : colors.colors.grey[400] }}
                />
                <h3 
                  className="mt-2 text-sm font-medium"
                  style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[900] }}
                >
                  Select a user to manage their VAPI configurations
                </h3>
                <p 
                  className="mt-1 text-sm"
                  style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}
                >
                  Choose a user from the dropdown above to configure their assistant settings.
                </p>
              </div>
            )}

            {/* Configuration Content - Only show when user is selected */}
            {selectedUser && (
              <>
                {/* User Information Section */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-6`}>
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    User Information
                  </h3>
                  {(() => {
                    const selectedUserData = users.find(u => u.id.toString() === selectedUser);
                    return selectedUserData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {selectedUserData.agent_id}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">No agent assigned</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Location
                          </label>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedUserData.location || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Plan
                          </label>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedUserData.plan ? (
                              <span className="capitalize font-medium" style={{ color: colors.colors.primary }}>
                                {selectedUserData.plan}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Free</span>
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

                {/* Prompt Preview Section */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Current User Prompt
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(systemPrompt || '').length} chars
                      </span>
                      <button
                        type="button"
                        onClick={copyPromptToClipboard}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white"
                        style={{ backgroundColor: colors.colors.primary }}
                        title="Copy prompt"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="rounded-md p-3 text-sm whitespace-pre-wrap overflow-y-auto max-h-64"
                    style={{
                      color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                      background: isDark ? 'linear-gradient(180deg, #1f2937 0%, #111827 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
                      border: `1px solid ${isDark ? colors.colors.grey[700] : colors.colors.grey[200]}`
                    }}
                  >
                    {systemPrompt && systemPrompt.trim().length > 0 ? (
                      systemPrompt
                    ) : (
                      <span className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No prompt available for this user.
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant Configuration Section */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  {/* Header with Edit Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Assistant Configuration
                    </h3>
                    <div className="flex items-center space-x-2">
                      {!isEditing ? (
                        <button
                          onClick={startEdit}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors"
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
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 text-sm font-medium rounded-md border transition-colors"
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
                            onClick={saveChanges}
                            className="px-3 py-2 text-sm font-medium text-white rounded-md transition-colors"
                            style={{ backgroundColor: colors.colors.primary }}
                          >
                            Save Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Starting Message */}
                  <div className="mb-4">
                    <div className="mb-2">
                      <label 
                        className="text-sm font-medium"
                        style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                      >
                        Starting Message
                      </label>
                    </div>
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
                        className="text-sm rounded-md p-3"
                        style={{
                          color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                          backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[100]
                        }}
                      >
                        {greetingMessage}
                      </p>
                    )}
                  </div>
                  
                  {/* System Prompt */}
                  <div>
                    <div className="mb-2">
                      <label 
                        className="text-sm font-medium"
                        style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}
                      >
                        System Prompt
                      </label>
                    </div>
                    
                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        style={{
                          backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.white,
                          borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300],
                          color: isDark ? colors.colors.white : colors.colors.grey[900],
                          minHeight: '40vh' // Fixed minimum height at 40% of viewport height
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
                        className="text-sm rounded-md p-3 whitespace-pre-wrap overflow-y-auto"
                        style={{
                          color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                          backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[100],
                          minHeight: '40vh' // Fixed minimum height at 40% of viewport height
                        }}
                      >
                        {systemPrompt}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
