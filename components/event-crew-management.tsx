'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import AddEventCrewDialog from '@/components/add-event-crew-dialog';
import { useEventData } from '@/contexts/event-data-context';
import { Role } from '@/lib/role';

// Helper function for role badge colors (extracted for testability)
const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case Role.ADMIN:
      return 'bg-purple/10 text-purple';
    case Role.CREW:
      return 'bg-blue/10 text-blue';
    case Role.VOLUNTEER:
      return 'bg-amber/10 text-amber';
    default:
      return 'bg-gray/10 text-gray';
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
          <Users className="w-5 h-5 text-blue dark:text-blueForeground" />
          <h3 className="text-lg font-semibold text-foregroundPrimary dark:text-foregroundPrimary">
            Event Crew ({crew.length})
          </h3>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-amber hover:bg-orange"
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
            <SelectItem value={Role.ADMIN}>Admin</SelectItem>
            <SelectItem value={Role.CREW}>Crew</SelectItem>
            <SelectItem value={Role.VOLUNTEER}>Volunteer</SelectItem>
          </SelectContent>
        </Select>
      </div>

{crewLoading ? (
  <div className="text-center py-12">
    <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
) : filteredCrew.length === 0 ? (
  <div className="bg-background dark:bg-backgroundSecondary rounded-2xl p-12 text-center border border-border dark:border-borderLight">
    <Users className="w-12 h-12 mx-auto mb-4 text-foregroundSecondary dark:text-foregroundTertiary" />
    <p className="text-foregroundSecondary dark:text-foregroundTertiary">
      {crew.length === 0 ? 'No crew assigned yet. Add your first crew member!' : 'No crew members match your search criteria.'}
    </p>
  </div>
) : (
      <div className="grid grid-cols-1 gap-4">
        {filteredCrew.map((member) => (
          <div
            key={member.id}
            className="bg-background dark:bg-backgroundSecondary rounded-xl p-4 border border-border dark:border-borderLight hover:border-borderLight dark:hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h4 className="font-semibold text-foregroundPrimary dark:text-foregroundPrimary">
                    {member.user.name || 'Unnamed'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.user.role)}`}>
                    {member.user.role}
                  </span>
                </div>
                <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary">{member.user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(member.userId)}
                className="text-red/50 border-red/20 hover:bg-red/50 dark:text-red/50 dark:border-red/30 dark:hover:bg-red/50"
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