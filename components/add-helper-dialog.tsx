"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";

// Custom hook for form state management
function useAddHelperForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "VOLUNTEER",
    availability: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "VOLUNTEER",
      availability: "",
    });
  }, []);

  const updateFormField = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (onClose: () => void, onSuccess: () => void) => {
      e.preventDefault(); // Note: e will be passed from caller
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/helpers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            availability: formData.availability
              ? formData.availability.split(",").map((s) => s.trim())
              : [],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create helper");
          return;
        }

        onSuccess();
        resetForm();
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [formData, resetForm],
  );

  return {
    formData,
    setFormField: updateFormField,
    loading,
    error,
    handleSubmit,
    resetForm,
  };
}

interface AddHelperDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHelperDialog({
  onClose,
  onSuccess,
}: AddHelperDialogProps) {
  // Extract form logic into custom hook
  const {
    formData,
    setFormField: setFormData,
    loading,
    error,
    handleSubmit,
    _resetForm,
  } = useAddHelperForm();

  // Wrap handleSubmit to pass e and call with onClose/onSuccess
  const handleSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onClose, onSuccess);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Add Helper</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitWrapper} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData("name", e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData("email", e.target.value)}
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData("password", e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData("role", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CREW">Crew</SelectItem>
                <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "VOLUNTEER" && (
            <div className="space-y-2">
              <Label htmlFor="availability">Availability (optional)</Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData("availability", e.target.value)}
                placeholder="e.g., Weekends, Evenings"
              />
              <p className="text-xs text-muted-foreground">
                Separate with commas
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
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
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Helper"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
