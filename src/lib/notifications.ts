import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export async function createNotification(data: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  linkUrl?: string
}) {
  return prisma.notification.create({ data })
}
