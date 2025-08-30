'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { PencilIcon } from '@heroicons/react/24/outline';
import colors from '../../../colors.json';


// Assistant data
const assistant = {
  greetingMessage: 'Hello, Thank you for calling {name}. How can I help you today?',
  systemPrompt: 'You are a friendly, fast restaurant phone attendant for {NAME}. Goal: Ask for the customer\'s name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don\'t guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.'
};

export default function ManageAssistants() {
  const { isDark } = useTheme();
  const { showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState(assistant.greetingMessage);
  const [systemPrompt, setSystemPrompt] = useState(assistant.systemPrompt);


  const startEdit = () => {
    setIsEditing(true);
  };

  const saveChanges = () => {
    showSuccess('Changes saved successfully');
    setIsEditing(false);
  };

  const cancelEdit = () => {
    // Reset to original values
    setGreetingMessage(assistant.greetingMessage);
    setSystemPrompt(assistant.systemPrompt);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
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
              color: isDark ? colors.colors.white : colors.colors.grey[900],
              ':focus': {
                borderColor: colors.colors.primary
              }
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
              color: isDark ? colors.colors.white : colors.colors.grey[900],
              ':focus': {
                borderColor: colors.colors.primary
              }
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
    </div>
  );
}
