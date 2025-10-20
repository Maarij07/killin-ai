'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import colors from '../../colors.json';

// Country codes data
const countryCodes = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
];

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

export default function ContactSalesModal({ isOpen, onClose, defaultService }: ContactSalesModalProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    city: '',
    state: '',
    services: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // Default to United States
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Integrate SMTP later
    console.log('Contact Sales Form Data:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // TODO: Show success toast
      onClose();
      // Reset form
      setFormData({
        phoneNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        city: '',
        state: '',
        services: defaultService || ''
      });
    }, 1500);
  };

  // Pre-fill default service when opening or when the trigger sets it
  useEffect(() => {
    if (isOpen && defaultService) {
      setFormData(prev => ({ ...prev, services: defaultService }));
    }
  }, [isOpen, defaultService]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] rounded-xl shadow-lg transform transition-all duration-300 scale-100 flex flex-col"
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
        <div className="sticky top-0 z-10 p-6 pb-0 rounded-t-xl"
          style={{ 
            backgroundColor: 'transparent'
          }}>
          <div className={`flex items-center justify-between mb-4`}>
            <div>
              <h2 className={`text-2xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Contact Sales
              </h2>
              <p className={`mt-1 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Book a demo to see how Kallin answers every call, takes orders, and boosts revenue.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              style={{ 
                color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] 
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="h-px"
            style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200] }}
          />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto scrollbar-hide rounded-b-xl"
          style={{
            backgroundColor: 'transparent'
          }}>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {/* Country Code Dropdown */}
                  <div className="absolute inset-y-0 left-0 z-10">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className={`flex items-center px-3 py-3 border-r h-full rounded-l-lg transition-colors ${
                          isDark 
                            ? 'border-gray-500 text-gray-200 hover:bg-gray-600/20' 
                            : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-1">{selectedCountry.flag}</span>
                        <span className="mr-1 text-sm">{selectedCountry.code}</span>
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {isCountryDropdownOpen && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsCountryDropdownOpen(false)}
                          />
                          <div 
                            className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg border z-20 max-h-60 overflow-y-auto ${
                              isDark 
                                ? 'border-gray-500' 
                                : 'bg-white border-gray-300'
                            }`}
                            style={{
                              backgroundColor: isDark ? 'transparent' : 'white',
                              background: isDark 
                                ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                                : 'white'
                            }}
                          >
                            {countryCodes.map((country, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setIsCountryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 flex items-center hover:bg-opacity-80 transition-colors ${
                                  isDark 
                                    ? 'text-gray-200 hover:bg-gray-600/20' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <span className="mr-3">{country.flag}</span>
                                <span className="mr-3 font-mono text-sm">{country.code}</span>
                                <span className="text-sm">{country.country}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`block w-full pl-28 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="555-1234"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    backdropFilter: isDark ? 'blur(10px)' : 'none'
                  }}
                  placeholder="email@example.com"
                />
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    backdropFilter: isDark ? 'blur(10px)' : 'none'
                  }}
                  placeholder="Your company name"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label htmlFor="state" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="New York"
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <label htmlFor="services" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  What kind of services are you looking forward to buy? <span className="text-red-500">*</span>
                </label>
                <select
                  id="services"
                  name="services"
                  required
                  value={formData.services}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-500 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    color: isDark ? '#f3f4f6' : undefined,
                    backdropFilter: isDark ? 'blur(10px)' : 'none'
                  }}
                >
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="">Select a service...</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="AI Voice Assistant">AI Voice Assistant</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Restaurant Branding">Restaurant Branding</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Call Management System">Call Management System</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Order Processing Automation">Order Processing Automation</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Customer Service AI">Customer Service AI</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Sales Automation">Sales Automation</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Custom Integration">Custom Integration</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Starter Plan">Starter Plan</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Custom Minutes">Custom Minutes</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Enterprise Solution">Enterprise Solution</option>
                  <option className={`${isDark ? 'bg-gray-800 text-gray-100' : ''}`} value="Other">Other</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-3 border rounded-lg font-medium transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-500 text-gray-200 hover:bg-gray-600/20' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    backdropFilter: isDark ? 'blur(5px)' : 'none'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Mail'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
