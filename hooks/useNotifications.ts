'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Notification } from '@/types/database'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await (supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as any)

      if (error) throw error

      const notificationsData = (data || []) as Notification[]
      setNotifications(notificationsData)
      setUnreadCount(notificationsData.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const updateData: { read: boolean } = { read: true }
      const { error } = await (supabase
        .from('notifications')
        .update(updateData as never)
        .eq('id', notificationId) as any)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updateData: { read: boolean } = { read: true }
      const { error } = await (supabase
        .from('notifications')
        .update(updateData as never)
        .eq('user_id', user.id)
        .eq('read', false) as any)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await (supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId) as any)

      if (error) throw error

      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time updates
    let channel: any = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notification realtime event:', payload.eventType, payload)
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification
              setNotifications(prev => {
                // Check if notification already exists to avoid duplicates
                if (prev.some(n => n.id === newNotification.id)) {
                  return prev
                }
                return [newNotification, ...prev]
              })
              setUnreadCount(prev => prev + 1)
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(n =>
                  n.id === payload.new.id ? payload.new as Notification : n
                )
              )
              if ((payload.new as Notification).read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              }
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
              const deletedNotification = payload.old as Notification
              if (!deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to notifications')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error, will use polling fallback')
          }
        })
    }

    setupRealtime()

    // Listen for custom events when notifications are created
    const handleNotificationCreated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.notification) {
        const newNotification = customEvent.detail.notification as Notification
        setNotifications(prev => {
          // Check if notification already exists to avoid duplicates
          if (prev.some(n => n.id === newNotification.id)) {
            return prev
          }
          return [newNotification, ...prev]
        })
        setUnreadCount(prev => prev + 1)
      } else {
        // Fallback: refresh notifications if no notification data provided
        setTimeout(() => {
          fetchNotifications()
        }, 300)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('notification-created', handleNotificationCreated)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('notification-created', handleNotificationCreated)
      }
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  }
}

