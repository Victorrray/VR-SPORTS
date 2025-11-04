/**
 * Test User Authentication & Plan Verification
 * Comprehensive check of user auth state and plan verification
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testUserAuth(userId) {
  console.log(`\n🔍 COMPREHENSIVE USER AUTH & PLAN VERIFICATION\n`);
  console.log(`Testing User: ${userId}\n`);
  console.log("─".repeat(70));

  try {
    // 1. Check user exists in database
    console.log("\n1️⃣  DATABASE USER RECORD");
    console.log("─".repeat(70));
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("❌ User not found in database:", userError.message);
      return;
    }

    console.log("✅ User found in database");
    console.log(`   ID: ${user.id}`);
    console.log(`   Plan: ${user.plan || "NULL"}`);
    console.log(`   Grandfathered: ${user.grandfathered}`);
    console.log(`   Stripe Customer: ${user.stripe_customer_id || "N/A"}`);
    console.log(`   Subscription End: ${user.subscription_end_date || "N/A"}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Updated: ${user.updated_at}`);

    // 2. Check Supabase Auth User
    console.log("\n2️⃣  SUPABASE AUTH USER");
    console.log("─".repeat(70));
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("❌ Error fetching auth users:", authError.message);
    } else {
      const authUser = users.find(u => u.id === userId);
      if (authUser) {
        console.log("✅ Auth user found");
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email || "N/A"}`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? "✅ Yes" : "❌ No"}`);
        console.log(`   Created: ${authUser.created_at}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at || "Never"}`);
      } else {
        console.warn("⚠️  Auth user not found");
      }
    }

    // 3. Verify Plan Logic
    console.log("\n3️⃣  PLAN VERIFICATION LOGIC");
    console.log("─".repeat(70));
    
    const isPlatinum = user.plan === 'platinum';
    const isGrandfathered = user.grandfathered;
    const hasValidPlan = isPlatinum || isGrandfathered;
    
    console.log(`   Is Platinum: ${isPlatinum ? "✅ Yes" : "❌ No"}`);
    console.log(`   Is Grandfathered: ${isGrandfathered ? "✅ Yes" : "❌ No"}`);
    console.log(`   Has Valid Plan: ${hasValidPlan ? "✅ Yes" : "❌ No"}`);
    
    if (hasValidPlan) {
      console.log(`   ✅ USER SHOULD HAVE FULL ACCESS`);
    } else {
      console.log(`   ❌ USER DOES NOT HAVE FULL ACCESS`);
    }

    // 4. Check Subscription Status
    console.log("\n4️⃣  SUBSCRIPTION STATUS");
    console.log("─".repeat(70));
    
    if (user.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date);
      const now = new Date();
      const isActive = endDate > now;
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`   Subscription End: ${endDate.toISOString()}`);
      console.log(`   Days Remaining: ${daysRemaining}`);
      console.log(`   Status: ${isActive ? "✅ ACTIVE" : "❌ EXPIRED"}`);
    } else {
      console.log(`   ⚠️  No subscription end date set`);
    }

    // 5. API Response Simulation
    console.log("\n5️⃣  API /me RESPONSE SIMULATION");
    console.log("─".repeat(70));
    
    let apiResponse;
    if (user.plan === 'platinum' || user.grandfathered) {
      apiResponse = {
        plan: 'platinum',
        remaining: null,
        limit: null,
        unlimited: true,
        used: user.api_request_count || 0
      };
    } else {
      const limit = 250;
      const used = user.api_request_count || 0;
      const remaining = Math.max(0, limit - used);
      apiResponse = {
        plan: user.plan || 'free',
        remaining,
        limit,
        used,
        unlimited: false
      };
    }
    
    console.log("   API would return:");
    console.log(JSON.stringify(apiResponse, null, 2).split('\n').map(l => '   ' + l).join('\n'));

    // 6. Frontend useMe Hook Simulation
    console.log("\n6️⃣  FRONTEND useMe HOOK SIMULATION");
    console.log("─".repeat(70));
    
    const me = apiResponse ? {
      plan: apiResponse.plan || 'free',
      remaining: apiResponse.remaining,
      limit: apiResponse.limit,
      calls_made: apiResponse.used || 0,
      unlimited: apiResponse.unlimited || false
    } : {
      plan: 'free',
      remaining: 250,
      limit: 250,
      calls_made: 0,
      unlimited: false
    };
    
    console.log("   Frontend me object:");
    console.log(JSON.stringify(me, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    
    // 7. Summary
    console.log("\n7️⃣  SUMMARY");
    console.log("─".repeat(70));
    
    if (me.plan === 'platinum' && me.unlimited) {
      console.log("✅ USER IS PROPERLY VERIFIED AS PLATINUM");
      console.log("✅ Frontend should show: Platinum plan with unlimited access");
    } else if (me.plan === 'gold') {
      console.log("⚠️  USER IS GOLD PLAN");
      console.log(`⚠️  Frontend should show: Gold plan with ${me.remaining}/${me.limit} API calls`);
    } else {
      console.log("❌ USER IS FREE PLAN");
      console.log(`❌ Frontend should show: Free plan with ${me.remaining}/${me.limit} API calls`);
    }

    console.log("\n" + "─".repeat(70));
    console.log("");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error("❌ Usage: node test-user-auth.js <userId>");
  process.exit(1);
}

testUserAuth(userId);
