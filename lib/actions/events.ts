'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { getServerSession } from 'next-auth'

// Zod schemas
const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().transform((str: string) => new Date(str)),
  endDate: z.string().transform((str: string) => new Date(str)),
  location: z.string().optional(),
  contactPersonId: z.string().optional(),
  acceptingVolunteers: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).optional(),
})


const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  defaultShifts: z.array(z.object({
    title: z.string(),
    startOffset: z.number(),
    endOffset: z.number(),
    recurrence: z.string().optional(),
  })),
})

// Helper to check admin role
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
}

// Users (only ADMIN and CREW can be contact persons)
export async function getUsers() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'CREW'] },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
  return users
}

// Events
export async function createEvent(formData: FormData) {
  await requireAdmin()

  const data = Object.fromEntries(formData)
  // Only keep the fields defined in the schema
  const filteredData = {
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location,
    contactPersonId: data.contactPersonId,
    acceptingVolunteers: data.acceptingVolunteers,
  }
  const validated = eventSchema.parse(filteredData)

  const event = await prisma.event.create({
    data: {
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate,
      ...(validated.location && { location: validated.location }),
      ...(validated.contactPersonId && { contactPersonId: validated.contactPersonId }),
      ...(validated.description && { description: validated.description }),
      ...(validated.acceptingVolunteers !== undefined && { acceptingVolunteers: validated.acceptingVolunteers }),
    },
  })

  revalidatePath('/admin/events')
  redirect(`/admin/events/${event.id}`)
}

export async function updateEvent(id: string, formData: FormData) {
  await requireAdmin()

  const data = Object.fromEntries(formData)
  // Only keep the fields defined in the schema
  const filteredData = {
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location,
    contactPersonId: data.contactPersonId,
    acceptingVolunteers: data.acceptingVolunteers,
  }
  const validated = eventSchema.parse(filteredData)

  await prisma.event.update({
    where: { id },
    data: {
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate,
      ...(validated.location && { location: validated.location }),
      ...(validated.contactPersonId && { contactPersonId: validated.contactPersonId }),
      ...(validated.description && { description: validated.description }),
      acceptingVolunteers: validated.acceptingVolunteers ?? false,
    },
  })

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  redirect(`/admin/events/${id}`)
}

export async function deleteEvent(id: string) {
  await requireAdmin()

  await prisma.event.delete({ where: { id } })

  revalidatePath('/admin/events')
  redirect('/admin/events')
}

export async function archiveEvent(id: string) {
  await requireAdmin()

  await prisma.event.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  })

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  redirect('/admin/events')
}

export async function restoreEvent(id: string) {
  await requireAdmin()

  await prisma.event.update({
    where: { id },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  })

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
}

export async function toggleAcceptingVolunteers(id: string, accepting: boolean) {
  await requireAdmin()

  await prisma.event.update({
    where: { id },
    data: {
      acceptingVolunteers: accepting,
    },
  })

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
}

export async function createEventFromTemplate(templateId: string, eventData: Partial<z.infer<typeof eventSchema>>) {
  await requireAdmin()

  if (!eventData.startDate || !eventData.endDate) {
    throw new Error('startDate and endDate are required')
  }

  const template = await prisma.eventTemplate.findUnique({ where: { id: templateId } })
  if (!template) throw new Error('Template not found')

  const event = await prisma.event.create({
    data: {
      name: eventData.name || template.name,
      description: eventData.description || template.description,
      startDate: eventData.startDate!,
      endDate: eventData.endDate!,
      location: eventData.location,
      contactPersonId: eventData.contactPersonId,
    },
  })

  // Generate shifts from template
  const shifts = (template.defaultShifts as { title: string; startOffset: number; endOffset: number; recurrence?: string }[]).map((shift) => ({
    title: shift.title,
    start: new Date(event.startDate.getTime() + shift.startOffset * 60 * 60 * 1000),
    end: new Date(event.startDate.getTime() + shift.endOffset * 60 * 60 * 1000),
    eventId: event.id,
  }))

  await prisma.shift.createMany({ data: shifts })

  revalidatePath('/admin/events')
  return event
}


// Templates
export async function createTemplate(formData: FormData) {
  await requireAdmin()

  const data = Object.fromEntries(formData)
  const validated = templateSchema.parse({
    ...data,
    defaultShifts: JSON.parse(data.defaultShifts as string),
  })

  const template = await prisma.eventTemplate.create({ data: validated })

  revalidatePath('/admin/templates')
  return template
}

export async function updateTemplate(id: string, formData: FormData) {
  await requireAdmin()

  const data = Object.fromEntries(formData)
  const validated = templateSchema.parse({
    ...data,
    defaultShifts: JSON.parse(data.defaultShifts as string),
  })

  await prisma.eventTemplate.update({ where: { id }, data: validated })

  revalidatePath('/admin/templates')
}

export async function deleteTemplate(id: string) {
  await requireAdmin()

  await prisma.eventTemplate.delete({ where: { id } })

  revalidatePath('/admin/templates')
}