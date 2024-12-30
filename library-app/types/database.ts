export type Database = {
  public: {
    Tables: {
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
          email: string
          full_name?: string
          avatar_url?: string
        }
        Update: {
          email?: string
          full_name?: string
          avatar_url?: string
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
          title: string
          author_id?: string
          genre_id?: string
          bookshelf_id?: string
          isbn?: string
          publication_year?: number
          cover_image_url?: string
          description?: string
        }
        Update: {
          title?: string
          author_id?: string
          genre_id?: string
          bookshelf_id?: string
          isbn?: string
          publication_year?: number
          cover_image_url?: string
          description?: string
        }
      }
      // Add other table types as needed
    }
  }
} 