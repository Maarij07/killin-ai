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
  PlusIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';
import Modal from '../Modal';

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

// Dummy data for admins
const dummyAdmins = [
  {
    id: 'ADM001',
    name: 'John Smith',
    email: 'john.smith@kallin.ai',
    status: 'Active',
    role: 'Super Admin',
    lastLogin: '2024-01-15T10:30:00Z',
    permissions: 'Full Access'
  },
  {
    id: 'ADM002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@kallin.ai',
    status: 'Active',
    role: 'Admin',
    lastLogin: '2024-01-14T16:45:00Z',
    permissions: 'User Management'
  },
  {
    id: 'ADM003',
    name: 'Mike Chen',
    email: 'mike.chen@kallin.ai',
    status: 'Inactive',
    role: 'Moderator',
    lastLogin: '2024-01-10T09:15:00Z',
    permissions: 'Content Review'
  },
  {
    id: 'ADM004',
    name: 'Emily Davis',
    email: 'emily.davis@kallin.ai',
    status: 'Active',
    role: 'Admin',
    lastLogin: '2024-01-15T14:20:00Z',
    permissions: 'System Settings'
  },
  {
    id: 'ADM005',
    name: 'Robert Wilson',
    email: 'robert.wilson@kallin.ai',
    status: 'Inactive',
    role: 'Moderator',
    lastLogin: '2024-01-08T11:00:00Z',
    permissions: 'User Support'
  }
];

export default function Admins() {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; admin: any | null }>({ 
    isOpen: false, 
    admin: null 
  });
  const [manageModal, setManageModal] = useState<{ isOpen: boolean; admin: any | null }>({ 
    isOpen: false, 
    admin: null 
  });
  const [addModal, setAddModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    role: '',
    permissions: ''
  });
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    role: 'Admin'
  });

  // Filter admins based on search term
  const filteredAdmins = dummyAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.id.includes(searchTerm)
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }; // Red
      case 'Admin':
        return { bg: '#E0F2FE', text: '#0C4A6E', border: '#BAE6FD' }; // Blue
      case 'Moderator':
        return { bg: '#F3E8FF', text: '#6B21A8', border: '#DDD6FE' }; // Purple
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; // Gray
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleManage = (adminId: string) => {
    const admin = dummyAdmins.find(a => a.id === adminId);
    if (admin) {
      setEditForm({
        status: admin.status,
        role: admin.role,
        permissions: admin.permissions
      });
      setManageModal({ isOpen: true, admin });
    }
  };

  const handleEdit = (adminId: string) => {
    handleManage(adminId); // Same as manage for now
  };

  const handleDelete = (adminId: string) => {
    const admin = dummyAdmins.find(a => a.id === adminId);
    if (admin) {
      setDeleteModal({ isOpen: true, admin });
    }
  };

  const handleAddAdmin = () => {
    setAddModal(true);
  };

  const confirmDelete = () => {
    if (deleteModal.admin) {
      showSuccess(`Admin ${deleteModal.admin.name} has been deleted successfully`);
      setDeleteModal({ isOpen: false, admin: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, admin: null });
  };

  const handleSaveChanges = () => {
    if (manageModal.admin) {
      showSuccess(`Changes saved for ${manageModal.admin.name}`);
      setManageModal({ isOpen: false, admin: null });
    }
  };

  const handleCancelManage = () => {
    setManageModal({ isOpen: false, admin: null });
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddNewAdmin = () => {
    // Validate form fields
    if (!addForm.name.trim()) {
      showError('Please enter a full name');
      return;
    }

    if (!addForm.email.trim()) {
      showError('Please enter an email address');
      return;
    }

    if (!isValidEmail(addForm.email)) {
      showError('Please enter a valid email address');
      return;
    }

    showSuccess(`New admin ${addForm.name} has been added successfully`);
    setAddModal(false);
    setAddForm({
      name: '',
      email: '',
      role: 'Admin'
    });
  };

  const handleCancelAdd = () => {
    setAddModal(false);
    setAddForm({
      name: '',
      email: '',
      role: 'Admin'
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddFormChange = (field: string, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* Custom Styles for Dropdown Hover */}
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />
      
      <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Administrator Management
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage administrator accounts, permissions, and system access levels
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search administrators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm shadow-sm ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors`}
            />
          </div>
          
          {/* Add Admin Button */}
          <button
            onClick={handleAddAdmin}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full sm:w-auto"
            style={{ 
              backgroundColor: colors.colors.primary,
              '&:hover': { backgroundColor: '#dc2626' }
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.colors.primary}
          >
            <PlusIcon className="h-4 w-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ID
                </th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  NAME
                </th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  STATUS
                </th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ROLE
                </th>
                <th className={`hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  LAST LOGIN
                </th>
                <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredAdmins.map((admin) => {
                const statusColors = getStatusColor(admin.status);
                const roleColors = getRoleColor(admin.role);
                
                return (
                  <tr key={admin.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {admin.id}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.colors.primary + '20' }}>
                            <ShieldCheckIcon className="h-5 w-5" style={{ color: colors.colors.primary }} />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {admin.name}
                            <span className={`sm:hidden block text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                              {admin.id}
                            </span>
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          borderColor: statusColors.border
                        }}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: roleColors.bg,
                          color: roleColors.text,
                          borderColor: roleColors.border
                        }}
                      >
                        {admin.role}
                      </span>
                      <div className={`md:hidden text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {formatLastLogin(admin.lastLogin)}
                      </div>
                    </td>
                    <td className={`hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatLastLogin(admin.lastLogin)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Manage Button */}
                        <button
                          onClick={() => handleManage(admin.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Manage Admin"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(admin.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Edit Admin"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                          }`}
                          title="Delete Admin"
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
        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              No administrators found
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={addModal}
        onClose={handleCancelAdd}
        title="Add New Administrator"
        customContent={
          <div className="space-y-4">
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => handleAddFormChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => handleAddFormChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                  placeholder="Enter email address"
                />
              </div>

              {/* Role */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Role
                </label>
                <div className="relative">
                  <select
                    value={addForm.role}
                    disabled
                    className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-not-allowed opacity-60 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="Admin">Admin</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        primaryButton={{
          text: 'Add Administrator',
          onClick: handleAddNewAdmin
        }}
        secondaryButton={{
          text: 'Cancel',
          onClick: handleCancelAdd
        }}
      />

      {/* Manage Admin Modal */}
      <Modal
        isOpen={manageModal.isOpen}
        onClose={handleCancelManage}
        title="Manage Administrator"
        customContent={
          manageModal.admin ? (
            <div className="space-y-4">
              {/* Admin Info Section */}
              <div className="flex items-center space-x-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: '#ea580c' }}
                  >
                    <ShieldCheckIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {manageModal.admin.name}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {manageModal.admin.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {manageModal.admin.permissions}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Admin Status */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Admin Status
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

                {/* Role */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                        isDark
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Permissions
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.permissions}
                      onChange={(e) => handleFormChange('permissions', e.target.value)}
                      className={`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${
                        isDark
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
                    >
                      <option value="Full Access">Full Access</option>
                      <option value="User Management">User Management</option>
                      <option value="System Settings">System Settings</option>
                      <option value="Content Review">Content Review</option>
                      <option value="User Support">User Support</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
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
        title="Delete Administrator"
        description={deleteModal.admin ? `Are you sure you want to delete administrator "${deleteModal.admin.name}"? This action cannot be undone and will permanently remove all access privileges for this administrator.` : ''}
        primaryButton={{
          text: 'Delete Administrator',
          onClick: confirmDelete
        }}
        secondaryButton={{
          text: 'Cancel',
          onClick: cancelDelete
        }}
      />
      </div>
    </>
  );
}
