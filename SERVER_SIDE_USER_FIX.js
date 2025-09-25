// SERVER-SIDE USER CREATION FIX
// Replace the getUserProfile function in server/index.js

// Enhanced getUserProfile function that handles user creation properly
async function getUserProfile(userId) {
  if (!supabase) {
    // Fallback to in-memory storage if Supabase not configured
    if (!userUsage.has(userId)) {
      userUsage.set(userId, {
        id: userId,
        plan: 'free',
        api_request_count: 0,
        created_at: new Date().toISOString()
      });
    }
    return userUsage.get(userId);
  }

  try {
    // First, try to get existing user
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // User doesn't exist, create them
      console.log(`🆕 Creating new user: ${userId}`);
      
      // Create user with all required fields
      const newUser = {
        id: userId,
        plan: null, // New users must subscribe
        api_request_count: 0,
        grandfathered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (insertErr) {
        console.error('❌ Failed to create user:', insertErr);
        
        // Check if it's a constraint violation
        if (insertErr.code === '23514') {
          console.error('❌ Plan constraint violation - fixing database constraint...');
          throw new Error('Database constraint error: Plan constraint too restrictive. Please contact support.');
        }
        
        // Check if it's a missing column error
        if (insertErr.code === '42703') {
          console.error('❌ Missing column error:', insertErr.message);
          throw new Error('Database schema error: Missing required columns. Please contact support.');
        }
        
        throw new Error(`Database error creating user: ${insertErr.message} (Code: ${insertErr.code})`);
      }

      console.log(`✅ Successfully created user: ${userId}`);
      return inserted;
    }

    if (error) {
      console.error('❌ Database error fetching user:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    // User exists, check subscription status
    if ((data.plan === 'gold' || data.plan === 'platinum') && data.subscription_end_date && !data.grandfathered) {
      const now = new Date();
      const endDate = new Date(data.subscription_end_date);

      if (now > endDate) {
        // Subscription expired, remove plan
        const { error: updateError } = await supabase
          .from("users")
          .update({ plan: null })
          .eq("id", userId);

        if (!updateError) {
          data.plan = null;
          console.log(`⏰ Subscription expired for user: ${userId}`);
        }
      }
    }

    return data;

  } catch (error) {
    console.error('❌ getUserProfile error:', error);
    throw error;
  }
}
