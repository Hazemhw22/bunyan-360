'use client'

import { createClient } from '@/lib/supabaseClient'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface CreateNotificationParams {
  title: string
  message: string
  type?: NotificationType
  link?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Cannot create notification: User not authenticated')
      return
    }

    const { data, error } = await (supabase
      .from('notifications')
      .insert([
        {
          user_id: user.id,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          read: false,
          link: params.link || null,
        } as never,
      ])
      .select()
      .single() as any)

    if (error) {
      console.error('Error creating notification:', error)
      return
    }

    // Trigger a custom event to notify all notification hooks to refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-created', { 
        detail: { notification: data } 
      }))
    }
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

