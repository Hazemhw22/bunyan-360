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
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new as Notification, ...prev])
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
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
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

