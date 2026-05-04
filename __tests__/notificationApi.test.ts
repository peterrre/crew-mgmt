// Mock dependencies first
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
        headers: new Map(),
      };
    },
  },
  // Mock NextRequest as a class
  NextRequest: jest.fn().mockImplementation((url: string, options: { method: string; body?: any }) => {
    return {
      url,
      method: options.method,
      // For simplicity, we just store the body; json() will return parsed body
      json: async () => {
        if (typeof options.body === 'string') {
          return JSON.parse(options.body);
        }
        return options.body;
      }
    };
  }),
}));

jest.mock('../lib/notificationService');
jest.mock('../lib/emailService');
jest.mock('../lib/websocketServer', () => ({
  sendToUser: jest.fn(),
}));
import { NextRequest } from 'next/server';
import { POST, GET, PATCH, DELETE } from '../app/api/notifications/route';
import { createNotification, getUnreadNotifications, markAsRead, deleteNotification } from '../lib/notificationService';
import { emailService } from '../lib/emailService';
import { sendToUser } from '../lib/websocketServer';

const mockUserId = 'user-1';
const mockNotificationId = 'notification-1';
const mockNotification = {
  id: mockNotificationId,
  userId: mockUserId,
  title: 'Test Notification',
  body: 'This is a test notification',
  read: false,
  createdAt: new Date(),
  type: 'shift_assigned',
  payload: {
    email: 'test@example.com',
    shiftTitle: 'Test Shift',
    volunteerName: 'Test Volunteer',
  },
};

describe('Notification API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.NEXTAUTH_URL='http:/...3000';
  });

  describe('POST /api/notifications', () => {
    it('should create a notification and return 201', async () => {
 (createNotification as jest.Mock).mockResolvedValue(mockNotification);
 (emailService.sendShiftAssigned as jest.Mock).mockResolvedValue({ success: true });
 (sendToUser as jest.Mock).mockResolvedValue(undefined);

 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'POST',
   body: JSON.stringify({
     userId: mockUserId,
     type: 'shift_assigned',
     payload: mockNotification.payload,
   }),
 });

 const response = await POST(request);
 const responseBody = await response.json();

 expect(response.status).toBe(201);
 expect(responseBody).toEqual(mockNotification);
 expect(createNotification).toHaveBeenCalledWith({
   userId: mockUserId,
   type: 'shift_assigned',
   payload: mockNotification.payload,
 });
 expect(emailService.sendShiftAssigned).toHaveBeenCalledWith({
   to: mockNotification.payload.email,
   shiftTitle: mockNotification.payload.shiftTitle,
   volunteerName: mockNotification.payload.volunteerName,
 });
 expect(sendToUser).toHaveBeenCalledWith(mockUserId, {
   event: 'notification',
   data: mockNotification,
 });
    });

    it('should return 400 for invalid input', async () => {
 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'POST',
   body: JSON.stringify({
     // missing userId
     type: 'shift_assigned',
   }),
 });

 const response = await POST(request);
 const responseBody = await response.json();

 expect(response.status).toBe(400);
 expect(responseBody.error).toBe('Invalid input');
    });

    it('should handle email service failure gracefully', async () => {
 (createNotification as jest.Mock).mockResolvedValue(mockNotification);
 (emailService.sendShiftAssigned as jest.Mock).mockImplementation(() => {
   return Promise.reject(new Error('Email failed'));
 });
 (sendToUser as jest.Mock).mockResolvedValue(undefined);

 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'POST',
   body: JSON.stringify({
     userId: mockUserId,
     type: 'shift_assigned',
     payload: mockNotification.payload,
   }),
 });

 const response = await POST(request);
 const responseBody = await response.json();

 expect(response.status).toBe(201);
 expect(responseBody).toEqual(mockNotification);
 expect(emailService.sendShiftAssigned).toHaveBeenCalled();
 expect(sendToUser).toHaveBeenCalled();
    });

    it('should handle websocket failure gracefully', async () => {
 (createNotification as jest.Mock).mockResolvedValue(mockNotification);
 (emailService.sendShiftAssigned as jest.Mock).mockResolvedValue({ success: true });
 (sendToUser as jest.Mock).mockImplementation(() => {
   throw new Error('WebSocket failed');
 });

 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'POST',
   body: JSON.stringify({
     userId: mockUserId,
     type: 'shift_assigned',
     payload: mockNotification.payload,
   }),
 });

 const response = await POST(request);
 const responseBody = await response.json();

 expect(response.status).toBe(201);
 expect(responseBody).toEqual(mockNotification);
 expect(createNotification).toHaveBeenCalled();
 expect(emailService.sendShiftAssigned).toHaveBeenCalled();
 expect(sendToUser).toHaveBeenCalled();
    });
  });

  describe('GET /api/notifications', () => {
    it('should return unread notifications for a user', async () => {
 const mockNotifications = [mockNotification];
 (getUnreadNotifications as jest.Mock).mockResolvedValue(mockNotifications);

 const request = new NextRequest('http://localhost:3000/api/notifications?userId=user-1&limit=10&offset=0', {
   method: 'GET',
 });

 const response = await GET(request);
 const responseBody = await response.json();

 expect(response.status).toBe(200);
 expect(responseBody).toEqual(mockNotifications);
 expect(getUnreadNotifications).toHaveBeenCalledWith('user-1', 10, 0);
    });

    it('should return 400 if userId is missing', async () => {
 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'GET',
 });

 const response = await GET(request);
 const responseBody = await response.json();

 expect(response.status).toBe(400);
 expect(responseBody.error).toBe('userId is required');
    });
  });

  describe('PATCH /api/notifications', () => {
    it('should mark a notification as read', async () => {
 const updatedNotification = { ...mockNotification, read: true };
 (markAsRead as jest.Mock).mockResolvedValue(updatedNotification);

 const request = new NextRequest('http://localhost:3000/api/notifications?id=notification-1', {
   method: 'PATCH',
 });

 const response = await PATCH(request);
 const responseBody = await response.json();

 expect(response.status).toBe(200);
 expect(responseBody).toEqual(updatedNotification);
 expect(markAsRead).toHaveBeenCalledWith('notification-1');
    });

    it('should return 400 if id is missing', async () => {
 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'PATCH',
 });

 const response = await PATCH(request);
 const responseBody = await response.json();

 expect(response.status).toBe(400);
 expect(responseBody.error).toBe('notification id is required');
    });
  });

  describe('DELETE /api/notifications', () => {
    it('should delete a notification', async () => {
 (deleteNotification as jest.Mock).mockResolvedValue(mockNotification);

 const request = new NextRequest('http://localhost:3000/api/notifications?id=notification-1', {
   method: 'DELETE',
 });

 const response = await DELETE(request);
 const responseBody = await response.json();

 expect(response.status).toBe(200);
 expect(responseBody).toEqual(mockNotification);
 expect(deleteNotification).toHaveBeenCalledWith('notification-1');
    });

    it('should return 400 if id is missing', async () => {
 const request = new NextRequest('http://localhost:3000/api/notifications', {
   method: 'DELETE',
 });

 const response = await DELETE(request);
 const responseBody = await response.json();

 expect(response.status).toBe(400);
 expect(responseBody.error).toBe('notification id is required');
    });
  });
});