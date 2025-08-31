'use client';

import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import colors from '../../colors.json';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  customContent?: React.ReactNode;
  primaryButton?: {
    text: string;
    onClick: () => void;
    variant?: 'danger' | 'primary';
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
}

export default function Modal({
  isOpen,
  onClose,
  icon,
  title,
  description,
  customContent,
  primaryButton,
  secondaryButton = { text: 'Cancel', onClick: onClose }
}: ModalProps) {
  const { isDark } = useTheme();

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop itself, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getPrimaryButtonStyles = () => {
    if (primaryButton?.variant === 'danger') {
      return {
        backgroundColor: '#DC2626',
        color: 'white',
        hoverBackgroundColor: '#B91C1C'
      };
    }
    return {
      backgroundColor: colors.colors.primary,
      color: 'white',
      hoverBackgroundColor: '#e54d00'
    };
  };

  const buttonStyles = primaryButton ? getPrimaryButtonStyles() : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full ${customContent ? 'max-w-4xl' : 'max-w-md'} mx-auto ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } rounded-2xl border shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div className={`p-8 ${customContent ? 'text-left' : 'text-center'}`}>
          {/* Icon */}
          {icon && (
            <div className={`${customContent ? '' : 'mx-auto'} mb-6 w-16 h-16 rounded-full flex items-center justify-center bg-orange-100 ${customContent ? 'mx-auto' : ''}`}>
              <div className="text-orange-600">
                {icon}
              </div>
            </div>
          )}
          
          {/* Title */}
          <h3 className={`text-xl font-semibold mb-3 ${customContent ? 'text-center' : ''} ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          {/* Description or Custom Content */}
          {customContent ? (
            <div>
              {description && (
                <p className={`text-sm mb-6 text-center leading-relaxed ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {description}
                </p>
              )}
              <div className="mb-8">
                {customContent}
              </div>
            </div>
          ) : (
            <p className={`text-sm mb-8 leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {description}
            </p>
          )}
          
          {/* Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${!primaryButton ? 'justify-center' : ''}`}>
            {/* Secondary Button */}
            <button
              onClick={secondaryButton.onClick}
              className={`${primaryButton ? 'flex-1' : ''} px-6 py-3 text-sm font-medium rounded-lg border transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {secondaryButton.text}
            </button>
            
            {/* Primary Button - Only render if primaryButton exists */}
            {primaryButton && buttonStyles && (
              <button
                onClick={primaryButton.onClick}
                className="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: buttonStyles.backgroundColor,
                  color: buttonStyles.color
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = buttonStyles.hoverBackgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
                }}
              >
                {primaryButton.text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
