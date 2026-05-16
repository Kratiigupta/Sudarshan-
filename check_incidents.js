import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lqjiduikifwpacmgliid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxamlkdWlraWZ3cGFjbWdsaWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDI1MzQsImV4cCI6MjA5MzkxODUzNH0.QTyYD_B288bXFZzIA4PkhScxaWywakQPsJIzJliF0Nw'
);

async function checkIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log("--- SOS SYNC VERIFICATION ---");
  if (data.length === 0) {
     console.log("No incidents found in database.");
  } else {
    data.forEach(inc => {
      console.log(`[${inc.created_at}] TYPE: ${inc.type} | REPORTER: ${inc.reporter_name} | STATUS: ${inc.status}`);
    });
  }
}

checkIncidents();
