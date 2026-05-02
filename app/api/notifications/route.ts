import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createNotification,
  getUnreadNotifications,
  markAsRead,
  deleteNotification
} from '@/lib/notificationService';
import type { Prisma } from '@prisma/client';
import { emailService } from '@/lib/emailService';
import { sendToUser } from '@/lib/websocketServer';

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    'shift_assigned',
    'shift_changed',
    'application_approved',
    'shift_request',
    'reminder_24h',
    'reminder_2h'
  ]),
  payload: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
    }

    const notification = await createNotification(result.data as Prisma.NotificationUncheckedCreateInput);

    // Trigger email based on type
    try {
      // We need to extract relevant data from payload for each email type.
      // For simplicity, we assume payload contains the necessary fields.
      // In a real app, we might have a more structured payload or separate functions.
      const payload = result.data.payload as { 
        email?: string; 
        shiftTitle?: string; 
        volunteerName?: string; 
        changes?: string;
        eventName?: string;
      } || {};

      switch (notification.type) {
        case 'shift_assigned':
          await emailService.sendShiftAssigned({
            to: payload.email || '',
            shiftTitle: payload.shiftTitle || '',
            volunteerName: payload.volunteerName || '',
          });
          break;
        case 'shift_changed':
          await emailService.sendShiftChanged({
            to: payload.email || '',
            shiftTitle: payload.shiftTitle || '',
            changes: payload.changes || '',
          });
          break;
        case 'application_approved':
          await emailService.sendApplicationApproved({
            to: payload.email || '',
            eventName: payload.eventName || '',
            volunteerName: payload.volunteerName || '',
          });
          break;
        case 'reminder_24h':
        case 'reminder_2h':
          await emailService.sendReminder({
            to: payload.email || '',
            shiftTitle: payload.shiftTitle || '',
            when: notification.type === 'reminder_24h' ? '24h' : '2h',
          });
          break;
        // shift_request might not have an email? We'll skip for now.
        default:
          break;
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send email:', emailError);
    }

    // Broadcast via WebSocket to the user
    try {
      sendToUser(notification.userId, {
        event: 'notification',
        data: notification,
      });
    } catch (wsError) {
      console.error('Failed to broadcast via WebSocket:', wsError);
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const notifications = await getUnreadNotifications(userId, limit, offset);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'notification id is required' }, { status: 400 });
    }

    const notification = await markAsRead(id);
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'notification id is required' }, { status: 400 });
    }

    const notification = await deleteNotification(id);
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}