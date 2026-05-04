import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { NotificationBell } from '@/components/NotificationBell';

// Mock the useNotification hook from NotificationContext
jest.mock('@/components/NotificationContext', () => ({
  useNotification: jest.fn(),
}));

const mockUseNotification = require('@/components/NotificationContext').useNotification;

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bell icon', () => {
    mockUseNotification.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    expect(bellButton).toBeInTheDocument();
    const bellIcon = bellButton.querySelector('svg.lucide-bell');
    expect(bellIcon).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    mockUseNotification.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    const badge = screen.queryByRole('button', { name: /benachrichtigungen/i });
    // The badge is only rendered when unreadCount > 0, so we expect no text content '0'
    expect(badge).not.toHaveTextContent('0');
  });

  it('shows badge with correct count when unreadCount > 0', () => {
    mockUseNotification.mockReturnValue({
      unreadCount: 5,
      notifications: Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test ${i + 1}`,
        body: `Body ${i + 1}`,
        read: false,
        createdAt: new Date(),
      })),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('absolute');
    expect(badge).toHaveClass('bg-red');
  });

    it('opens dropdown and shows notifications when bell clicked', () => {
    const notifications = [
      { id: '1', title: 'Test 1', body: 'Body 1', read: false, createdAt: new Date(), payload: { title: 'Test 1', body: 'Body 1' } },
      { id: '2', title: 'Test 2', body: 'Body 2', read: true, createdAt: new Date(), payload: { title: 'Test 2', body: 'Body 2' } },
    ];
    mockUseNotification.mockReturnValue({
      unreadCount: 1,
      notifications,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    act(() => {
      bellButton.click();
    });

    // Header with count
    expect(screen.getByText(/benachrichtigungen \(1\)/i)).toBeInTheDocument();
    // Notification items
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    // No "Alle anzeigen" link because only 2 notifications
    expect(screen.queryByText(/alle .* benachrichtigungen anzeigen/i)).not.toBeInTheDocument();
  });

  it('shows "Alle anzeigen" link when notifications > 5', () => {
    const notifications = Array.from({ length: 7 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Test ${i + 1}`,
      body: `Body ${i + 1}`,
      read: false,
      createdAt: new Date(),
    }));
    mockUseNotification.mockReturnValue({
      unreadCount: 7,
      notifications,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    act(() => {
      bellButton.click();
    });

    expect(screen.getByText(/alle 7 benachrichtigungen anzeigen/i)).toBeInTheDocument();
  });

    it('marks notification as read when mark as read button clicked', async () => {
    const markAsReadMock = jest.fn();
    mockUseNotification.mockReturnValue({
      unreadCount: 1,
      notifications: [{ id: '1', title: 'Test', body: 'Body', read: false, createdAt: new Date(), payload: { title: 'Test', body: 'Body' } }],
      markAsRead: markAsReadMock,
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    // Open dropdown
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    act(() => {
      bellButton.click();
    });

    // Click mark as read button
    const markAsReadButton = screen.getByRole('button', { name: /^Als gelesen markieren$/i });
    act(() => {
      markAsReadButton.click();
    });

    await waitFor(() => {
      expect(markAsReadMock).toHaveBeenCalledWith('1');
    });
  });

  it('marks all as read when button clicked', async () => {
    const markAllAsReadMock = jest.fn();
    mockUseNotification.mockReturnValue({
      unreadCount: 2,
      notifications: [
        { id: '1', title: 'Test 1', body: 'Body 1', read: false, createdAt: new Date() },
        { id: '2', title: 'Test 2', body: 'Body 2', read: false, createdAt: new Date() },
      ],
      markAsRead: jest.fn(),
      markAllAsRead: markAllAsReadMock,
    });

    render(<NotificationBell />);
    // Open dropdown
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    act(() => {
      bellButton.click();
    });

    // Click mark all as read button
    const markAllAsReadButton = screen.getByRole('button', { name: /alle als gelesen markieren/i });
    act(() => {
      markAllAsReadButton.click();
    });

    await waitFor(() => {
      expect(markAllAsReadMock).toHaveBeenCalled();
    });
  });

  it('disables mark all as read button when no unread notifications', () => {
    mockUseNotification.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });

    render(<NotificationBell />);
    // Open dropdown
    const bellButton = screen.getByRole('button', { name: /benachrichtigungen/i });
    act(() => {
      bellButton.click();
    });

    const markAllAsReadButton = screen.getByRole('button', { name: /alle als gelesen markieren/i });
    expect(markAllAsReadButton).toBeDisabled();
  });
});