// Fixed webhook handler with better error logging
// Copy this to replace the webhook handler in server/index.js (lines 42-154)

app.post('/api/billing/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
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
        
        console.log(`🔍 Processing checkout.session.completed:`, {
          sessionId: session.id,
          userId: userId,
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
            type: stripeError.type,
            subscriptionId: session.subscription,
            fullError: stripeError.toString()
          });
          return res.status(500).json({ 
            error: 'Failed to retrieve subscription from Stripe',
            detail: stripeError.message 
          });
        }
        
        const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
        
        console.log(`💳 Subscription retrieved:`, {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          endDate: subscriptionEndDate.toISOString()
        });
        
        // Update user plan and subscription end date in Supabase
        console.log(`🔍 Updating Supabase for user: ${userId} with plan: gold`);
        const { error } = await supabase
          .from('users')
          .update({ 
            plan: 'gold',
            subscription_end_date: subscriptionEndDate.toISOString(),
            grandfathered: false,
            stripe_customer_id: subscription.customer,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (error) {
          console.error('❌ Failed to update user plan in Supabase:', {
            message: error.message,
            code: error.code,
            userId: userId,
            fullError: error.toString()
          });
          return res.status(500).json({ 
            error: 'Failed to update user plan',
            detail: error.message 
          });
        }
        
        console.log(`✅ Plan set to gold via webhook: ${userId}, expires: ${subscriptionEndDate}`);
      }
      
      // Handle subscription cancellation/deletion
      else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        
        // Find user by Stripe customer ID
        if (supabase && subscription.customer) {
          const { data: users, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer);
            
          if (!findError && users && users.length > 0) {
            const userId = users[0].id;
            
            // If subscription is canceled or deleted, remove plan access
            if (subscription.status === 'canceled' || subscription.status === 'unpaid' || event.type === 'customer.subscription.deleted') {
              const { error } = await supabase
                .from('users')
                .update({ 
                  plan: null,
                  subscription_end_date: null
                })
                .eq('id', userId);
                
              if (error) {
                console.error('❌ Failed to remove user plan in Supabase:', error);
                throw error;
              }
              
              console.log(`✅ Plan access removed via webhook: ${userId}`);
            }
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('❌ Webhook handling error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        fullError: error.toString()
      });
      res.status(500).json({ 
        error: 'Webhook handler failed',
        detail: error.message 
      });
    }
  }
);
