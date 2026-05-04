'use client';

import React from 'react';
import { useNotification } from '@/components/NotificationContext';
import Link from 'next/link';
import { Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading, error } = useNotification();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] py-8 px-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-foregroundSecondary">Laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] py-8 px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-foregroundPrimary mb-4">Fehler beim Laden der Benachrichtigungen</h2>
            <p className="text-foregroundSecondary">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foregroundPrimary">Benachrichtigungen</h1>
        <p className="text-foregroundSecondary mt-1">
          {unreadCount} ungelesene Benachrichtigung{unreadCount === 1 ? '' : 'en'}
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || loading}
          className="text-xs px-4"
        >
          Alle als gelesen markieren
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 mx-auto mb-4 text-foregroundTertiary">
            <Check className="h-5 w-5" />
          </div>
          <h2 className="text-foregroundPrimary mb-4">Keine Benachrichtigungen</h2>
          <p className="text-foregroundSecondary">
            Du hast derzeit keine Benachrichtigungen.
          </p>
          <Link href="/" className="text-blue hover:text-blue/80 mt-4 inline-block">
            Zurück zur Startseite
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => {
            const baseClasses = "flex items-start p-4 rounded-lg border border-border/50 bg-background hover:bg-backgroundSecondary transition-colors";
            const unreadClasses = notification.read ? "" : "border-blue/20 bg-blue/5";
            const classes = `${baseClasses} ${unreadClasses}`;

            return (
              <div key={notification.id} className={classes}>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-font-medium text-foregroundPrimary line-clamp-1">
                      {(notification.payload as {title?: string; body?: string})?.title ?? 'Ohne Titel'}
                    </h3>
                    {!notification.read && (
                      <Button
                        onClick={() => handleMarkAsRead(notification.id)}
                        size="icon"
                        variant="ghost"
                        className="p-1 text-foregroundTertiary hover:text-foregroundSecondary"
                        aria-label="Als gelesen markieren"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foregroundSecondary text-sm line-clamp-2">
                    {(notification.payload as {title?: string; body?: string})?.body ?? ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-foregroundTertiary">
                    <time dateTime={new Date(notification.createdAt).toISOString()}>
                      {new Date(notification.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      {new Date(notification.createdAt).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <Button
                      onClick={() => handleDelete(notification.id)}
                      size="icon"
                      variant="ghost"
                      className="p-1 text-foregroundTertiary hover:text-red/70"
                      aria-label="Benachrichtigung löschen"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}