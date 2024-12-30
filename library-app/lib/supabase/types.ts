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
      authors: {
        Row: {
          id: string
          name: string
          biography: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          biography?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          biography?: string | null
          created_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author_id: string | null
          genre_id: string | null
          bookshelf_id: string | null
          isbn: string | null
          publication_year: number | null
          cover_image_url: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author_id?: string | null
          genre_id?: string | null
          bookshelf_id?: string | null
          isbn?: string | null
          publication_year?: number | null
          cover_image_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author_id?: string | null
          genre_id?: string | null
          bookshelf_id?: string | null
          isbn?: string | null
          publication_year?: number | null
          cover_image_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookshelves: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      genres: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 