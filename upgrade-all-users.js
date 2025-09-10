require('dotenv').config({ path: './server/.env' });
// Script to upgrade all users to platinum plan
const { createClient } = require('@supabase/supabase-js');

async function upgradeAllUsers() {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, check if the plan column exists
    console.log('Checking database schema...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns', { table_name: 'profiles' });

    if (columnsError) {
      // If the function doesn't exist, create it
      console.log('Creating get_columns function...');
      const { error: createFnError } = await supabase.rpc('create_get_columns_function');
      if (createFnError) throw createFnError;
    }

    // Check if 'plan' column exists
    const hasPlanColumn = columns?.some(col => col.column_name === 'plan');

    if (!hasPlanColumn) {
      console.log('Adding plan column to profiles table...');
      // Create alter table function if it doesn't exist
      const { error: createAlterFnError } = await supabase.rpc('create_alter_table_function');
      if (createAlterFnError) throw createAlterFnError;
      
      // Add the column
      const { error: alterError } = await supabase.rpc('alter_table_add_column', {
        table_name: 'profiles',
        column_name: 'plan',
        column_type: 'TEXT DEFAULT \'free\''
      });
      if (alterError) throw alterError;
      console.log('Successfully added plan column');
    }

    // Get all users
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    console.log(`Found ${users.length} users to upgrade...`);

    // Update each user to platinum
    const { data: updatedUsers, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        plan: 'platinum',
        updated_at: new Date().toISOString()
      })
      .neq('plan', 'platinum')
      .select();

    if (updateError) throw updateError;

    console.log(`✅ Successfully upgraded ${updatedUsers.length} users to platinum plan`);
    
  } catch (error) {
    console.error('Error upgrading users:', error.message);
    process.exit(1);
  }
}

upgradeAllUsers();
