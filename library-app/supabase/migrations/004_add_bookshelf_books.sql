-- Create bookshelf_books junction table
CREATE TABLE bookshelf_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    bookshelf_id UUID NOT NULL REFERENCES bookshelves(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(book_id, bookshelf_id)
);

-- Create indexes for better performance
CREATE INDEX idx_bookshelf_books_book ON bookshelf_books(book_id);
CREATE INDEX idx_bookshelf_books_bookshelf ON bookshelf_books(bookshelf_id); 