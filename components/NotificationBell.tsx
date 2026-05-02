'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from './NotificationContext';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotification();

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 p-2 rounded hover:bg-backgroundSecondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-4 w-4 text-foregroundPrimary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red text-redForeground text-xs font-medium">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-40">
        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
          {/* Header */}
          <div className="px-3 py-2 text-sm font-medium text-foregroundPrimary">
            Benachrichtigungen ({unreadCount})
          </div>
          <div className="divider"></div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="px-3 py-2 text-sm text-foregroundSecondary">
              Keine neuen Benachrichtigungen
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    flex items-start p-3 rounded-md ${notification.read ? 'bg-background' : 'bg-blue/5'}
                    hover:bg-backgroundSecondary transition-colors
                  `}
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foregroundPrimary line-clamp-1">
                      {(notification.payload as {title?: string; body?: string})?.title ?? 'Untitled'}
                    </p>
                    <p className="text-xs text-foregroundSecondary line-clamp-2">
                      {(notification.payload as {title?: string; body?: string})?.body ?? ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <time className="text-xs text-foregroundTertiary">
                        {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </time>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-xs text-blue hover:text-blue/80"
                        >
                          Als gelesen markieren
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 5 && (
                <div className="px-3 py-2 text-sm text-center">
                  <Link
                    href="/notifications"
                    className="text-blue hover:text-blue/80"
                  >
                    Alle {notifications.length} Benachrichtigungen anzeigen
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="divider"></div>

          {/* Footer with actions */}
          <div className="px-3 py-2 text-sm text-center">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`w-full flex items-center justify-center gap-2 text-xs ${
                unreadCount === 0
                  ? 'text-foregroundTertiary'
                  : 'text-blue hover:text-blue/80'
              }`}
            >
              Alle als gelesen markieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}