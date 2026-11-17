// Hand-written to match supabase/migrations. Regenerate with `supabase gen types` when the schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          business_name: string | null;
          business_address: string | null;
          phone: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          business_name?: string | null;
          business_address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          business_name?: string | null;
          business_address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          city: string;
          province: string;
          type: 'residential' | 'commercial' | 'mixed';
          units: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          city?: string;
          province?: string;
          type?: 'residential' | 'commercial' | 'mixed';
          units?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string;
          city?: string;
          province?: string;
          type?: 'residential' | 'commercial' | 'mixed';
          units?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          name: string;
          email: string;
          phone: string;
          rent: number;
          lease_start: string;
          lease_end: string;
          status: 'active' | 'inactive' | 'pending';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          name: string;
          email: string;
          phone: string;
          rent?: number;
          lease_start: string;
          lease_end: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          rent?: number;
          lease_start?: string;
          lease_end?: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "tenants_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'bank_transfer' | 'cash' | 'card' | 'eft';
          reference: string | null;
          notes: string | null;
          status: 'completed' | 'pending' | 'overdue';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          payment_date: string;
          payment_method?: 'bank_transfer' | 'cash' | 'card' | 'eft';
          reference?: string | null;
          notes?: string | null;
          status?: 'completed' | 'pending' | 'overdue';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          property_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: 'bank_transfer' | 'cash' | 'card' | 'eft';
          reference?: string | null;
          notes?: string | null;
          status?: 'completed' | 'pending' | 'overdue';
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payments_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
      maintenance: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          issue: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high';
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date: string | null;
          completed_date: string | null;
          cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          issue: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          completed_date?: string | null;
          cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          issue?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          completed_date?: string | null;
          cost?: number | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "maintenance_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          property_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          amount: number;
          description: string | null;
          status: 'draft' | 'sent' | 'paid';
          sent_at: string | null;
          paid_date: string | null;
          last_reminder_at: string | null;
          reminder_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          property_id: string;
          invoice_number: string;
          issue_date?: string;
          due_date: string;
          amount: number;
          description?: string | null;
          status?: 'draft' | 'sent' | 'paid';
          sent_at?: string | null;
          paid_date?: string | null;
          last_reminder_at?: string | null;
          reminder_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          property_id?: string;
          invoice_number?: string;
          issue_date?: string;
          due_date?: string;
          amount?: number;
          description?: string | null;
          status?: 'draft' | 'sent' | 'paid';
          sent_at?: string | null;
          paid_date?: string | null;
          last_reminder_at?: string | null;
          reminder_count?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "invoices_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string | null;
          property_id: string | null;
          description: string;
          amount: number;
          due_date: string;
          paid_date: string | null;
          status: 'due' | 'paid';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor_id?: string | null;
          property_id?: string | null;
          description: string;
          amount: number;
          due_date: string;
          paid_date?: string | null;
          status?: 'due' | 'paid';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vendor_id?: string | null;
          property_id?: string | null;
          description?: string;
          amount?: number;
          due_date?: string;
          paid_date?: string | null;
          status?: 'due' | 'paid';
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "expenses_vendor_id_fkey"; columns: ["vendor_id"]; isOneToOne: false; referencedRelation: "vendors"; referencedColumns: ["id"] },
          { foreignKeyName: "expenses_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
      screenings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          applicant_name: string;
          applicant_email: string | null;
          applicant_phone: string | null;
          monthly_income: number | null;
          status: 'requested' | 'approved' | 'declined';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id?: string | null;
          applicant_name: string;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          monthly_income?: number | null;
          status?: 'requested' | 'approved' | 'declined';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string | null;
          applicant_name?: string;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          monthly_income?: number | null;
          status?: 'requested' | 'approved' | 'declined';
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "screenings_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
