'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { PencilIcon, UsersIcon } from '@heroicons/react/24/outline';
import colors from '../../../colors.json';


// User data from ManageUsers - keep in sync
const dummyUsers = [
  {
    id: '00001',
    name: 'ABC Restaurant',
    email: 'admin@abcrestaurant.com',
    status: 'Active',
    plan: 'Yearly',
    minutes: '327/200',
    joinDate: '2023-01-15'
  },
  {
    id: '00002',
    name: 'XYZ Cafe',
    email: 'manager@xyzcafe.com',
    status: 'Inactive',
    plan: 'Quarter',
    minutes: '145/200',
    joinDate: '2023-02-22'
  },
  {
    id: '00003',
    name: 'Pizza Palace',
    email: 'owner@pizzapalace.com',
    status: 'Active',
    plan: 'Quarter',
    minutes: '89/200',
    joinDate: '2023-03-10'
  },
  {
    id: '00004',
    name: 'Burger King',
    email: 'admin@burgerking.com',
    status: 'Inactive',
    plan: 'Monthly',
    minutes: '234/200',
    joinDate: '2023-04-05'
  },
  {
    id: '00005',
    name: 'Sushi Express',
    email: 'contact@sushiexpress.com',
    status: 'Inactive',
    plan: 'Yearly',
    minutes: '156/200',
    joinDate: '2023-05-18'
  },
  {
    id: '00006',
    name: 'Taco Bell',
    email: 'manager@tacobell.com',
    status: 'Active',
    plan: 'Monthly',
    minutes: '298/200',
    joinDate: '2023-06-12'
  }
];

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

export default function ManageAssistants() {
  const { isDark } = useTheme();
  const { showSuccess } = useToast();
  const [selectedUser, setSelectedUser] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');


  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    
    if (userId) {
      const selectedUserData = dummyUsers.find(u => u.id === userId);
      if (selectedUserData) {
        setGreetingMessage(`Hello, Thank you for calling ${selectedUserData.name}. How can I help you today?`);
        setSystemPrompt(`You are a friendly, fast restaurant phone attendant for ${selectedUserData.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`);
      }
    } else {
      setGreetingMessage('');
      setSystemPrompt('');
    }
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const saveChanges = () => {
    if (selectedUser) {
      const selectedUserData = dummyUsers.find(u => u.id === selectedUser);
      if (selectedUserData) {
        showSuccess(`Changes saved for ${selectedUserData.name}`);
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
              value={selectedUser}
              onChange={(e) => handleUserChange(e.target.value)}
              className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
            >
              <option value="">-- Select a user --</option>
              {dummyUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.id})
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

        {/* Configuration Content - Only show when user is selected */}
        {selectedUser && (
          <>
            {/* Header with Edit Controls */}
      <div className="flex items-center justify-end space-x-2">
        {!isEditing ? (
          <button
            onClick={startEdit}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors`}
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
              onClick={saveChanges}
              className="px-3 py-2 text-sm font-medium text-white rounded-md transition-colors"
              style={{ backgroundColor: colors.colors.primary }}
            >
              Save Changes
            </button>
          </>
        )}
      </div>
              
      {/* Starting Message */}
      <div className="mb-4">
        <div className="mb-2">
          <label 
            className={`text-sm font-medium`}
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
            {greetingMessage}
          </p>
        )}
      </div>
              
      {/* System Prompt */}
      <div>
        <div className="mb-2">
          <label 
            className={`text-sm font-medium`}
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
          <p 
            className={`text-sm rounded-md p-3 whitespace-pre-wrap`}
            style={{
              color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
              backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[100]
            }}
          >
            {systemPrompt}
          </p>
        )}
      </div>
          </>
        )}
      </div>
    </>
  );
}
