import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xspmzoyuhcvwbjqrwxov.supabase.co'; // Reemplaza por tu URL si cambia
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG16b3l1aGN2d2Jqcnd4b3YiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzA2NjQwNSwiZXhwIjo0ODczNjQyMDA1fQ.2Qw1QwQnQnQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw'; // Reemplaza por tu API Key o usa variable de entorno

export const supabase = createClient(supabaseUrl, supabaseKey); 