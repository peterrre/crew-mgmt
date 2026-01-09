'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AddHelperDialog from '@/components/add-helper-dialog';
import EditHelperDialog from '@/components/edit-helper-dialog';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
}

export default function HelpersManagement() {
  const router = useRouter();
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Helper | null>(null);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    try {
      const response = await fetch('/api/helpers');
      if (response.ok) {
        const data = await response.json();
        setHelpers(data?.helpers || []);
      }
    } catch (error) {
      console.error('Error fetching helpers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this helper?')) return;

    try {
      const response = await fetch(`/api/helpers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchHelpers();
      }
    } catch (error) {
      console.error('Error deleting helper:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-amber-50/80 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-sky-900">Helpers Management</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-sky-700 hover:text-sky-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-sky-900 mb-2">Crew & Volunteers</h2>
            <p className="text-sky-700">Manage your event helpers</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-amber-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Helper
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : helpers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-amber-100">
            <p className="text-sky-700">No helpers yet. Add your first helper!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {helpers.map((helper) => (
              <div
                key={helper.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-amber-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-sky-900">
                        {helper?.name || 'Unnamed'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          helper?.role === 'CREW'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {helper?.role}
                      </span>
                    </div>
                    <p className="text-sm text-sky-700">{helper?.email}</p>
                    {helper?.role === 'VOLUNTEER' && helper?.availability?.length > 0 && (
                      <p className="text-xs text-sky-600 mt-2">
                        Available: {helper.availability.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingHelper(helper)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(helper.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddDialog && (
        <AddHelperDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchHelpers();
          }}
        />
      )}

      {editingHelper && (
        <EditHelperDialog
          helper={editingHelper}
          onClose={() => setEditingHelper(null)}
          onSuccess={() => {
            setEditingHelper(null);
            fetchHelpers();
          }}
        />
      )}
    </div>
  );
}
