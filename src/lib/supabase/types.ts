// Database types - these match our Supabase schema

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          twitter_id: string | null;
          twitter_handle: string;
          twitter_name: string | null;
          twitter_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          twitter_id?: string | null;
          twitter_handle: string;
          twitter_name?: string | null;
          twitter_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          twitter_id?: string | null;
          twitter_handle?: string;
          twitter_name?: string | null;
          twitter_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          personal_info: any;
          social_profiles: any[];
          points: number;
          trust_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          personal_info?: any;
          social_profiles?: any[];
          points?: number;
          trust_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          personal_info?: any;
          social_profiles?: any[];
          points?: number;
          trust_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      soul_seeds: {
        Row: {
          id: string;
          user_id: string;
          alias: string;
          vibe: 'ethereal' | 'zen' | 'cyber';
          level: number;
          streak_count: number;
          last_fed_at: string | null;
          offensive_count: number;
          trust_penalty: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          alias: string;
          vibe: 'ethereal' | 'zen' | 'cyber';
          level?: number;
          streak_count?: number;
          last_fed_at?: string | null;
          offensive_count?: number;
          trust_penalty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          alias?: string;
          vibe?: 'ethereal' | 'zen' | 'cyber';
          level?: number;
          streak_count?: number;
          last_fed_at?: string | null;
          offensive_count?: number;
          trust_penalty?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          soul_seed_id: string;
          question_id: string;
          question_text: string;
          question_category: string;
          user_response: string;
          analysis: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          soul_seed_id: string;
          question_id: string;
          question_text: string;
          question_category: string;
          user_response: string;
          analysis?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          soul_seed_id?: string;
          question_id?: string;
          question_text?: string;
          question_category?: string;
          user_response?: string;
          analysis?: any | null;
          created_at?: string;
        };
      };
      earned_traits: {
        Row: {
          id: string;
          soul_seed_id: string;
          trait_id: string;
          earned_at: string;
          trigger_answer: string | null;
          question_id: string | null;
          strength: number;
        };
        Insert: {
          id?: string;
          soul_seed_id: string;
          trait_id: string;
          earned_at?: string;
          trigger_answer?: string | null;
          question_id?: string | null;
          strength?: number;
        };
        Update: {
          id?: string;
          soul_seed_id?: string;
          trait_id?: string;
          earned_at?: string;
          trigger_answer?: string | null;
          question_id?: string | null;
          strength?: number;
        };
      };
      artifacts: {
        Row: {
          id: string;
          soul_seed_id: string;
          artifact_id: string;
          rarity: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          soul_seed_id: string;
          artifact_id: string;
          rarity: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          soul_seed_id?: string;
          artifact_id?: string;
          rarity?: string;
          earned_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          properties: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          properties?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_name?: string;
          properties?: any;
          created_at?: string;
        };
      };
      bug_reports: {
        Row: {
          id: string;
          user_id: string | null;
          twitter_handle: string | null;
          email: string | null;
          title: string;
          description: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          category: 'security' | 'functionality' | 'ui' | 'performance' | 'other';
          status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'fixed';
          reward_amount: number;
          created_at: string;
          updated_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewer_notes: string | null;
          browser_info: string | null;
          url_where_found: string | null;
          steps_to_reproduce: string | null;
          expected_behavior: string | null;
          actual_behavior: string | null;
          points_awarded: number;
          points_awarded_at: string | null;
          points_awarded_by: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          twitter_handle?: string | null;
          email?: string | null;
          title: string;
          description: string;
          severity?: 'critical' | 'high' | 'medium' | 'low';
          category?: 'security' | 'functionality' | 'ui' | 'performance' | 'other';
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'fixed';
          reward_amount?: number;
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          browser_info?: string | null;
          url_where_found?: string | null;
          steps_to_reproduce?: string | null;
          expected_behavior?: string | null;
          actual_behavior?: string | null;
          points_awarded?: number;
          points_awarded_at?: string | null;
          points_awarded_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          twitter_handle?: string | null;
          email?: string | null;
          title?: string;
          description?: string;
          severity?: 'critical' | 'high' | 'medium' | 'low';
          category?: 'security' | 'functionality' | 'ui' | 'performance' | 'other';
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'fixed';
          reward_amount?: number;
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          browser_info?: string | null;
          url_where_found?: string | null;
          steps_to_reproduce?: string | null;
          expected_behavior?: string | null;
          actual_behavior?: string | null;
          points_awarded?: number;
          points_awarded_at?: string | null;
          points_awarded_by?: string | null;
        };
      };
      bug_report_attachments: {
        Row: {
          id: string;
          bug_report_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          bug_report_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          bug_report_id?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          storage_path?: string;
          uploaded_at?: string;
        };
      };
    };
  };
}; 