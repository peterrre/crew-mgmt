"use client";

import { useState, useEffect, useCallback } from "react";
import { Role } from "@/lib/role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Check, Search } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AddEventCrewDialogProps {
  eventId: string;
  existingCrewIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

// ------------------------------------------------------------------
// Pure helpers
// ------------------------------------------------------------------


// ------------------------------------------------------------------
// Custom hooks
// ------------------------------------------------------------------


export default function AddEventCrewDialog({
  eventId,
  existingCrewIds,
  onClose,
  onSuccess,
}: AddEventCrewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/helpers");
      if (response.ok) {
        const data = await response.json();
        // Filter out users already in the crew
        const availableUsers = (data?.helpers || []).filter(
          (user: User) => !existingCrewIds.includes(user.id),
        );
        setUsers(availableUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [existingCrewIds]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setError("Please select at least one user");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Add each selected user to the event crew
      for (const userId of selectedUserIds) {
        const response = await fetch(`/api/events/${eventId}/crew`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add crew member");
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return "bg-purple/10 text-purple/20";
      case Role.CREW:
        return "bg-blue/10 text-blue/20";
      case Role.VOLUNTEER:
        return "bg-orange/10 text-orange/20";
      default:
        return "bg-gray/10 text-gray/20";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      searchTerm === "" ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-foregroundPrimary/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-md w-full shadow-2xl border max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foregroundPrimary">
            Add Crew to Event
          </h2>
          <button
            onClick={onClose}
            className="text-foregroundTertiary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 pb-3">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foregroundTertiary" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-foregroundTertiary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-foregroundTertiary">
                {users.length === 0
                  ? "All users are already assigned to this event"
                  : "No users match your search"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left flex items-center justify-between ${
                      selectedUserIds.includes(user.id)
                        ? "border-yellow bg-backgroundSecondary/20"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">
                          {user.name || "Unnamed"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-foregroundTertiary">
                        {user.email}
                      </p>
                    </div>
                    {selectedUserIds.includes(user.id) && (
                      <Check className="w-5 h-5 text-yellow" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-6 border-t border-border">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedUserIds.length === 0}
                className="flex-1 bg-backgroundSecondary0 hover:bg-yellow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedUserIds.length || ""} Crew Member${
                    selectedUserIds.length !== 1 ? "s" : ""
                  }`
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
