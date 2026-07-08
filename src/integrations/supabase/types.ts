export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          slug: string
          tier: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          slug: string
          tier?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          eligibility: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          registration_url: string | null
          role: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          registration_url?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          registration_url?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          avg_package: number | null
          created_at: string
          created_by: string | null
          description: string | null
          eligibility: Json
          faqs: Json
          headquarters: string | null
          hiring_frequency: string | null
          id: string
          internship_stipend: number | null
          logo_url: string | null
          name: string
          process_timeline: Json
          resources: Json
          slug: string
          status: Database["public"]["Enums"]["approval_status"]
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          avg_package?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          faqs?: Json
          headquarters?: string | null
          hiring_frequency?: string | null
          id?: string
          internship_stipend?: number | null
          logo_url?: string | null
          name: string
          process_timeline?: Json
          resources?: Json
          slug: string
          status?: Database["public"]["Enums"]["approval_status"]
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          avg_package?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          faqs?: Json
          headquarters?: string | null
          hiring_frequency?: string | null
          id?: string
          internship_stipend?: number | null
          logo_url?: string | null
          name?: string
          process_timeline?: Json
          resources?: Json
          slug?: string
          status?: Database["public"]["Enums"]["approval_status"]
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      experience_comments: {
        Row: {
          body: string
          created_at: string
          experience_id: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          experience_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          experience_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_comments_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "experience_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_likes: {
        Row: {
          created_at: string
          experience_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_likes_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_reports: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_reports_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_saves: {
        Row: {
          created_at: string
          experience_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_saves_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_id: string | null
          score: number
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          score?: number
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          score?: number
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          category: Database["public"]["Enums"]["forum_category"]
          created_at: string
          id: string
          image_url: string | null
          locked: boolean
          pinned: boolean
          reply_count: number
          score: number
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          body: string
          category?: Database["public"]["Enums"]["forum_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          score?: number
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          body?: string
          category?: Database["public"]["Enums"]["forum_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          score?: number
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          thread_id: string | null
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_experiences: {
        Row: {
          author_id: string
          batch: string | null
          college: string | null
          company_id: string
          created_at: string
          cs_subjects: Json
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          dsa_questions: Json
          duration_weeks: number | null
          eligibility: string | null
          hr_questions: Json
          id: string
          interview_date: string | null
          mode: Database["public"]["Enums"]["interview_mode"] | null
          package_lpa: number | null
          profile: string | null
          rating: number | null
          result: Database["public"]["Enums"]["interview_result"] | null
          resume_questions: Json
          role: string
          rounds: Json
          status: Database["public"]["Enums"]["approval_status"]
          stipend: number | null
          technologies: string[]
          tips: string | null
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          batch?: string | null
          college?: string | null
          company_id: string
          created_at?: string
          cs_subjects?: Json
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          dsa_questions?: Json
          duration_weeks?: number | null
          eligibility?: string | null
          hr_questions?: Json
          id?: string
          interview_date?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"] | null
          package_lpa?: number | null
          profile?: string | null
          rating?: number | null
          result?: Database["public"]["Enums"]["interview_result"] | null
          resume_questions?: Json
          role: string
          rounds?: Json
          status?: Database["public"]["Enums"]["approval_status"]
          stipend?: number | null
          technologies?: string[]
          tips?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          batch?: string | null
          college?: string | null
          company_id?: string
          created_at?: string
          cs_subjects?: Json
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          dsa_questions?: Json
          duration_weeks?: number | null
          eligibility?: string | null
          hr_questions?: Json
          id?: string
          interview_date?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"] | null
          package_lpa?: number | null
          profile?: string | null
          rating?: number | null
          result?: Database["public"]["Enums"]["interview_result"] | null
          resume_questions?: Json
          role?: string
          rounds?: Json
          status?: Database["public"]["Enums"]["approval_status"]
          stipend?: number | null
          technologies?: string[]
          tips?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_experiences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      oa_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oa_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "oa_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oa_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "oa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_drafts: {
        Row: {
          code: string
          id: string
          language: Database["public"]["Enums"]["oa_language"]
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string
          id?: string
          language: Database["public"]["Enums"]["oa_language"]
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          language?: Database["public"]["Enums"]["oa_language"]
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oa_drafts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "oa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_likes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oa_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "oa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_questions: {
        Row: {
          allowed_languages: Database["public"]["Enums"]["oa_language"][]
          asked_on: string | null
          author_id: string
          company_id: string | null
          constraints: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          editorial: string | null
          estimated_space_complexity: string | null
          estimated_time_complexity: string | null
          hidden_tests: Json
          hints: string[]
          id: string
          input_format: string | null
          memory_limit_kb: number
          output_format: string | null
          platform: string | null
          role: string | null
          sample_tests: Json
          slug: string
          starter_code: Json
          statement: string
          status: Database["public"]["Enums"]["approval_status"]
          time_limit_ms: number
          title: string
          topics: string[]
          updated_at: string
          views: number
        }
        Insert: {
          allowed_languages?: Database["public"]["Enums"]["oa_language"][]
          asked_on?: string | null
          author_id: string
          company_id?: string | null
          constraints?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          editorial?: string | null
          estimated_space_complexity?: string | null
          estimated_time_complexity?: string | null
          hidden_tests?: Json
          hints?: string[]
          id?: string
          input_format?: string | null
          memory_limit_kb?: number
          output_format?: string | null
          platform?: string | null
          role?: string | null
          sample_tests?: Json
          slug: string
          starter_code?: Json
          statement: string
          status?: Database["public"]["Enums"]["approval_status"]
          time_limit_ms?: number
          title: string
          topics?: string[]
          updated_at?: string
          views?: number
        }
        Update: {
          allowed_languages?: Database["public"]["Enums"]["oa_language"][]
          asked_on?: string | null
          author_id?: string
          company_id?: string | null
          constraints?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          editorial?: string | null
          estimated_space_complexity?: string | null
          estimated_time_complexity?: string | null
          hidden_tests?: Json
          hints?: string[]
          id?: string
          input_format?: string | null
          memory_limit_kb?: number
          output_format?: string | null
          platform?: string | null
          role?: string | null
          sample_tests?: Json
          slug?: string
          starter_code?: Json
          statement?: string
          status?: Database["public"]["Enums"]["approval_status"]
          time_limit_ms?: number
          title?: string
          topics?: string[]
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "oa_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_saves: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oa_saves_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "oa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_submissions: {
        Row: {
          code: string
          created_at: string
          id: string
          language: Database["public"]["Enums"]["oa_language"]
          memory_kb: number | null
          passed_count: number
          question_id: string
          runtime_ms: number | null
          status: Database["public"]["Enums"]["oa_submission_status"]
          stderr: string | null
          test_results: Json
          total_count: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language: Database["public"]["Enums"]["oa_language"]
          memory_kb?: number | null
          passed_count?: number
          question_id: string
          runtime_ms?: number | null
          status?: Database["public"]["Enums"]["oa_submission_status"]
          stderr?: string | null
          test_results?: Json
          total_count?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["oa_language"]
          memory_kb?: number | null
          passed_count?: number
          question_id?: string
          runtime_ms?: number | null
          status?: Database["public"]["Enums"]["oa_submission_status"]
          stderr?: string | null
          test_results?: Json
          total_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oa_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "oa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          branch: string | null
          college: string | null
          created_at: string
          full_name: string | null
          id: string
          reputation: number
          streak: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          reputation?: number
          streak?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          reputation?: number
          streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
      difficulty: "easy" | "medium" | "hard"
      event_type:
        | "oa"
        | "hackathon"
        | "contest"
        | "internship"
        | "placement_drive"
        | "interview"
      forum_category:
        | "dsa"
        | "resume"
        | "interview"
        | "oa"
        | "company"
        | "referrals"
        | "mock_interviews"
        | "internships"
        | "placements"
        | "general"
      interview_mode:
        | "campus"
        | "off_campus"
        | "referral"
        | "internship_conversion"
      interview_result: "selected" | "rejected" | "waitlisted" | "in_process"
      notification_type:
        | "like"
        | "comment"
        | "reply"
        | "mention"
        | "approval"
        | "rejection"
        | "new_oa"
        | "new_experience"
        | "new_event"
        | "badge"
      oa_language:
        | "javascript"
        | "typescript"
        | "python"
        | "java"
        | "cpp"
        | "c"
        | "go"
        | "rust"
      oa_submission_status:
        | "accepted"
        | "wrong_answer"
        | "runtime_error"
        | "time_limit_exceeded"
        | "compile_error"
        | "pending"
      vote_type: "up" | "down"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
      difficulty: ["easy", "medium", "hard"],
      event_type: [
        "oa",
        "hackathon",
        "contest",
        "internship",
        "placement_drive",
        "interview",
      ],
      forum_category: [
        "dsa",
        "resume",
        "interview",
        "oa",
        "company",
        "referrals",
        "mock_interviews",
        "internships",
        "placements",
        "general",
      ],
      interview_mode: [
        "campus",
        "off_campus",
        "referral",
        "internship_conversion",
      ],
      interview_result: ["selected", "rejected", "waitlisted", "in_process"],
      notification_type: [
        "like",
        "comment",
        "reply",
        "mention",
        "approval",
        "rejection",
        "new_oa",
        "new_experience",
        "new_event",
        "badge",
      ],
      oa_language: [
        "javascript",
        "typescript",
        "python",
        "java",
        "cpp",
        "c",
        "go",
        "rust",
      ],
      oa_submission_status: [
        "accepted",
        "wrong_answer",
        "runtime_error",
        "time_limit_exceeded",
        "compile_error",
        "pending",
      ],
      vote_type: ["up", "down"],
    },
  },
} as const
