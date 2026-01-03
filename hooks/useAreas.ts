import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Area } from '@/types/database'

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setAreas(data || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { areas, loading, error, refetch: fetchAreas }
}

