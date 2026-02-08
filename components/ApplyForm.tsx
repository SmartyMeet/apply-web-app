'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { config, SupportedLanguage, isValidFileType, isValidFileSize } from '@/lib/config';
import { Translations } from '@/i18n';
import { Theme } from '@/lib/theme';
import { uploadCvToS3 } from '@/lib/uploadCv';
import { UrlTrackingData } from './ApplyPage';

interface ApplyFormProps {
  tenant: string;
  language: SupportedLanguage;
  translations: Translations;
  theme: Theme;
  trackingData: UrlTrackingData | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  cv: File | null;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  cv?: string;
}

export function ApplyForm({ tenant, language, translations, theme, trackingData }: ApplyFormProps) {
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return phone.length >= 7 && phoneRegex.test(phone);
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = translations.validation.required;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = translations.validation.required;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = translations.validation.invalidEmail;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = translations.validation.required;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = translations.validation.invalidPhone;
    }
    
    if (!formData.cv) {
      newErrors.cv = translations.validation.fileRequired;
    } else if (!isValidFileType(formData.cv)) {
      newErrors.cv = translations.validation.fileInvalidType;
    } else if (!isValidFileSize(formData.cv)) {
      newErrors.cv = translations.validation.fileTooLarge;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleFileChange = (file: File | null) => {
    if (file) {
      if (!isValidFileType(file)) {
        setErrors(prev => ({ ...prev, cv: translations.validation.fileInvalidType }));
        return;
      }
      if (!isValidFileSize(file)) {
        setErrors(prev => ({ ...prev, cv: translations.validation.fileTooLarge }));
        return;
      }
      setErrors(prev => ({ ...prev, cv: undefined }));
    }
    setFormData(prev => ({ ...prev, cv: file }));
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload CV to S3 client-side first
      let cvUrl = '';
      if (formData.cv) {
        cvUrl = await uploadCvToS3(tenant, formData.cv);
      }

      const formPayload = new FormData();
      formPayload.append('tenant', tenant);
      formPayload.append('language', language);
      formPayload.append('name', formData.name);
      formPayload.append('email', formData.email);
      formPayload.append('phone', formData.phone);
      formPayload.append('sourceUrl', window.location.href);
      formPayload.append('cvUrl', cvUrl);
      if (trackingData) {
        formPayload.append('referrer', trackingData.referrer);
        formPayload.append('landingUrl', trackingData.landingUrl);
        formPayload.append('urlParams', JSON.stringify(trackingData.params));
      }
      
      const response = await fetch('/api/runs', {
        method: 'POST',
        body: formPayload,
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      const basePath = tenant === config.defaultTenant ? '' : `/${tenant}`;
      router.push(`${basePath}/thank-you`);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(translations.errors.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {translations.form.fullName} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={translations.form.fullNamePlaceholder}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>
      
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {translations.form.email} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder={translations.form.emailPlaceholder}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>
      
      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          {translations.form.phone} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder={translations.form.phonePlaceholder}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>
      
      {/* CV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {translations.form.cv} <span className="text-red-500">*</span>
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 
            errors.cv ? 'border-red-500' : 'border-gray-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {formData.cv ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">{formData.cv.name}</span>
              <button
                type="button"
                onClick={() => handleFileChange(null)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg className="mx-auto w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-1">
                {translations.form.cvDragDrop}{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {translations.form.cvBrowse}
                </button>
              </p>
              <p className="text-sm text-gray-500">{translations.form.cvPlaceholder}</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            aria-describedby={errors.cv ? 'cv-error' : undefined}
          />
        </div>
        {errors.cv && (
          <p id="cv-error" className="mt-1 text-sm text-red-500">{errors.cv}</p>
        )}
      </div>
      
      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{submitError}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: theme.primaryColor,
          borderRadius: theme.buttonRadius 
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {translations.form.submitting}
          </span>
        ) : (
          translations.form.submit
        )}
      </button>
    </form>
  );
}