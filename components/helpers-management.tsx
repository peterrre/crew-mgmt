'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, LogOut, Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AddHelperDialog from '@/components/add-helper-dialog';
import EditHelperDialog from '@/components/edit-helper-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';
import { themeConfig } from '@/lib/theme-config';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { toastHelperDeleted, toastGenericError } from '@/lib/toast-helpers';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
  availabilitySlots: any[];
}

export default function HelpersManagement() {
  const router = useRouter();
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Helper | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { toast } = useToast();

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
    const helper = helpers.find(h => h.id === id);
    const confirmed = await confirm({
      title: 'Delete Helper',
      description: `Are you sure you want to delete ${helper?.name || helper?.email}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });

    if (!confirmed) return;

    // Store original state for rollback
    const originalHelpers = [...helpers];

    // Optimistic update: immediately remove from list
    setHelpers((prev) => prev.filter((h) => h.id !== id));

    try {
      const response = await fetch(`/api/helpers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toastHelperDeleted(helper?.name || helper?.email || 'User');
        // Fetch fresh data to ensure sync
        fetchHelpers();
      } else {
        // Rollback on error
        setHelpers(originalHelpers);
        const data = await response.json();
        toastGenericError(data.error || 'Failed to delete helper');
      }
    } catch (error) {
      // Rollback on error
      setHelpers(originalHelpers);
      console.error('Error deleting helper:', error);
      toastGenericError('An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'CREW':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300';
      case 'VOLUNTEER':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredHelpers = helpers.filter(helper => {
    const matchesSearch = searchTerm === '' ||
      helper.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      helper.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || helper.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="dark:text-slate-300 dark:hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className={`w-10 h-10 ${themeConfig.backgrounds.logo} rounded-xl flex items-center justify-center`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Helpers Management</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Crew & Volunteers</h2>
            <p className="text-muted-foreground">Manage your event helpers</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Helper
          </Button>
        </div>

        <div className="flex space-x-4 mb-6">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="CREW">Crew</SelectItem>
              <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredHelpers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={helpers.length === 0 ? 'No helpers yet' : 'No matching helpers'}
            description={
              helpers.length === 0
                ? 'Get started by adding your first crew member or volunteer. They\'ll appear here once added.'
                : 'No helpers match your search criteria. Try adjusting your filters or search term.'
            }
            action={
              helpers.length === 0
                ? {
                    label: 'Add Helper',
                    onClick: () => setShowAddDialog(true),
                  }
                : undefined
            }
            secondaryAction={
              helpers.length > 0
                ? {
                    label: 'Clear Filters',
                    onClick: () => {
                      setSearchTerm('');
                      setSelectedRole('all');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredHelpers.map((helper) => (
              <div
                key={helper.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {helper?.name || 'Unnamed'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(helper?.role)}`}>
                        {helper?.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{helper?.email}</p>
                    {helper?.role === 'VOLUNTEER' && (
                      <>
                        {helper?.availabilitySlots?.length > 0 ? (
                          <p className="text-xs text-muted-foreground mt-2">
                            Available times: {helper.availabilitySlots.map((slot: any) =>
                              `${new Date(slot.start).toLocaleDateString()} ${new Date(slot.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(slot.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                            ).join(', ')}
                          </p>
                        ) : helper?.availability?.length > 0 ? (
                          <p className="text-xs text-muted-foreground mt-2">
                            Available: {helper.availability.join(', ')}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingHelper(helper)}
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(helper.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30"
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

      <ConfirmDialog />
    </div>
  );
}
