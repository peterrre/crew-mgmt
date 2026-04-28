'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import AddEventCrewDialog from '@/components/add-event-crew-dialog';
import { useEventData } from '@/contexts/event-data-context';

// Helper function for role badge colors (extracted for testability)
const getRoleBadgeColor = (role: string): string => {
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

// Helper function for filtering crew (extracted for testability)
const filterCrew = (
  crew: any[],
  searchTerm: string,
  selectedRole: string
) => {
  return crew.filter(member => {
    const matchesSearch = searchTerm === '' ||
      member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
};

// Custom hook for UI state management
function useEventCrewUIState() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  return {
    showAddDialog,
    setShowAddDialog,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole
  };
}

// Custom hook for async actions
function useEventCrewActions(
  eventId: string,
  refreshCrew: () => Promise<void>
) {
  const handleRemove = useCallback(
    async (userId: string) => {
      if (!confirm('Are you sure you want to remove this crew member from the event?')) return;

      try {
        const response = await fetch(`/api/events/${eventId}/crew/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await refreshCrew();
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to remove crew member');
        }
      } catch (error) {
        console.error('Error removing crew member:', error);
      }
    },
    [eventId, refreshCrew]
  );

  return { handleRemove };
}

interface EventCrewManagementProps {
  eventId: string;
}

export default function EventCrewManagement({ eventId }: EventCrewManagementProps) {
  const { crew, crewLoading, refreshCrew } = useEventData();

  // Extract state management
  const {
    showAddDialog,
    setShowAddDialog,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole
  } = useEventCrewUIState();

  // Extract action handlers
  const { handleRemove } = useEventCrewActions(eventId, refreshCrew);

  // Extract filtering logic
  const filteredCrew = filterCrew(crew, searchTerm, selectedRole);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-lg font-semibold text-sky-900 dark:text-white">
            Event Crew ({crew.length})
          </h3>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-amber-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Crew
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

      {crewLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCrew.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-amber-100 dark:border-slate-700">
          <Users className="w-12 h-12 mx-auto mb-4 text-sky-300 dark:text-slate-600" />
          <p className="text-sky-700 dark:text-slate-400">
            {crew.length === 0 ? 'No crew assigned yet. Add your first crew member!' : 'No crew members match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCrew.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-semibold text-sky-900 dark:text-white">
                      {member.user.name || 'Unnamed'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.user.role)}`}>
                      {member.user.role}
                    </span>
                  </div>
                  <p className="text-sm text-sky-700 dark:text-slate-400">{member.user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(member.userId)}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddDialog && (
        <AddEventCrewDialog
          eventId={eventId}
          existingCrewIds={crew.map(c => c.userId)}
          onClose={() => setShowAddDialog(false)}
          onSuccess={async () => {
            setShowAddDialog(false);
            await refreshCrew();
          }}
        />
      )}
    </div>
  );
}
