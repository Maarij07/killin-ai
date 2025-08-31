'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';
import Modal from '../Modal';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
  minutes: string;
  joinDate: string;
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

// Dummy data for users
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

export default function ManageUsers() {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
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
    totalMinutes: '',
    planSubscription: ''
  });
  const [vapiForm, setVapiForm] = useState({
    selectedUser: '',
    startingMessage: '',
    systemPrompt: '',
    isEditing: false
  });

  // Filter users based on search term
  const filteredUsers = dummyUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' }; // Green
      case 'Inactive':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // Yellow
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; // Gray
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Yearly':
        return { bg: '#E0F2FE', text: '#0C4A6E', border: '#BAE6FD' }; // Light Blue
      case 'Quarter':
        return { bg: '#F0FDFA', text: '#134E4A', border: '#A7F3D0' }; // Teal
      case 'Monthly':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }; // Light Red
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; // Gray
    }
  };

  const handleManage = (userId: string) => {
    const user = dummyUsers.find(u => u.id === userId);
    if (user) {
      // Reset VAPI form
      setVapiForm({
        selectedUser: user.id,
        startingMessage: 'Hello, Thank you for calling {name}. How can I help you today?',
        systemPrompt: 'You are a friendly, fast restaurant phone attendant for {NAME}. Goal: Ask for the customer\'s name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don\'t guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.',
        isEditing: false
      });
      setVapiModal({ isOpen: true, user });
    }
  };
  
  const handleVapiSettings = (userId: string) => {
    const user = dummyUsers.find(u => u.id === userId);
    if (user) {
      // Pre-populate form with the selected user's data
      setVapiForm({
        selectedUser: userId,
        startingMessage: `Hello, Thank you for calling ${user.name}. How can I help you today?`,
        systemPrompt: `You are a friendly, fast restaurant phone attendant for ${user.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`,
        isEditing: false
      });
      setVapiModal({ isOpen: true, user });
    }
  };

  const handleEdit = (userId: string) => {
    const user = dummyUsers.find(u => u.id === userId);
    if (user) {
      setEditForm({
        status: user.status,
        totalMinutes: user.minutes.split('/')[0],
        planSubscription: user.plan === 'Yearly' ? 'Premium' : user.plan === 'Quarter' ? 'Basic' : 'Enterprise'
      });
      setManageModal({ isOpen: true, user });
    }
  };

  const handleDelete = (userId: string) => {
    const user = dummyUsers.find(u => u.id === userId);
    if (user) {
      setDeleteModal({ isOpen: true, user });
    }
  };

  const confirmDelete = () => {
    if (deleteModal.user) {
      // Here you would implement the actual delete logic
      showSuccess(`User ${deleteModal.user.name} has been deleted successfully`);
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleSaveChanges = () => {
    if (manageModal.user) {
      showSuccess(`Changes saved for ${manageModal.user.name}`);
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
  const handleVapiFormChange = (field: string, value: string) => {
    setVapiForm(prev => ({ ...prev, [field]: value }));
    
    // When user selects a user from dropdown, load their configuration
    if (field === 'selectedUser' && value) {
      const selectedUser = dummyUsers.find(u => u.id === value);
      if (selectedUser) {
        setVapiForm(prev => ({
          ...prev,
          selectedUser: value,
          startingMessage: `Hello, Thank you for calling ${selectedUser.name}. How can I help you today?`,
          systemPrompt: `You are a friendly, fast restaurant phone attendant for ${selectedUser.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.\nStyle:\n-\nwarm, concise, professional. One to two sentences at a time.\nAsk one question at a time. Do not interrupt the caller.\nIf unsure, ask a clarifying question; don't guess.\nCore flow (follow in order):\n1) Greet Intent: "Pickup or delivery today?"\n2) Get name and callback number.\n3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.\n4) Take the order:\n-\nItem, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.\nIf an item is unavailable or unclear, offer close alternatives or best-sellers.\n5) Ask about allergies or dietary needs. Offer safe options without medical advice.\n6) Upsell gently (ONE quick option): sides, drinks, or desserts.\n7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.\n8) Quote timing: pickup-ready time or delivery estimate.\n9) Payment:\n-\nPrefer pay at pickup/delivery or a secure link if available.\nDo NOT collect full credit card numbers over the phone.`
        }));
      }
    }
  };

  const startVapiEdit = () => {
    setVapiForm(prev => ({ ...prev, isEditing: true }));
  };

  const saveVapiChanges = () => {
    if (vapiForm.selectedUser) {
      const selectedUser = dummyUsers.find(u => u.id === vapiForm.selectedUser);
      if (selectedUser) {
        showSuccess(`VAPI configuration saved for ${selectedUser.name}`);
      }
    }
    setVapiForm(prev => ({ ...prev, isEditing: false }));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage user accounts, permissions, and access controls
          </p>
        </div>
        
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
                      {user.id}
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
                        {user.plan}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.minutes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        {/* Settings Button - VAPI Configuration */}
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
                        {manageModal.user.minutes} minutes
                      </p>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-1.5 rounded-full"
                      style={{ 
                        backgroundColor: colors.colors.primary,
                        width: `${Math.min((parseInt(manageModal.user.minutes.split('/')[0]) / parseInt(manageModal.user.minutes.split('/')[1])) * 100, 100)}%`
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
                        className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
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

                  {/* Total Minutes */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total Minutes
                    </label>
                    <input
                      type="number"
                      value={editForm.totalMinutes}
                      onChange={(e) => handleFormChange('totalMinutes', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        isDark
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                      placeholder="Enter total minutes"
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
                        className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                          isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                      >
                        <option value="Basic">Basic</option>
                        <option value="Premium">Premium</option>
                        <option value="Enterprise">Enterprise</option>
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
                      Food Court, 2nd Floor, Centaurus Mall, F-8, Jinnah Avenue, Islamabad
                    </p>
                  </div>

                  {/* Restaurant Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Restaurant Description
                    </label>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      A place where fresh ingredients, bold flavors, and comforting recipes come together. From sizzling appetizers to hearty mains and indulgent desserts, every dish is crafted to satisfy. Whether you&apos;re dropping by for a quick bite or enjoying a meal with friends, the cozy ambiance and friendly service make every visit memorable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
        primaryButton={{
          text: 'Save Changes',
          onClick: handleSaveChanges
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

            {/* Configuration Fields - Only show when user is selected */}
            {vapiForm.selectedUser && (
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
            )}
          </div>
        }
        secondaryButton={{
          text: 'Close',
          onClick: handleCancelVapi
        }}
      />
      </div>
    </>
  );
}
