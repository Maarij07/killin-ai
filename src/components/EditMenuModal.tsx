'use client';

import { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, CloudArrowUpIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import colors from '../../colors.json';

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'menu' | 'specials';
  userId?: string;
}

export default function EditMenuModal({ isOpen, onClose, mode, userId }: EditMenuModalProps) {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [editMode, setEditMode] = useState<'upload' | 'text' | null>(null);
  const [menuText, setMenuText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : 'https://server.kallin.ai/api';

  const modalTitle = mode === 'menu' ? 'Edit Menu' : 'Edit Daily Specials';
  const placeholder = mode === 'menu' 
    ? 'Enter your menu items here...\n\nExample:\nMargherita Pizza - $12.99\nCaesar Salad - $8.99\nPasta Carbonara - $14.99'
    : 'Enter your daily specials here...\n\nExample:\nToday\'s Special: Grilled Salmon - $18.99\nSoup of the Day: Tomato Basil - $6.99';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('Image size must be less than 10MB');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('menu_image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload/menu-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image processing successful:', data);
        
        // Extract menu items from API response
        let extractedMenuItems = '';
        if (data.menu_items) {
          if (typeof data.menu_items === 'string') {
            extractedMenuItems = data.menu_items;
          } else if (Array.isArray(data.menu_items)) {
            extractedMenuItems = data.menu_items.join('\n');
          } else if (data.menu_items.items) {
            extractedMenuItems = Array.isArray(data.menu_items.items) 
              ? data.menu_items.items.join('\n')
              : data.menu_items.items.toString();
          }
        } else if (data.items) {
          extractedMenuItems = Array.isArray(data.items) 
            ? data.items.join('\n')
            : data.items.toString();
        } else if (data.extracted_text) {
          extractedMenuItems = data.extracted_text;
        }
        
        if (extractedMenuItems) {
          setMenuText(extractedMenuItems);
          setEditMode('text'); // Switch to text mode to show extracted content
          showSuccess('Menu items extracted successfully! You can now review and edit.');
        } else {
          showError('No menu items could be extracted from the image. Please try again or enter manually.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Image processing failed:', response.status, errorData);
        showError(`Failed to process image: ${errorData.message || errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('❌ Error processing image:', error);
      showError(`Failed to process image: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!menuText.trim()) {
      showError('Please enter some content');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = mode === 'menu' ? '/update-menu' : '/update-specials';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          [mode === 'menu' ? 'menu_text' : 'specials_text']: menuText
        })
      });
      
      if (response.ok) {
        showSuccess(`${mode === 'menu' ? 'Menu' : 'Daily specials'} updated successfully!`);
        handleClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showError(`Failed to update: ${errorData.message || errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Error updating:', error);
      showError(`Failed to update: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEditMode(null);
    setMenuText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'
    }}>
      <div 
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'transparent',
          background: isDark 
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
          border: isDark
            ? `2px solid #4a5568`
            : `2px solid #cbd5e0`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200] }}>
          <h2 className="text-2xl font-bold" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            {modalTitle}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!editMode ? (
            // Selection Mode
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upload Image Option */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="relative rounded-xl p-8 text-center transition-all duration-300 hover:scale-[1.02] group"
                style={{
                  backgroundColor: 'transparent',
                  background: isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                  border: isDark
                    ? `2px solid #4a5568`
                    : `2px solid #cbd5e0`,
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <div className="flex flex-col items-center">
                  {isProcessing ? (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${colors.colors.primary}20` }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                        style={{ borderColor: colors.colors.primary }}></div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: colors.colors.primary }}>
                      <CloudArrowUpIcon className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2" 
                    style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                    {isProcessing ? 'Processing...' : 'Upload Image'}
                  </h3>
                  <p className="text-sm" 
                    style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                    {isProcessing ? 'Extracting menu items...' : 'AI will extract menu items from your image'}
                  </p>
                </div>
              </button>

              {/* Manual Text Option */}
              <button
                onClick={() => setEditMode('text')}
                disabled={isProcessing}
                className="relative rounded-xl p-8 text-center transition-all duration-300 hover:scale-[1.02] group"
                style={{
                  backgroundColor: 'transparent',
                  background: isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                  border: isDark
                    ? `2px solid #4a5568`
                    : `2px solid #cbd5e0`,
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: colors.colors.primary }}>
                    <PencilSquareIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" 
                    style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                    Type Manually
                  </h3>
                  <p className="text-sm" 
                    style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                    Enter your menu items by typing
                  </p>
                </div>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            // Text Edit Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" 
                  style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}>
                  {mode === 'menu' ? 'Menu Items' : 'Daily Specials'}
                </label>
                <textarea
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder={placeholder}
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                  style={{
                    backgroundColor: isDark ? 'rgba(42, 42, 42, 0.5)' : colors.colors.white,
                    borderColor: isDark ? '#4a5568' : colors.colors.grey[300],
                    color: isDark ? colors.colors.white : colors.colors.dark
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditMode(null);
                    setMenuText('');
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200],
                    color: isDark ? colors.colors.grey[300] : colors.colors.grey[700]
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !menuText.trim()}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
