'use client';

import React from 'react';

interface ShiftCommentBoxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function ShiftCommentBox({
  value = '',
  onChange,
  placeholder = 'Kommentar hinzufügen...',
  maxLength = 500,
  disabled = false,
}: ShiftCommentBoxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="shift-comment" className="text-xs font-medium text-foregroundPrimary">
        Kommentar
      </label>
      <div className="relative">
        <textarea
          id="shift-comment"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full min-h-[80px] resize-none px-4 py-3 rounded-md border border-border/50 bg-backgroundSecondary text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-blue focus:ring-offset-0 disabled:bg-backgroundTertiary disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
          aria-describedby="shift-comment-help"
        />
        {!disabled && (
          <p className="text-xs text-foregroundTertiary text-right" id="shift-comment-help">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}