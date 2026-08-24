import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      moments: {
        Row: {
          id: string;
          user_id: string;
          type: 'dream' | 'thought';
          body: string;
          polaroid_url: string | null;
          language: string;
          moderation_status: 'pending' | 'approved' | 'removed';
          status: 'active' | 'hidden';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['moments']['Row'], 'id' | 'created_at'>;
      };
      impressions: {
        Row: {
          id: string;
          viewer_id: string;
          moment_id: string;
          served_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['impressions']['Row'], 'id' | 'served_at'>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          moment_id: string;
          reason: string;
          details: string | null;
          status: 'pending' | 'reviewed' | 'resolved';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'status'>;
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          avatar_url: string | null;
          settings: {
            defaultAtmosphere: string;
            volume: number;
            textSize: string;
          };
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
    };
  };
};
