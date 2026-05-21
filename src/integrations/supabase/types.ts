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
      campaign_messages: {
        Row: {
          body: string
          campaign_id: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          body: string
          campaign_id: string
          created_at?: string
          id?: string
          title?: string
        }
        Update: {
          body?: string
          campaign_id?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "scheduled_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          auth: string | null
          created_at: string
          device_id: string
          p256dh: string | null
          platform: string
          token: string
          updated_at: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          device_id: string
          p256dh?: string | null
          platform: string
          token: string
          updated_at?: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          device_id?: string
          p256dh?: string | null
          platform?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      light_actions: {
        Row: {
          action_date: string
          action_type: string
          created_at: string
          device_id: string
          id: string
          points_awarded: number
          ref_id: string | null
        }
        Insert: {
          action_date?: string
          action_type: string
          created_at?: string
          device_id: string
          id?: string
          points_awarded?: number
          ref_id?: string | null
        }
        Update: {
          action_date?: string
          action_type?: string
          created_at?: string
          device_id?: string
          id?: string
          points_awarded?: number
          ref_id?: string | null
        }
        Relationships: []
      }
      light_points: {
        Row: {
          created_at: string
          current_streak: number
          device_id: string
          last_active_date: string | null
          referral_code: string
          today_date: string
          today_points: number
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          device_id: string
          last_active_date?: string | null
          referral_code?: string
          today_date?: string
          today_points?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          device_id?: string
          last_active_date?: string | null
          referral_code?: string
          today_date?: string
          today_points?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          campaign_id: string | null
          device_id: string
          id: string
          message_index: number
          sent_at: string
        }
        Insert: {
          campaign_id?: string | null
          device_id: string
          id?: string
          message_index: number
          sent_at?: string
        }
        Update: {
          campaign_id?: string | null
          device_id?: string
          id?: string
          message_index?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "scheduled_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_support_groups: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          description: string | null
          end_time: string | null
          external_key: string
          format: string
          id: string
          last_verified_at: string
          location: string
          location_label: string | null
          source: string
          start_time: string | null
          tags: string[] | null
          time_label: string | null
          title: string
          updated_at: string
          zoom_id: string | null
          zoom_password: string | null
          zoom_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          description?: string | null
          end_time?: string | null
          external_key: string
          format?: string
          id?: string
          last_verified_at?: string
          location: string
          location_label?: string | null
          source?: string
          start_time?: string | null
          tags?: string[] | null
          time_label?: string | null
          title: string
          updated_at?: string
          zoom_id?: string | null
          zoom_password?: string | null
          zoom_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          description?: string | null
          end_time?: string | null
          external_key?: string
          format?: string
          id?: string
          last_verified_at?: string
          location?: string
          location_label?: string | null
          source?: string
          start_time?: string | null
          tags?: string[] | null
          time_label?: string | null
          title?: string
          updated_at?: string
          zoom_id?: string | null
          zoom_password?: string | null
          zoom_url?: string | null
        }
        Relationships: []
      }
      peer_support_refresh_log: {
        Row: {
          error: string | null
          groups_count: number | null
          id: string
          ran_at: string
          source: string
          success: boolean
        }
        Insert: {
          error?: string | null
          groups_count?: number | null
          id?: string
          ran_at?: string
          source?: string
          success: boolean
        }
        Update: {
          error?: string | null
          groups_count?: number | null
          id?: string
          ran_at?: string
          source?: string
          success?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_id: string
          endpoint: string
          id: string
          last_notified_at: string | null
          notifications_this_week: number
          p256dh: string
          week_start: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          device_id: string
          endpoint: string
          id?: string
          last_notified_at?: string | null
          notifications_this_week?: number
          p256dh: string
          week_start?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          device_id?: string
          endpoint?: string
          id?: string
          last_notified_at?: string | null
          notifications_this_week?: number
          p256dh?: string
          week_start?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          address: string
          category: string
          close_time: string | null
          created_at: string
          distance: string
          hours: string
          id: string
          is_always_open: boolean
          lat: number | null
          lng: number | null
          name: string
          open_days: number[] | null
          open_time: string | null
          phone: string | null
          schedule: Json | null
          tags: string[] | null
          website: string | null
        }
        Insert: {
          address: string
          category: string
          close_time?: string | null
          created_at?: string
          distance?: string
          hours?: string
          id: string
          is_always_open?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          open_days?: number[] | null
          open_time?: string | null
          phone?: string | null
          schedule?: Json | null
          tags?: string[] | null
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          close_time?: string | null
          created_at?: string
          distance?: string
          hours?: string
          id?: string
          is_always_open?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          open_days?: number[] | null
          open_time?: string | null
          phone?: string | null
          schedule?: Json | null
          tags?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      scheduled_campaigns: {
        Row: {
          active: boolean
          created_at: string
          end_date: string
          id: string
          name: string
          recurrence: string
          start_date: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date: string
          id?: string
          name: string
          recurrence?: string
          start_date: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          recurrence?: string
          start_date?: string
        }
        Relationships: []
      }
      street_tips: {
        Row: {
          category: string
          content: string
          created_at: string
          device_id: string | null
          id: string
          upvotes: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          device_id?: string | null
          id?: string
          upvotes?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          device_id?: string | null
          id?: string
          upvotes?: number
        }
        Relationships: []
      }
      tip_reports: {
        Row: {
          created_at: string
          device_id: string
          id: string
          tip_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          tip_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tip_reports_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "street_tips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_light_points: {
        Args: { _action_type: string; _device_id: string; _ref_id?: string }
        Returns: Json
      }
      credit_referrer: {
        Args: { _new_device_id: string; _ref_code: string }
        Returns: Json
      }
      update_streak: { Args: { _device_id: string }; Returns: Json }
      upvote_tip: { Args: { tip_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
