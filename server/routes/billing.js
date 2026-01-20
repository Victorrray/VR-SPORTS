/**
 * Billing Routes
 * Endpoints for Stripe subscription management and webhooks
 */

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { requireUser } = require('../middleware/auth');
const { STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_GOLD, STRIPE_PRICE_PLATINUM, FRONTEND_URL } = require('../config/constants');

/**
 * POST /api/billing/webhook
 * Stripe webhook handler for subscription events
 * CRITICAL: Must use raw body parser BEFORE express.json()
 */
router.post('/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const stripe = req.app.locals.stripe;
      const supabase = req.app.locals.supabase;

      console.log('🔵 Webhook endpoint hit:', { path: req.path, method: req.method, hasBody: !!req.body });
      
      if (!stripe) {
        console.error('❌ Stripe not configured');
        return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' });
      }
      
      const sig = req.headers['stripe-signature'];
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        console.log(`📨 Webhook received: ${event.type}`);
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const planFromMetadata = session.metadata?.plan;
          
          console.log(`🔍 Processing checkout.session.completed:`, {
            sessionId: session.id,
            userId: userId,
            plan: planFromMetadata,
            hasSubscription: !!session.subscription,
            supabaseConnected: !!supabase
          });
          
          if (!userId) {
            console.error('❌ userId missing from checkout session metadata');
            return res.status(400).json({ error: 'userId not in metadata' });
          }
          
          if (!supabase) {
            console.error('❌ Supabase not configured');
            return res.status(500).json({ error: 'Supabase not configured' });
          }
          
          // Get subscription details from Stripe
          console.log(`🔍 Attempting to retrieve subscription: ${session.subscription}`);
          let subscription;
          try {
            subscription = await stripe.subscriptions.retrieve(session.subscription);
            console.log(`✅ Subscription retrieved successfully`);
          } catch (stripeError) {
            console.error('❌ Failed to retrieve subscription from Stripe:', {
              message: stripeError.message,
              code: stripeError.code,
              subscriptionId: session.subscription
            });
            return res.status(500).json({ error: 'Failed to retrieve subscription from Stripe' });
          }
          
          // Get subscription end date - try multiple fields
          console.log('📊 Subscription object fields:', {
            current_period_end: subscription.current_period_end,
            current_period_start: subscription.current_period_start,
            trial_end: subscription.trial_end,
            ended_at: subscription.ended_at,
            cancel_at: subscription.cancel_at,
            cancel_at_period_end: subscription.cancel_at_period_end,
            billing_cycle_anchor: subscription.billing_cycle_anchor
          });
          
          // Use current_period_end, or fallback to 30 days from now
          let endTimestamp = subscription.current_period_end;
          if (!endTimestamp) {
            console.warn('⚠️ current_period_end missing, using 30 days from now as fallback');
            endTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
          }
          
          const subscriptionEndDate = new Date(endTimestamp * 1000);
          
          // Validate the date is valid
          if (isNaN(subscriptionEndDate.getTime())) {
            console.error('❌ Invalid subscription end date:', {
              endTimestamp: endTimestamp,
              calculated: subscriptionEndDate
            });
            return res.status(500).json({ error: 'Invalid subscription end date' });
          }
          
          console.log(`💳 Subscription retrieved:`, {
            subscriptionId: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            endDate: subscriptionEndDate.toISOString()
          });
          
          // Use the plan from metadata, default to 'platinum' if not specified
          const planToSet = planFromMetadata || 'platinum';
          
          // Update user plan and subscription end date in Supabase
          console.log(`🔍 About to update Supabase for user: ${userId} with plan: ${planToSet}`);
          const { error } = await supabase
            .from('users')
            .update({ 
              plan: planToSet,
              subscription_end_date: subscriptionEndDate.toISOString(),
              grandfathered: false,  // Paying users are not grandfathered
              stripe_customer_id: subscription.customer,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (error) {
            console.error('❌ Failed to update user plan in Supabase:', error);
            throw error;
          }
          
          console.log(`✅ Plan set to ${planToSet} via webhook: ${userId}, expires: ${subscriptionEndDate}`);
        }
        
        // Handle subscription cancellation/deletion/update
        else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
          const subscription = event.data.object;
          
          // Find user by Stripe customer ID
          if (supabase && subscription.customer) {
            const { data: users, error: findError } = await supabase
              .from('users')
              .select('id, plan')
              .eq('stripe_customer_id', subscription.customer);
              
            if (!findError && users && users.length > 0) {
              const userId = users[0].id;
              const currentPlan = users[0].plan;
              
              console.log(`📊 Subscription status update for user ${userId}: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);
              
              // If subscription is set to cancel at period end, DON'T remove access yet
              // User keeps access until the subscription actually ends
              if (subscription.cancel_at_period_end && subscription.status === 'active') {
                console.log(`⏳ Subscription scheduled to cancel at period end for user ${userId} - keeping access`);
                const { error } = await supabase
                  .from('users')
                  .update({ 
                    cancel_at_period_end: true,
                    subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                    subscription_status: 'active_until_period_end',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (error) {
                  console.error('❌ Failed to update cancel_at_period_end in Supabase:', error);
                }
              }
              // Only remove plan access when subscription is ACTUALLY deleted or truly canceled (not just scheduled)
              else if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
                const { error } = await supabase
                  .from('users')
                  .update({ 
                    plan: null,
                    subscription_end_date: null,
                    cancel_at_period_end: false,
                    subscription_status: subscription.status,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (error) {
                  console.error('❌ Failed to remove user plan in Supabase:', error);
                  throw error;
                }
                
                console.log(`✅ Plan access removed via webhook: ${userId} (status: ${subscription.status})`);
              }
              // If subscription is past_due - give 3-day grace period before restricting
              else if (subscription.status === 'past_due') {
                // Calculate grace period end (3 days from now)
                const gracePeriodEnd = new Date();
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
                
                const { error } = await supabase
                  .from('users')
                  .update({ 
                    subscription_status: 'past_due',
                    grace_period_end: gracePeriodEnd.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (error) {
                  console.error('❌ Failed to update past_due status in Supabase:', error);
                  throw error;
                }
                
                console.log(`⚠️ Subscription past_due for user ${userId} - grace period until ${gracePeriodEnd.toISOString()}`);
              }
              // If subscription is active again (payment succeeded after past_due)
              else if (subscription.status === 'active' && currentPlan) {
                const { error } = await supabase
                  .from('users')
                  .update({ 
                    subscription_status: 'active',
                    grace_period_end: null,
                    subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (error) {
                  console.error('❌ Failed to update active status in Supabase:', error);
                  throw error;
                }
                
                console.log(`✅ Subscription reactivated for user ${userId}`);
              }
            }
          }
        }
        
        // Handle invoice payment failed - this fires when a payment attempt fails
        else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const attemptCount = invoice.attempt_count || 1;
          
          console.log(`💳 Payment failed for customer ${customerId} (attempt ${attemptCount})`);
          
          if (supabase && customerId) {
            const { data: users, error: findError } = await supabase
              .from('users')
              .select('id, email, plan')
              .eq('stripe_customer_id', customerId);
              
            if (!findError && users && users.length > 0) {
              const userId = users[0].id;
              const userEmail = users[0].email;
              
              // Update payment failure tracking
              const { error } = await supabase
                .from('users')
                .update({ 
                  last_payment_failure: new Date().toISOString(),
                  payment_failure_count: attemptCount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
              if (error) {
                console.error('❌ Failed to update payment failure in Supabase:', error);
              }
              
              console.log(`⚠️ Payment failed for user ${userId} (${userEmail}) - attempt ${attemptCount}`);
              
              // After 3 failed attempts, Stripe will typically cancel the subscription
              // The customer.subscription.updated webhook will handle plan removal
              if (attemptCount >= 3) {
                console.log(`🚨 Multiple payment failures for user ${userId} - subscription may be canceled soon`);
              }
            }
          }
        }
        
        // Handle invoice payment succeeded - clear any payment failure flags
        else if (event.type === 'invoice.payment_succeeded') {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          
          console.log(`✅ Payment succeeded for customer ${customerId}`);
          
          if (supabase && customerId) {
            const { data: users, error: findError } = await supabase
              .from('users')
              .select('id')
              .eq('stripe_customer_id', customerId);
              
            if (!findError && users && users.length > 0) {
              const userId = users[0].id;
              
              // Clear payment failure tracking
              const { error } = await supabase
                .from('users')
                .update({ 
                  last_payment_failure: null,
                  payment_failure_count: 0,
                  subscription_status: 'active',
                  grace_period_end: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
              if (error) {
                console.error('❌ Failed to clear payment failure in Supabase:', error);
              }
              
              console.log(`✅ Payment success recorded for user ${userId}`);
            }
          }
        }
        
        res.json({ received: true });
      } catch (error) {
        console.error('❌ Webhook handling error:', { message: error.message, code: error.code, stack: error.stack, fullError: error.toString() });
        res.status(500).send('Webhook handler failed');
      }
    } catch (error) {
      console.error('❌ Webhook outer error:', error);
      res.status(500).send('Webhook handler failed');
    }
  }
);

/**
 * POST /api/billing/create-checkout-session
 * Creates a Stripe checkout session for subscription
 */
router.post('/create-checkout-session', requireUser, async (req, res) => {
  try {
    const stripe = req.app.locals.stripe;
    const { plan = 'platinum' } = req.body;
    
    console.log('🔍 Checkout session request received');
    console.log('🔍 Requested plan:', plan);
    console.log('🔍 Stripe configured:', !!stripe);
    console.log('🔍 STRIPE_PRICE_GOLD:', STRIPE_PRICE_GOLD);
    console.log('🔍 STRIPE_PRICE_PLATINUM:', STRIPE_PRICE_PLATINUM);
    console.log('🔍 FRONTEND_URL:', FRONTEND_URL);
    
    if (!stripe) {
      console.error('❌ Stripe not configured');
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured', hint: 'Set STRIPE_SECRET_KEY in backend env' });
    }
    
    // Select the correct price ID based on requested plan
    const priceId = plan === 'gold' ? STRIPE_PRICE_GOLD : STRIPE_PRICE_PLATINUM;
    const planName = plan === 'gold' ? 'Gold' : 'Platinum';
    
    if (!priceId) {
      console.error(`❌ STRIPE_PRICE_${planName.toUpperCase()} not set`);
      return res.status(500).json({ 
        code: 'MISSING_ENV', 
        message: `STRIPE_PRICE_${planName.toUpperCase()} not set`, 
        hint: `Set STRIPE_PRICE_${planName.toUpperCase()} (Price ID) in backend env` 
      });
    }
    
    const userId = req.__userId;
    console.log('🔍 User ID:', userId);
    
    if (!userId || userId === 'demo-user') {
      console.error('❌ Invalid user ID');
      return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Authenticated user required' });
    }

    console.log(`✅ Creating ${planName} checkout session for user: ${userId}`);
    console.log(`✅ Using price ID: ${priceId}`);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.toLowerCase()}`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
      allow_promotion_codes: true,
      metadata: { 
        userId, 
        plan: plan.toLowerCase()
      }
    });
    
    console.log(`✅ Created ${planName} checkout session: ${session.id} for user: ${userId}`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      code: 'CHECKOUT_START_FAILED', 
      message: error.message,
      detail: error.message,
      type: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/billing/cancel-subscription
 * Cancels user's Stripe subscription
 */
router.post('/cancel-subscription', requireUser, async (req, res) => {
  try {
    const stripe = req.app.locals.stripe;
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const userId = req.__userId;

    // Handle demo mode when Supabase is not configured
    if (!supabase) {
      // Fallback to in-memory storage
      const userData = userUsage.get(userId);
      if (userData && userData.plan === 'platinum') {
        userData.plan = 'free';
        userUsage.set(userId, userData);
        console.log(`✅ Demo mode: Downgraded ${userId} from platinum to free`);
        return res.json({
          success: true,
          message: 'Subscription cancelled successfully (demo mode)',
          cancel_at_period_end: true,
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
        });
      } else {
        return res.status(400).json({ error: 'No active subscription found' });
      }
    }

    // Get user's current subscription from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Set subscription end date and cancel flag instead of immediately removing access
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_end_date: subscriptionEndDate.toISOString(),
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return res.status(500).json({ error: 'Failed to update user plan' });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/billing/customer-portal
 * Creates a Stripe customer portal session for managing billing
 */
router.post('/customer-portal', requireUser, async (req, res) => {
  try {
    const stripe = req.app.locals.stripe;
    const supabase = req.app.locals.supabase;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const userId = req.__userId;

    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ error: 'Authenticated user required' });
    }

    // Get user's Stripe customer ID from Supabase
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${FRONTEND_URL}/account`,
    });

    console.log(`✅ Created customer portal session for user: ${userId}`);
    res.json({ url: session.url });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

module.exports = router;
