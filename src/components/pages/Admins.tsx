'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { logger } from '../../lib/logger';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';
import Modal from '../Modal';

interface Admin {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  lastLogin: string;
  permissions: string;
  disabled?: boolean;
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

export default function Admins() {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; admin: Admin | null }>({ 
    isOpen: false, 
    admin: null 
  });
  const [manageModal, setManageModal] = useState<{ isOpen: boolean; admin: Admin | null }>({ 
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
  const [hasShownLoadError, setHasShownLoadError] = useState(false);

  // Load admins from Firestore
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const db = getFirestore();
        const adminsCollection = collection(db, 'admins');
        const adminQuery = query(adminsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(adminQuery);
        
        const adminsList: Admin[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          adminsList.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            status: data.status || 'Active',
            role: data.role || 'Admin',
            lastLogin: data.lastLogin || data.createdAt,
            permissions: data.permissions || 'User Management',
            disabled: data.disabled || false
          });
        });
        
        setAdmins(adminsList);
        console.log('Loaded admins from Firestore:', adminsList);
      } catch (error) {
        console.error('Error fetching admins:', error);
        // Only show error toast once
        if (!hasShownLoadError) {
          showError('Failed to load administrators');
          setHasShownLoadError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, [showError, hasShownLoadError]);

  // Filter admins based on search term
  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.id.includes(searchTerm)
  );

  const getStatusColor = (status: string, disabled?: boolean) => {
    if (disabled) {
      return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' }; // Gray for disabled
    }
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
    const admin = admins.find(a => a.id === adminId);
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

  // const handleDelete = (adminId: string) => {
  //   const admin = admins.find(a => a.id === adminId);
  //   if (admin) {
  //     setDeleteModal({ isOpen: true, admin });
  //   }
  // };

  const handleAddAdmin = () => {
    setAddModal(true);
  };

  const handleToggleDisable = async (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) return;
    
    const newDisabledState = !admin.disabled;
    const action = newDisabledState ? 'disable' : 'enable';
    
    try {
      const db = getFirestore();
      const adminDocRef = doc(db, 'admins', adminId);
      const adminDocSnap = await getDoc(adminDocRef);
      
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        const firebaseUID = adminData.uid;
        
        if (firebaseUID) {
          try {
            // Use Firebase Cloud Function to toggle admin status
            const functions = getFunctions();
            const toggleAdminStatus = httpsCallable(functions, 'toggleAdminStatus');
            
            const result = await toggleAdminStatus({
              uid: firebaseUID,
              adminDocId: adminId,
              disabled: newDisabledState
            });
            
            console.log('Cloud Function result:', result);
            
            // Update local state for immediate UI update
            setAdmins(prev => prev.map(a => 
              a.id === adminId ? { ...a, disabled: newDisabledState } : a
            ));
            
            // Log admin status change
            await logger.logAdminUpdated(admin.email, {
              disabled: { old: admin.disabled, new: newDisabledState }
            });
            
            showSuccess(`Admin ${admin.name} has been ${newDisabledState ? 'disabled' : 'enabled'} successfully`);
            
          } catch (cloudFunctionError) {
            console.error('Cloud Function error:', cloudFunctionError);
            
            // Fallback: Update only Firestore if Cloud Function fails
            console.log('Cloud Function failed, falling back to Firestore-only update');
            await updateDoc(adminDocRef, {
              disabled: newDisabledState,
              updatedAt: new Date().toISOString()
            });
            
            // Update local state
            setAdmins(prev => prev.map(a => 
              a.id === adminId ? { ...a, disabled: newDisabledState } : a
            ));
            
            // Log admin status change (partial)
            await logger.logAdminUpdated(admin.email, {
              disabled: { old: admin.disabled, new: newDisabledState }
            });
            
            showError(`Admin ${admin.name} was ${action}d in the system, but the Firebase account status could not be updated. This may require manual sync.`);
          }
        } else {
          // No Firebase UID found, just update Firestore
          await updateDoc(adminDocRef, {
            disabled: newDisabledState,
            updatedAt: new Date().toISOString()
          });
          
          // Update local state
          setAdmins(prev => prev.map(a => 
            a.id === adminId ? { ...a, disabled: newDisabledState } : a
          ));
          
          // Log admin status change
          await logger.logAdminUpdated(admin.email, {
            disabled: { old: admin.disabled, new: newDisabledState }
          });
          
          showSuccess(`Admin ${admin.name} has been ${action}d successfully (no Firebase account found)`);
        }
      } else {
        showError('Admin not found in database');
      }
      
    } catch (error) {
      console.error(`Error ${action}ing admin:`, error);
      showError(`Failed to ${action} admin. Please try again.`);
      
      // Log status change failure
      await logger.logSystemAction(
        'ADMIN_STATUS_CHANGE_FAILED',
        `Failed to ${action} admin: ${admin.email}. Error: ${error}`,
        'HIGH'
      );
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.admin) {
      try {
        const db = getFirestore();
        const adminId = deleteModal.admin.id;
        const adminName = deleteModal.admin.name;
        const adminEmail = deleteModal.admin.email;
        
        // First, get the admin document to get the Firebase UID
        const adminDocRef = doc(db, 'admins', adminId);
        const adminDocSnap = await getDoc(adminDocRef);
        
        if (adminDocSnap.exists()) {
          const adminData = adminDocSnap.data();
          const firebaseUID = adminData.uid;
          
          if (firebaseUID) {
            try {
              // Use Firebase Cloud Function to delete both Auth user and Firestore document
              const functions = getFunctions();
              const deleteAdminComplete = httpsCallable(functions, 'deleteAdminComplete');
              
              const result = await deleteAdminComplete({
                uid: firebaseUID,
                adminDocId: adminId
              });
              
              console.log('Cloud Function result:', result);
              
              // Remove from local state for immediate UI update
              setAdmins(prev => prev.filter(admin => admin.id !== adminId));
              
              // Log admin deletion
              await logger.logAdminDeleted(adminEmail);
              
              showSuccess(`Admin ${adminName} and their Firebase account have been completely deleted`);
              
            } catch (cloudFunctionError) {
              console.error('Cloud Function error:', cloudFunctionError);
              
              // Fallback: Delete only from Firestore if Cloud Function fails
              console.log('Cloud Function failed, falling back to Firestore-only deletion');
              await deleteDoc(adminDocRef);
              
              // Remove from local state
              setAdmins(prev => prev.filter(admin => admin.id !== adminId));
              
              // Log admin deletion (partial)
              await logger.logAdminDeleted(adminEmail);
              
              showError(`Admin ${adminName} was removed from the system, but the Firebase account could not be deleted. This may require manual cleanup.`);
            }
          } else {
            // No Firebase UID found, just delete from Firestore
            await deleteDoc(adminDocRef);
            
            // Remove from local state
            setAdmins(prev => prev.filter(admin => admin.id !== adminId));
            
            // Log admin deletion
            await logger.logAdminDeleted(adminEmail);
            
            showSuccess(`Admin ${adminName} has been deleted successfully (no Firebase account found)`);
          }
        } else {
          showError('Admin not found in database');
        }
        
      } catch (error) {
        console.error('Error deleting admin:', error);
        showError('Failed to delete admin. Please try again.');
        
        // Log deletion failure
        await logger.logSystemAction(
          'ADMIN_DELETE_FAILED',
          `Failed to delete admin: ${deleteModal.admin.email}. Error: ${error}`,
          'HIGH'
        );
      }
      
      setDeleteModal({ isOpen: false, admin: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, admin: null });
  };

  const handleSaveChanges = async () => {
    if (manageModal.admin) {
      // Log admin update with changes
      const changes = {
        status: editForm.status !== manageModal.admin.status ? { old: manageModal.admin.status, new: editForm.status } : undefined,
        role: editForm.role !== manageModal.admin.role ? { old: manageModal.admin.role, new: editForm.role } : undefined,
        permissions: editForm.permissions !== manageModal.admin.permissions ? { old: manageModal.admin.permissions, new: editForm.permissions } : undefined
      };
      
      // Only log if there are actual changes
      const hasChanges = Object.values(changes).some(change => change !== undefined);
      if (hasChanges) {
        await logger.logAdminUpdated(manageModal.admin.email, changes);
      }
      
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

  const handleAddNewAdmin = async () => {
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

    // Check if email is the super admin email
    if (addForm.email.toLowerCase() === 'admin@gmail.com') {
      showError('Cannot add admin@gmail.com as it is reserved for the super admin');
      return;
    }

    try {
      // Create Firebase user with temporary password
      const tempPassword = 'TempAdmin123!' + Math.random().toString(36).substring(7);
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        addForm.email.trim().toLowerCase(),
        tempPassword
      );

      const user = userCredential.user;
      console.log('Admin user created:', user.uid);

      // Store admin data in Firestore
      const db = getFirestore();
      const adminData = {
        uid: user.uid,
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        status: 'Active',
        role: 'Admin',
        permissions: 'User Management',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'admins'), adminData);
      console.log('Admin data stored in Firestore:', docRef.id);

      // Send password reset email so they can set their own password
      await sendPasswordResetEmail(auth, addForm.email.trim().toLowerCase());

      // Add admin to local state for immediate UI update
      const newAdmin: Admin = {
        id: docRef.id,
        name: adminData.name,
        email: adminData.email,
        status: adminData.status,
        role: adminData.role,
        lastLogin: adminData.lastLogin,
        permissions: adminData.permissions,
        disabled: false
      };
      
      setAdmins(prev => [...prev, newAdmin]);

      // Log admin creation
      await logger.logAdminCreated(adminData.email, auth.currentUser?.email || 'Unknown');

      showSuccess(`Admin ${addForm.name} created successfully! A password reset email has been sent to ${addForm.email}`);
    } catch (error: unknown) {
      console.error('Error creating admin:', error);
      
      // Handle specific Firebase errors
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        showError('An account with this email already exists');
      } else if (firebaseError.code === 'auth/weak-password') {
        showError('Password should be at least 6 characters long');
      } else if (firebaseError.code === 'auth/invalid-email') {
        showError('Please enter a valid email address');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        showError('Network error. Please check your internet connection');
      } else {
        showError('Failed to create admin account. Please try again.');
      }
      return;
    }

    // Close modal and reset form only on success
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
          <p className={`mt-1 sm:mt-2 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="hidden sm:inline">Manage administrator accounts, permissions, and system access levels</span>
            <span className="sm:hidden">Manage admin accounts & permissions</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Search Bar - Full width on mobile */}
          <div className="relative flex-1 sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-4 sm:h-5 w-4 sm:w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search administrators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border rounded-lg text-sm shadow-sm ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors`}
            />
          </div>
          
          {/* Add Admin Button */}
          <button
            onClick={handleAddAdmin}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full sm:w-auto"
            style={{ 
              backgroundColor: colors.colors.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.colors.primary}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Add Admin</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading administrators...</p>
          </div>
        </div>
      ) : (
        <>
        {/* Desktop Table - Hidden on mobile */}
        <div className={`hidden lg:block ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`hidden xl:table-cell px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ID
                </th>
                <th className={`px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  NAME
                </th>
                <th className={`px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  STATUS
                </th>
                <th className={`px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ROLE
                </th>
                <th className={`hidden xl:table-cell px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  LAST LOGIN
                </th>
                <th className={`px-4 xl:px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredAdmins.map((admin) => {
                const statusColors = getStatusColor(admin.status, admin.disabled);
                const roleColors = getRoleColor(admin.role);
                
                return (
                  <tr key={admin.id} className={`${admin.disabled ? 'opacity-50 bg-gray-50 dark:bg-gray-800' : ''} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200`}>
                    <td className={`hidden xl:table-cell px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {admin.id}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${admin.disabled ? 'opacity-50' : ''}`} style={{ backgroundColor: colors.colors.primary + '20' }}>
                            <ShieldCheckIcon className="h-5 w-5" style={{ color: admin.disabled ? '#9CA3AF' : colors.colors.primary }} />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${admin.disabled ? 'line-through' : ''} ${isDark ? 'text-white' : 'text-gray-900'} ${admin.disabled ? 'text-gray-500' : ''}`}>
                            {admin.name}
                            {admin.disabled && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Disabled
                              </span>
                            )}
                            <span className={`xl:hidden block text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                              {admin.id}
                            </span>
                          </div>
                          <div className={`text-sm ${admin.disabled ? 'line-through' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
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
                      <div className={`xl:hidden text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {formatLastLogin(admin.lastLogin)}
                      </div>
                    </td>
                    <td className={`hidden xl:table-cell px-4 xl:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatLastLogin(admin.lastLogin)}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 lg:space-x-3">
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
                        
                        {/* Disable/Enable Toggle Button */}
                        <button
                          onClick={() => handleToggleDisable(admin.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            admin.disabled
                              ? isDark 
                                ? 'text-green-400 hover:text-green-300 hover:bg-gray-600' 
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              : isDark 
                                ? 'text-orange-400 hover:text-orange-300 hover:bg-gray-600' 
                                : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                          }`}
                          title={admin.disabled ? 'Enable Admin' : 'Disable Admin'}
                        >
                          {admin.disabled ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            <NoSymbolIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Empty State - Desktop */}
        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              No administrators found
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm ? 'Try adjusting your search terms.' : 'Click "Add Admin" to create your first administrator.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Mobile Cards View - Visible only on mobile */}
      <div className="lg:hidden space-y-3">
        {filteredAdmins.map((admin) => {
          const statusColors = getStatusColor(admin.status, admin.disabled);
          const roleColors = getRoleColor(admin.role);
          
          return (
            <div key={admin.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 space-y-3 ${admin.disabled ? 'opacity-50' : ''}`}>
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${admin.disabled ? 'opacity-50' : ''}`} 
                    style={{ backgroundColor: colors.colors.primary + '20' }}>
                    <ShieldCheckIcon className="h-6 w-6" style={{ color: admin.disabled ? '#9CA3AF' : colors.colors.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${admin.disabled ? 'line-through' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {admin.name}
                      {admin.disabled && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Disabled
                        </span>
                      )}
                    </p>
                    <p className={`text-xs truncate ${admin.disabled ? 'line-through' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {admin.email}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      ID: {admin.id}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleManage(admin.id)}
                    className={`p-2 rounded-md transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Manage"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(admin.id)}
                    className={`p-2 rounded-md transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleToggleDisable(admin.id)}
                    className={`p-2 rounded-md transition-colors ${
                      admin.disabled
                        ? isDark 
                          ? 'text-green-400 hover:text-green-300 hover:bg-gray-700' 
                          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        : isDark 
                          ? 'text-orange-400 hover:text-orange-300 hover:bg-gray-700' 
                          : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                    }`}
                    title={admin.disabled ? 'Enable' : 'Disable'}
                  >
                    {admin.disabled ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <NoSymbolIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Status and Role Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
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
                </div>
                
                {/* Permissions */}
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {admin.permissions}
                </span>
              </div>
              
              {/* Last Login */}
              <div className={`pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="font-medium">Last Login:</span> {formatLastLogin(admin.lastLogin)}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Empty State - Mobile */}
        {filteredAdmins.length === 0 && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-8`}>
            <div className="text-center">
              <MagnifyingGlassIcon className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                No administrators found
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchTerm ? 'Try adjusting your search terms.' : 'Tap "Add" to create your first administrator.'}
              </p>
            </div>
          </div>
        )}
      </div>
      </>
      )}

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
