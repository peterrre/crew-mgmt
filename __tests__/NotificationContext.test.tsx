import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider, useNotification } from '@/components/NotificationContext';
import { getUnreadNotifications, markAsRead as markAsReadAPI, deleteNotification } from '@/lib/notificationService';

// Mock the notification service
jest.mock('@/lib/notificationService');
// Mock next-auth/react
jest.mock('next-auth/react');

const mockNotifications = [
  { id: '1', userId: 'user-1', title: 'Test 1', body: 'Body 1', read: false, createdAt: new Date() },
  { id: '2', userId: 'user-1', title: 'Test 2', body: 'Body 2', read: true, createdAt: new Date() },
];

describe('NotificationContext', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useNotification hook', () => {
    it('should fetch notifications on mount', async () => {
      (getUnreadNotifications as jest.Mock).mockResolvedValue(mockNotifications);
      // Mock useSession to return a user
      require('next-auth/react').useSession = () => ({
        data: {
          user: {
            id: 'user-1',
          },
        },
      });

      const TestComponent = () => {
        const { notifications, unreadCount, loading } = useNotification();
        return (
          <div>
            <div data-testid="notifications">{notifications.length}</div>
            <div data-testid="unreadCount">{unreadCount}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('notifications')).toHaveTextContent('0');
      expect(screen.getByTestId('unreadCount')).toHaveTextContent('0');

      // After fetch
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('notifications')).toHaveTextContent('2');
        expect(screen.getByTestId('unreadCount')).toHaveTextContent('1');
      });

      // Expect getUnreadNotifications called with userId (limit and offset default)
      expect(getUnreadNotifications).toHaveBeenCalledWith('user-1');
    });

    it('should handle empty userId', async () => {
      // Mock useSession to return no user
      require('next-auth/react').useSession = () => ({
        data: {
          user: null,
        },
      });

      const TestComponent = () => {
        const { notifications, unreadCount, loading } = useNotification();
        return (
          <div>
            <div data-testid="notifications">{notifications.length}</div>
            <div data-testid="unreadCount">{unreadCount}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('notifications')).toHaveTextContent('0');
      expect(screen.getByTestId('unreadCount')).toHaveTextContent('0');
      expect(getUnreadNotifications).not.toHaveBeenCalled();
    });

    it('should mark notification as read', async () => {
      (getUnreadNotifications as jest.Mock).mockResolvedValue(mockNotifications);
      const updatedNotification = { ...mockNotifications[0], read: true };
      (markAsReadAPI as jest.Mock).mockResolvedValue(updatedNotification);
      // Mock useSession to return a user
      require('next-auth/react').useSession = () => ({
        data: {
          user: {
            id: 'user-1',
          },
        },
      });

      const TestComponent = () => {
        const { markAsRead, notifications, unreadCount, loading } = useNotification();
        const handleClick = async () => {
          await markAsRead('1');
        };
        return (
          <div>
            <div data-testid="notifications">{notifications.length}</div>
            <div data-testid="unreadCount">{unreadCount}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
            <button onClick={async () => { await markAsRead('1'); }} data-testid="markAsReadBtn">Mark as read</button>
            <div data-testid="notification-1-read">{String(notifications.find(n => n.id === '1')?.read ?? false)}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      // Wait for notifications to be fetched
      await waitFor(() => {
        expect(screen.getByTestId('notifications')).toHaveTextContent('2');
      });

      expect(screen.getByTestId('unreadCount')).toHaveTextContent('1');
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');

      // Check initial state
      expect(screen.getByTestId('notification-1-read')).toHaveTextContent('false');

      const markAsReadBtn = screen.getByTestId('markAsReadBtn');
      act(() => {
        markAsReadBtn.click();
      });

      await waitFor(() => {
        expect(markAsReadAPI).toHaveBeenCalledWith('1');
        expect(screen.getByTestId('notification-1-read')).toHaveTextContent('true');
      });
      });
      

    it('should mark all notifications as read', async () => {
      (getUnreadNotifications as jest.Mock).mockResolvedValue(mockNotifications);
      (markAsReadAPI as jest.Mock).mockImplementation(async (id) => {
        const notification = mockNotifications.find(n => n.id === id);
        return { ...notification, read: true };
      });
      // Mock useSession to return a user
      require('next-auth/react').useSession = () => ({
        data: {
          user: {
            id: 'user-1',
          },
        },
      });

      const TestComponent = () => {
        const { markAllAsRead, notifications, unreadCount } = useNotification();
        return (
          <div>
            <button onClick={markAllAsRead} data-testid="markAllAsReadBtn">Mark all as read</button>
            <div data-testid="unreadCount">{unreadCount}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      await waitFor(() => {
        expect(screen.getByTestId('unreadCount')).toHaveTextContent('1'); // only one unread
      });

      const markAllAsReadBtn = screen.getByTestId('markAllAsReadBtn');
      act(() => {
        markAllAsReadBtn.click();
      });

      await waitFor(() => {
        expect(markAsReadAPI).toHaveBeenCalledTimes(1); // only one unread notification
        expect(screen.getByTestId('unreadCount')).toHaveTextContent('0');
      });
    });

    it('should delete notification', async () => {
      (getUnreadNotifications as jest.Mock).mockResolvedValue(mockNotifications);
      (deleteNotification as jest.Mock).mockResolvedValue(mockNotifications[0]);
      // Mock useSession to return a user
      require('next-auth/react').useSession = () => ({
        data: {
          user: {
            id: 'user-1',
          },
        },
      });

      const TestComponent = () => {
        const { deleteNotification, notifications } = useNotification();
        const handleClick = async () => {
          await deleteNotification('1');
        };
        return (
          <div>
            <button onClick={handleClick} data-testid="deleteBtn">Delete notification</button>
            <div data-testid="notification-count">{notifications.length}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      });

      const deleteBtn = screen.getByTestId('deleteBtn');
      act(() => {
        deleteBtn.click();
      });

      await waitFor(() => {
        expect(deleteNotification).toHaveBeenCalledWith('1');
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
    });

    it('should refetch notifications', async () => {
      (getUnreadNotifications as jest.Mock)
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce([{ id: '3', userId: 'user-1', title: 'Test 3', body: 'Body 3', read: false, createdAt: new Date() }]);
      // Mock useSession to return a user
      require('next-auth/react').useSession = () => ({
        data: {
          user: {
            id: 'user-1',
          },
        },
      });

      const TestComponent = () => {
        const { notifications, refetch } = useNotification();
        return (
          <div>
            <button onClick={refetch} data-testid="refetchBtn">Refetch</button>
            <div data-testid="notification-count">{notifications.length}</div>
          </div>
        );
      };

      render(<Wrapper><TestComponent /></Wrapper>);

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      });

      const refetchBtn = screen.getByTestId('refetchBtn');
      act(() => {
        refetchBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
        expect(getUnreadNotifications).toHaveBeenCalledTimes(2);
      });
    });
  });
});