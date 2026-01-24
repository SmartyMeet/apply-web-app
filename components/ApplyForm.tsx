'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { config, isValidFileType, isValidFileSize } from '@/lib/config';
import { TranslationDict, t } from '@/i18n';
import { Theme } from '@/lib/theme';

interface ApplyFormProps {
  tenant: string;
  language: string;
  translations: TranslationDict;
  theme: Theme;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  cv?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  cv: File | null;
}

export function ApplyForm({ tenant, language, translations, theme }: ApplyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    cv: null,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}$/.test(phone.replace(/\s/g, ''));
  };

  const validateField = useCallback((field: keyof FormData, value: string | File | null): string | undefined => {
    switch (field) {
      case 'name':
        return !(value as string)?.trim() ? t(translations, 'validation.required') : undefined;
      case 'email':
        if (!(value as string)?.trim()) return t(translations, 'validation.required');
        if (!validateEmail(value as string)) return t(translations, 'validation.invalidEmail');
        return undefined;
      case 'phone':
        if (!(value as string)?.trim()) return t(translations, 'validation.required');
        if (!validatePhone(value as string)) return t(translations, 'validation.invalidPhone');
        return undefined;
      case 'cv':
        if (!value) return t(translations, 'validation.fileRequired');
        if (!isValidFileSize(value as File)) return t(translations, 'validation.fileTooLarge');
        if (!isValidFileType(value as File)) return t(translations, 'validation.fileInvalidType');
        return undefined;
      default:
        return undefined;
    }
  }, [translations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, cv: file }));
    
    if (file) {
      const error = validateField('cv', file);
      setErrors(prev => ({ ...prev, cv: error }));
    } else {
      setErrors(prev => ({ ...prev, cv: undefined }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      cv: validateField('cv', formData.cv),
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('tenant', tenant);
      submitData.append('language', language);
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      if (formData.cv) {
        submitData.append('cv', formData.cv);
      }
      
      const response = await fetch('/api/runs', {
        method: 'POST',
        body: submitData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Submit failed');
      }
      
      // Navigate to thank you page with reference ID if available
      const thankYouPath = tenant === config.defaultTenant 
        ? '/thank-you' 
        : `/${tenant}/thank-you`;
      
      const params = new URLSearchParams();
      if (result.referenceId) {
        params.set('ref', result.referenceId);
      }
      
      const queryString = params.toString();
      router.push(queryString ? `${thankYouPath}?${queryString}` : thankYouPath);
      
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(t(translations, 'errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Full Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {t(translations, 'form.fullName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={t(translations, 'form.fullNamePlaceholder')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t(translations, 'form.email')} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={t(translations, 'form.emailPlaceholder')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          {t(translations, 'form.phone')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={t(translations, 'form.phonePlaceholder')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      {/* CV Upload */}
      <div>
        <label htmlFor="cv" className="block text-sm font-medium text-gray-700 mb-1">
          {t(translations, 'form.cv')} <span className="text-red-500">*</span>
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full p-6 border-2 border-dashed rounded-lg cursor-pointer
                     transition-colors text-center
                     ${isDragging ? 'border-blue-500 bg-blue-50' : ''}
                     ${errors.cv ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
                     ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="cv"
            name="cv"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            disabled={isSubmitting}
            className="sr-only"
            aria-invalid={!!errors.cv}
            aria-describedby={errors.cv ? 'cv-error' : 'cv-hint'}
          />
          
          {formData.cv ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700 font-medium">{formData.cv.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  {t(translations, 'form.cvBrowse')}
                </span>{' '}
                {t(translations, 'form.cvDragDrop')}
              </p>
              <p id="cv-hint" className="mt-1 text-xs text-gray-500">
                {t(translations, 'form.cvPlaceholder')}
              </p>
            </div>
          )}
        </div>
        {errors.cv && (
          <p id="cv-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.cv}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{ 
          backgroundColor: isSubmitting ? undefined : theme.primaryColor,
          borderRadius: theme.buttonRadius 
        }}
        className={`w-full py-3 px-6 text-white font-medium transition-all
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   ${isSubmitting 
                     ? 'bg-gray-400 cursor-not-allowed' 
                     : 'hover:opacity-90 active:scale-[0.98]'}`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t(translations, 'form.submitting')}
          </span>
        ) : (
          t(translations, 'form.submit')
        )}
      </button>
    </form>
  );
}
