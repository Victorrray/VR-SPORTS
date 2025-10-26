/**
 * Fix Subscriber Plan
 * Sets a user's plan to gold and subscription end date
 * Usage: node fix-subscriber-plan.js <userId> <plan>
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

async function fixSubscriberPlan(userId, plan = "gold") {
  try {
    console.log(`\n🔧 Fixing subscriber plan...\n`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Plan:    ${plan}`);

    // Calculate subscription end date (30 days from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    console.log(`  Expires: ${subscriptionEndDate.toISOString()}`);
    console.log("");

    // Update user plan
    const { error } = await supabase
      .from("users")
      .update({
        plan: plan,
        subscription_end_date: subscriptionEndDate.toISOString(),
        grandfathered: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Error updating user plan:", error.message);
      return false;
    }

    console.log("✅ Plan updated successfully!");
    console.log("");

    // Verify the update
    const { data: user, error: verifyError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (verifyError) {
      console.error("❌ Error verifying update:", verifyError.message);
      return false;
    }

    console.log("📋 Updated User Information:");
    console.log("─".repeat(60));
    console.log(`  ID:                    ${user.id}`);
    console.log(`  Plan:                  ${user.plan}`);
    console.log(`  Subscription End:      ${user.subscription_end_date}`);
    console.log(`  Grandfathered:         ${user.grandfathered ? "Yes" : "No"}`);
    console.log(`  Updated At:            ${user.updated_at}`);
    console.log("─".repeat(60));
    console.log("");
    console.log("✅ Subscriber is now ready to use the platform!");
    console.log("");

    return true;

  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
const plan = process.argv[3] || "gold";

if (!userId) {
  console.error("❌ Usage: node fix-subscriber-plan.js <userId> [plan]");
  console.error("   Example: node fix-subscriber-plan.js 598347f4-66a9-447d-9421-0523eeb1dc94 gold");
  process.exit(1);
}

fixSubscriberPlan(userId, plan);
