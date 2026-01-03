import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Project, Area, Company } from '@/types/database'

export interface ProjectWithRelations extends Project {
  area: Area | null
  company: Company | null
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      // Fetch projects with area and company data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Fetch related areas and companies
      const projectsDataTyped = projectsData as { area_id: string | null; company_id: string }[]
      const areaIds = Array.from(new Set(projectsDataTyped?.map(p => p.area_id).filter(Boolean) || []))
      const companyIds = Array.from(new Set(projectsDataTyped?.map(p => p.company_id) || []))

      const [areasResult, companiesResult] = await Promise.all([
        areaIds.length > 0
          ? supabase.from('areas').select('*').in('id', areaIds)
          : Promise.resolve({ data: [], error: null }),
        companyIds.length > 0
          ? supabase.from('companies').select('*').in('id', companyIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (areasResult.error) throw areasResult.error
      if (companiesResult.error) throw companiesResult.error

      const areasData = areasResult.data as Area[]
      const companiesData = companiesResult.data as Company[]
      
      const areasMap = new Map(areasData?.map(a => [a.id, a]) || [])
      const companiesMap = new Map(companiesData?.map(c => [c.id, c]) || [])

      const projectsWithRelations: ProjectWithRelations[] = (projectsDataTyped || []).map(project => ({
        ...(project as Project),
        area: project.area_id ? areasMap.get(project.area_id) || null : null,
        company: companiesMap.get(project.company_id) || null,
      }))

      setProjects(projectsWithRelations)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { projects, loading, error, refetch: fetchProjects }
}

