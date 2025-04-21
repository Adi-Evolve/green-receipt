"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  gstNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const RegistrationForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    gstNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number should be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    
    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Please enter a valid GST number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3 || !validateStep3()) return;
    setIsLoading(true);
    try {
      // 1. Create Supabase Auth user (optional, only if using Supabase Auth)
      // const { user, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
      // if (authError) throw authError;

      // 2. Generate unique 6-digit user_code (robust)
      let user_code;
      let tries = 0;
      const forbiddenCodes = new Set(['123456', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999']);
      while (tries < 100) {
        user_code = Math.floor(100000 + Math.random() * 900000).toString();
        if (forbiddenCodes.has(user_code)) {
          tries++;
          continue;
        }
        const { data } = await supabase.from('users').select('id').eq('user_code', user_code);
        if (!data || data.length === 0) break;
        tries++;
      }
      if (tries >= 100) throw new Error('Could not generate a unique user code. Please try again.');

      // 3. Save profile to users table
      const { error: userError } = await supabase.from('users').insert([
        {
          user_code,
          email: formData.email,
          name: formData.businessName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          gst_number: formData.gstNumber,
          owner_name: formData.ownerName
        }
      ]);
      if (userError) throw userError;

      // 4. Store user_code in localStorage for use throughout the app
      localStorage.setItem('user_code', user_code || '');

      // 5. Redirect or update UI as needed
      alert(`Registration successful! Your unique code is: ${user_code}`);
      router.push('/profile');
    } catch (err: any) {
      alert('Registration failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white px-4 py-8 shadow rounded-lg sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
            
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <div className="mt-1">
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`input-field ${errors.businessName ? 'border-red-500' : ''}`}
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Owner Name
              </label>
              <div className="mt-1">
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  className={`input-field ${errors.ownerName ? 'border-red-500' : ''}`}
                />
                {errors.ownerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Business Address & GST Details</h3>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <div className="mt-1">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <div className="mt-1">
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className={`input-field ${errors.state ? 'border-red-500' : ''}`}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <div className="mt-1">
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
                  />
                  {errors.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <div className="mt-1">
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    required
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className={`input-field ${errors.gstNumber ? 'border-red-500' : ''}`}
                  />
                  {errors.gstNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.gstNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Account Setup</h3>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms and Conditions
                  </Link>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">
                Step {step} of 3
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;