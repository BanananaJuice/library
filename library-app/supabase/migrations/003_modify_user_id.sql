-- First, we need to drop existing foreign key constraints
ALTER TABLE bookshelves DROP CONSTRAINT bookshelves_user_id_fkey;
ALTER TABLE analytics DROP CONSTRAINT analytics_user_id_fkey;
ALTER TABLE reading_history DROP CONSTRAINT reading_history_user_id_fkey;

-- Change the type of user_id in all related tables
ALTER TABLE users 
  ALTER COLUMN id TYPE TEXT;
ALTER TABLE bookshelves 
  ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE analytics 
  ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE reading_history 
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate the foreign key constraints
ALTER TABLE bookshelves
  ADD CONSTRAINT bookshelves_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics
  ADD CONSTRAINT analytics_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reading_history
  ADD CONSTRAINT reading_history_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 