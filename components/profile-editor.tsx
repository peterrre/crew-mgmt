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
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-blue hover:text-foregroundPrimary">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main aria-label="Profile editor" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foregroundPrimary mb-2">Edit Profile</h2>
          <p className="text-blue">Update your personal information</p>
        </div>

        <div className="bg-background rounded-2xl shadow-lg border border-border p-8">
          <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-blue to-yellow rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foregroundPrimary">{session?.user?.name || 'User'}</h3>
              <div className="flex items-center space-x-2 text-foregroundTertiary">
                <Mail className="w-4 h-4" />
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-foregroundTertiary mt-1">
                <Shield className="w-4 h-4" />
                <span className="capitalize">{userRole?.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="dark:bg-backgroundTertiary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="">Email</Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="bg-backgroundSecondary"
              />
              <p className="text-xs text-foregroundTertiary">Email cannot be changed</p>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-lg font-medium text-foregroundPrimary mb-4">Change Password</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    minLength={6}
                    className="dark:bg-backgroundTertiary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    minLength={6}
                    className="dark:bg-backgroundTertiary"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red bg-red/10 p-3 rounded-lg">{error}</div>
            )}

            {success && (
              <div className="text-sm text-green bg-green/10 p-3 rounded-lg">{success}</div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-backgroundSecondary hover:bg-yellow"
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