import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lqjiduikifwpacmgliid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxamlkdWlraWZ3cGFjbWdsaWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDI1MzQsImV4cCI6MjA5MzkxODUzNH0.QTyYD_B288bXFZzIA4PkhScxaWywakQPsJIzJliF0Nw'
);

async function testInsert() {
  const { data, error } = await supabase
    .from('incidents')
    .insert([{
      type: 'TEST',
      description: 'Test incident from script',
      severity: 'low',
      reporter_name: 'Debug Script'
    }])
    .select();

  if (error) {
    console.error("INSERT FAILED:", error);
  } else {
    console.log("INSERT SUCCESSFUL:", data);
  }
}

testInsert();
