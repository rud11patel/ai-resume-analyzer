import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import { useMockAuth } from '../hooks/useMockAuth';
import { TextInput } from '../components/forms/TextInput';
import { Button } from '../components/ui/Button';
import { isValidEmail } from '../utils/validators';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signup } = useMockAuth();

  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please provide a valid email format.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await signup({ name, email, password });
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 shadow-xs mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-zinc-400">
            Compare candidate resumes against real job requirements
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              id="reg-name"
              name="name"
              label="Full Name"
              type="text"
              required
              icon={User}
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              error={errors.name}
            />

            <TextInput
              id="reg-email"
              name="email"
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="alex.morgan@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              error={errors.email}
            />

            <TextInput
              id="reg-password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              icon={Lock}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              error={errors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <TextInput
              id="reg-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              required
              icon={Lock}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }
              }}
              error={errors.confirmPassword}
            />

            {errors.form && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                icon={UserPlus}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#232734] text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-zinc-200 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
