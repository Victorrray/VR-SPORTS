/**
 * Check Subscriber Plan Status
 * Usage: node check-subscriber.js <userId>
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

async function checkSubscriber(userId) {
  try {
    console.log(`\n🔍 Checking subscriber: ${userId}\n`);

    // Get user data
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Error fetching user:", error.message);
      return;
    }

    if (!user) {
      console.error("❌ User not found");
      return;
    }

    // Display user information
    console.log("📋 User Information:");
    console.log("─".repeat(60));
    console.log(`  ID:                    ${user.id}`);
    console.log(`  Plan:                  ${user.plan || "❌ NO PLAN"}`);
    console.log(`  Grandfathered:         ${user.grandfathered ? "✅ Yes" : "❌ No"}`);
    console.log(`  API Request Count:     ${user.api_request_count || 0}`);
    console.log(`  Stripe Customer ID:    ${user.stripe_customer_id || "N/A"}`);
    console.log(`  Subscription End:      ${user.subscription_end_date || "N/A"}`);
    console.log(`  Created At:            ${user.created_at}`);
    console.log(`  Updated At:            ${user.updated_at}`);
    console.log("─".repeat(60));

    // Verify plan status
    console.log("\n✅ Plan Verification:");
    console.log("─".repeat(60));

    if (user.plan === "gold") {
      console.log("  ✅ GOLD PLAN - Correctly assigned!");
      console.log("  ✅ Full access to odds data");
      console.log("  ✅ API requests enabled");
      
      if (user.subscription_end_date) {
        const endDate = new Date(user.subscription_end_date);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`  ✅ Subscription valid for ${daysRemaining} more days`);
      }
    } else if (user.plan === "platinum") {
      console.log("  ✅ PLATINUM PLAN - Premium access!");
      console.log("  ✅ Full access to all features");
      console.log("  ✅ Priority support");
    } else if (user.plan === "free_trial") {
      console.log("  ⚠️  FREE TRIAL - Limited access");
      console.log("  ⚠️  Trial period active");
    } else if (user.plan === null) {
      console.log("  ❌ NO PLAN - User needs to subscribe");
    } else {
      console.log(`  ❌ UNKNOWN PLAN: ${user.plan}`);
    }

    console.log("─".repeat(60));

    // Check Stripe subscription if available
    if (user.stripe_customer_id) {
      console.log("\n💳 Stripe Information:");
      console.log("─".repeat(60));
      console.log(`  Customer ID:           ${user.stripe_customer_id}`);
      console.log("  ✅ Stripe customer linked");
      console.log("─".repeat(60));
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log("─".repeat(60));
    if (user.plan === "gold" || user.plan === "platinum" || user.grandfathered) {
      console.log("  ✅ SUBSCRIBER STATUS: ACTIVE");
      console.log("  ✅ Can access all features");
    } else if (user.plan === null) {
      console.log("  ⚠️  SUBSCRIBER STATUS: PENDING");
      console.log("  ⚠️  Needs to complete subscription");
    } else {
      console.log("  ❌ SUBSCRIBER STATUS: INACTIVE");
      console.log("  ❌ Plan not recognized");
    }
    console.log("─".repeat(60));
    console.log("");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error("❌ Usage: node check-subscriber.js <userId>");
  process.exit(1);
}

checkSubscriber(userId);
