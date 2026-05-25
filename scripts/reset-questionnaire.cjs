// One-off: clear test answers from the Kine-0123 client row.
// Uses the same anon key the app uses — works if Client table has open writes.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const TOKEN = process.argv[2] || 'Kine-0123';

(async () => {
  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('Client')
    .update({ questionnaireAnswers: null, questionnaireSubmittedAt: null })
    .ilike('token', TOKEN)
    .select('token, questionnaireAnswers, questionnaireSubmittedAt');

  if (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
  console.log('Reset OK:', data);
})();
