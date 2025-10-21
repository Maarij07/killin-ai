'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, CloudArrowUpIcon, PencilSquareIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import colors from '../../colors.json';

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'menu' | 'specials';
  userId?: string;
}

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  isProcessing: boolean;
  processedText?: string;
  error?: string;
}

export default function EditMenuModal({ isOpen, onClose, mode, userId }: EditMenuModalProps) {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [editMode, setEditMode] = useState<'upload' | 'text' | 'imageUpload' | null>(null);
  const [menuText, setMenuText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = 'https://server.kallin.ai';

  // Fetch existing menu/specials content when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchExistingContent();
    }
  }, [isOpen, userId, mode]);

  const fetchExistingContent = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/menu/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Fetched existing content:', responseData);
        
        // Extract the actual data from the response
        const data = responseData?.data || responseData;
        
        // Set the appropriate content based on mode
        if (mode === 'menu' && data.menu_text) {
          setMenuText(data.menu_text);
        } else if (mode === 'specials' && data.specials_text) {
          setMenuText(data.specials_text);
        }
      } else {
        console.error('❌ Failed to fetch existing content:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching existing content:', error);
    }
  };

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
      
      const response = await fetch(`${API_BASE_URL}/api/upload/menu-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image processing successful:', data);
        
        // Extract menu items from API response - updated for new API structure
        let extractedMenuItems = '';
        if (data.menu_text) {
          extractedMenuItems = data.menu_text;
        } else if (data.menu_items) {
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

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showError(`File ${file.name} is not a valid image file`);
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} size must be less than 10MB`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl,
        isProcessing: false
      });
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      showSuccess(`${newImages.length} image(s) added for upload`);
    }

    // Reset file input
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const processAllImages = async () => {
    if (uploadedImages.length === 0) {
      showError('Please add at least one image');
      return;
    }

    // Update all images to processing state
    setUploadedImages(prev => prev.map(img => ({ ...img, isProcessing: true })));
    setIsProcessing(true);
    
    try {
      let allExtractedText = '';
      let hasErrors = false;
      
      // Process each image individually
      for (const image of uploadedImages) {
        try {
          const formData = new FormData();
          formData.append('menu_image', image.file);
          
          const response = await fetch(`${API_BASE_URL}/api/upload/menu-image`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json'
            },
            body: formData
          });
          
          if (response.ok) {
            const responseData = await response.json();
            console.log(`✅ Image ${image.file.name} processing successful:`, responseData);
            
            // Extract the actual data from the response
            const data = responseData?.data || responseData;
            
            // Handle different response formats
            let extractedMenuItems = '';
            if (data.menu_text) {
              extractedMenuItems = data.menu_text;
            } else if (data.menu_items) {
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
            
            // Check if menu_text is specifically "No." - this indicates an error
            if (data.menu_text === "No." || data.menu_text === "No") {
              setUploadedImages(prev => prev.map(img => 
                img.id === image.id ? { ...img, isProcessing: false, error: 'No menu items could be extracted' } : img
              ));
              hasErrors = true;
              continue;
            }
            
            // Update image with processed text
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id ? { ...img, isProcessing: false, processedText: extractedMenuItems } : img
            ));
            
            if (extractedMenuItems) {
              allExtractedText += extractedMenuItems + '\n\n';
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`❌ Image ${image.file.name} processing failed:`, response.status, errorData);
            
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id ? { 
                ...img, 
                isProcessing: false, 
                error: errorData.message || errorData.error || 'Processing failed' 
              } : img
            ));
            hasErrors = true;
          }
        } catch (error) {
          console.error(`❌ Error processing image ${image.file.name}:`, error);
          
          setUploadedImages(prev => prev.map(img => 
            img.id === image.id ? { 
              ...img, 
              isProcessing: false, 
              error: error instanceof Error ? error.message : 'Network error' 
            } : img
          ));
          hasErrors = true;
        }
      }
      
      // Set the combined extracted text to the menu text
      if (allExtractedText) {
        setMenuText(prev => prev ? prev + '\n\n' + allExtractedText : allExtractedText);
        
        // Automatically call edit_menu API since we have valid content
        await autoSaveMenuContent(allExtractedText);
        
        // Show appropriate success message based on mode
        const successMessage = mode === 'menu' ? 'Menu items added' : 'Specials added';
        showSuccess(successMessage);
        
        // Close the modal after successful processing
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else if (!hasErrors) {
        // Only show error if there were no individual errors but also no content
        showError('No menu items could be extracted from any images');
      } else {
        showError('Some images failed to process. Check individual results.');
      }
    } catch (error) {
      console.error('❌ Error processing images:', error);
      showError('Error processing images');
    } finally {
      setIsProcessing(false);
    }
  };

  // New function to automatically save menu content after image processing
  const autoSaveMenuContent = async (content: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const menuType = mode === 'menu' ? 'default' : 'specials';
      
      // Log the API call details for testing
      console.log('🔧 Auto-calling edit_menu API after image processing:', {
        url: `${API_BASE_URL}/edit_menu`,
        payload: {
          user_id: userId,
          menu_type: menuType,
          new_content: content
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'}`  
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/edit_menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          menu_type: menuType,
          new_content: content
        })
      });
      
      if (response.ok) {
        console.log('✅ Auto edit_menu API call successful');
        
        // Wait 1 second then trigger a refresh of the menu/specials display
        setTimeout(() => {
          console.log('🔄 Triggering menu/specials refresh after 1 second delay');
          // Dispatch a custom event that the parent component can listen to
          window.dispatchEvent(new CustomEvent('menuContentUpdated', {
            detail: {
              mode: mode,
              timestamp: Date.now()
            }
          }));
        }, 1000);
        
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Auto edit_menu API call failed:', response.status, errorData);
        showError(`Failed to auto-save: ${errorData.message || errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('❌ Error in auto-saving:', error);
      showError(`Failed to auto-save: ${error instanceof Error ? error.message : 'Network error'}`);
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
      const menuType = mode === 'menu' ? 'default' : 'specials';
      
      // Log the API call details for testing
      console.log('🔧 Calling edit_menu API:', {
        url: `${API_BASE_URL}/edit_menu`,
        payload: {
          user_id: userId,
          menu_type: menuType,
          new_content: menuText
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'}`  
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/edit_menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          menu_type: menuType,
          new_content: menuText
        })
      });
      
      if (response.ok) {
        console.log('✅ edit_menu API call successful');
        
        // Wait 1 second then trigger a refresh of the menu/specials display
        setTimeout(() => {
          console.log('🔄 Triggering menu/specials refresh after 1 second delay');
          // Dispatch a custom event that the parent component can listen to
          window.dispatchEvent(new CustomEvent('menuContentUpdated', {
            detail: {
              mode: mode,
              timestamp: Date.now()
            }
          }));
        }, 1000);
        
        showSuccess(`${mode === 'menu' ? 'Menu' : 'Daily specials'} updated successfully!`);
        handleClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ edit_menu API call failed:', response.status, errorData);
        showError(`Failed to update: ${errorData.message || errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('❌ Error updating:', error);
      showError(`Failed to update: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
    uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.previewUrl);
    });
    
    setEditMode(null);
    setMenuText('');
    setUploadedImages([]);
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
              {/* Upload Multiple Images Option */}
              <button
                onClick={() => setEditMode('imageUpload')}
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
                    <PhotoIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" 
                    style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                    Upload Images
                  </h3>
                  <p className="text-sm" 
                    style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                    Upload multiple menu images at once
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

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMultiFileSelect}
                multiple
                className="hidden"
              />
            </div>
          ) : editMode === 'imageUpload' ? (
            // Image Upload Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                  Upload Menu Images
                </h3>
                <button
                  onClick={() => multiFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: colors.colors.primary,
                    color: 'white'
                  }}
                >
                  Add Images
                </button>
              </div>
              
              {uploadedImages.length > 0 ? (
                <div className="space-y-3">
                  {uploadedImages.map((image) => (
                    <div 
                      key={image.id}
                      className="flex items-center p-3 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(42, 42, 42, 0.5)' : colors.colors.white,
                        border: isDark ? '1px solid #4a5568' : '1px solid #cbd5e0'
                      }}
                    >
                      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                        <img 
                          src={image.previewUrl} 
                          alt={image.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                          {image.file.name}
                        </p>
                        <p className="text-xs" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          {(image.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {image.isProcessing && (
                          <p className="text-xs text-yellow-500">Processing...</p>
                        )}
                        {image.processedText && (
                          <p className="text-xs text-green-500">Processed successfully</p>
                        )}
                        {image.error && (
                          <p className="text-xs text-red-500">Error: {image.error}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        disabled={image.isProcessing}
                      >
                        <XMarkIcon className="w-5 h-5" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditMode(null);
                        setUploadedImages([]);
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
                      onClick={processAllImages}
                      disabled={isProcessing || uploadedImages.some(img => img.isProcessing)}
                      className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      style={{ backgroundColor: colors.colors.primary }}
                    >
                      {isProcessing ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Process All Images'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary-500"
                  style={{ 
                    borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300],
                    color: isDark ? colors.colors.grey[400] : colors.colors.grey[600]
                  }}
                  onClick={() => multiFileInputRef.current?.click()}
                >
                  <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No images selected</p>
                  <p className="text-sm mb-4">Click to add images or drag and drop</p>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: colors.colors.primary,
                      color: 'white'
                    }}
                  >
                    Select Images
                  </button>
                </div>
              )}
              
              {/* Hidden file input */}
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMultiFileSelect}
                multiple
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