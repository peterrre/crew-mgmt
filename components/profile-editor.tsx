'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, User, Mail, Shield, Save } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ProfileEditor() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user?.name) {
      setFormData((prev) => ({ ...prev, name: session.user?.name || '' }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = {};
      if (formData.name) {
        updateData.name = formData.name;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      const userId = (session?.user as any)?.id;
      const response = await fetch(`/api/helpers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      await update();
      setSuccess('Profile updated successfully');
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const userRole = (session?.user as any)?.role;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="sticky top-0 z-50 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-sky-900 dark:text-white mb-2">Edit Profile</h2>
          <p className="text-sky-700 dark:text-slate-400">Update your personal information</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-100 dark:border-slate-700 p-8">
          <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-amber-400 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{session?.user?.name || 'User'}</h3>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400">
                <Mail className="w-4 h-4" />
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 mt-1">
                <Shield className="w-4 h-4" />
                <span className="capitalize">{userRole?.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-slate-200">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-slate-500">Email cannot be changed</p>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-slate-200">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    minLength={6}
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="dark:text-slate-200">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    minLength={6}
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg">{error}</div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-lg">{success}</div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}