export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          name: string
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          tax_number: string | null
          email: string | null
          phone: string | null
          contact_person_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tax_number?: string | null
          email?: string | null
          phone?: string | null
          contact_person_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tax_number?: string | null
          email?: string | null
          phone?: string | null
          contact_person_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          area_id: string | null
          company_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          area_id?: string | null
          company_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          area_id?: string | null
          company_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      buildings: {
        Row: {
          id: string
          project_id: string
          building_code: string
          total_progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          building_code: string
          total_progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          building_code?: string
          total_progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          building_id: string
          description: string
          unit_price: number
          quantity: number
          current_progress: number
          last_invoiced_progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          description: string
          unit_price: number
          quantity?: number
          current_progress?: number
          last_invoiced_progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          description?: string
          unit_price?: number
          quantity?: number
          current_progress?: number
          last_invoiced_progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          project_id: string
          invoice_number: string
          amount: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id: string
          invoice_number: string
          amount: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string
          invoice_number?: string
          amount?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          service_id: string | null
          building_code: string
          service_description: string
          previous_percentage: number
          current_percentage: number
          unit_price: number
          quantity: number
          amount_due: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          service_id?: string | null
          building_code: string
          service_description: string
          previous_percentage?: number
          current_percentage: number
          unit_price: number
          quantity?: number
          amount_due: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          service_id?: string | null
          building_code?: string
          service_description?: string
          previous_percentage?: number
          current_percentage?: number
          unit_price?: number
          quantity?: number
          amount_due?: number
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      calculate_earned_value: {
        Args: {
          p_unit_price: number
          p_quantity: number
          p_new_progress: number
          p_old_progress: number
        }
        Returns: number
      }
    }
  }
}

// Type aliases for easier use
export type Area = Database['public']['Tables']['areas']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Building = Database['public']['Tables']['buildings']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

