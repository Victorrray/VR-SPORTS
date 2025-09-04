-- ============================================
-- VR-Odds Database Schema
-- User data persistence and betting features
-- ============================================

-- Extend existing profiles table with betting-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  display_name text,
  avatar_url text,
  bankroll numeric(10,2) DEFAULT 1000.00,
  default_bet_size numeric(8,2) DEFAULT 10.00,
  risk_tolerance text DEFAULT 'medium' CHECK (risk_tolerance IN ('conservative', 'medium', 'aggressive')),
  preferred_sports text[] DEFAULT '{}',
  preferred_regions text[] DEFAULT '{}',
  alert_settings jsonb DEFAULT '{}',
  betting_stats jsonb DEFAULT '{}',
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  subscription_expires_at timestamptz;

-- User betting history
CREATE TABLE IF NOT EXISTS public.bet_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  bet_type text NOT NULL CHECK (bet_type IN ('single', 'parlay', 'round_robin')),
  sport text NOT NULL,
  game_id text NOT NULL,
  selections jsonb NOT NULL, -- Array of bet selections
  stake numeric(8,2) NOT NULL,
  potential_payout numeric(10,2) NOT NULL,
  odds numeric(8,2) NOT NULL,
  edge_percentage numeric(5,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'cancelled')),
  placed_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  actual_payout numeric(10,2),
  bookmaker text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User watchlists for games and odds
CREATE TABLE IF NOT EXISTS public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  games jsonb NOT NULL DEFAULT '[]', -- Array of game IDs
  alert_triggers jsonb DEFAULT '{}', -- Alert conditions
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User alert preferences and history
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('high_ev', 'line_movement', 'live_betting', 'arbitrage', 'custom')),
  title text NOT NULL,
  message text NOT NULL,
  game_data jsonb,
  trigger_conditions jsonb,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  action_taken boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- User bankroll transactions
CREATE TABLE IF NOT EXISTS public.bankroll_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'bet_stake', 'bet_payout', 'adjustment')),
  amount numeric(10,2) NOT NULL,
  balance_before numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  description text,
  bet_id uuid REFERENCES public.bet_history(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User saved bet templates
CREATE TABLE IF NOT EXISTS public.bet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_data jsonb NOT NULL, -- Bet configuration
  sport text,
  market_type text,
  is_favorite boolean DEFAULT false,
  use_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  pages_visited text[] DEFAULT '{}',
  bets_placed integer DEFAULT 0,
  total_stake numeric(10,2) DEFAULT 0,
  device_info jsonb,
  ip_address inet
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bet_history_user_id ON public.bet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_placed_at ON public.bet_history(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bet_history_status ON public.bet_history(status);
CREATE INDEX IF NOT EXISTS idx_bet_history_sport ON public.bet_history(sport);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_active ON public.watchlists(is_active);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_created_at ON public.user_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_alerts_unread ON public.user_alerts(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_bankroll_transactions_user_id ON public.bankroll_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bankroll_transactions_created_at ON public.bankroll_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bet_templates_user_id ON public.bet_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_templates_favorite ON public.bet_templates(user_id, is_favorite) WHERE is_favorite = true;

-- RLS Policies
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankroll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Bet History Policies
CREATE POLICY bet_history_select_own ON public.bet_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bet_history_insert_own ON public.bet_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bet_history_update_own ON public.bet_history
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlists Policies
CREATE POLICY watchlists_select_own ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY watchlists_insert_own ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY watchlists_update_own ON public.watchlists
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY watchlists_delete_own ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- User Alerts Policies
CREATE POLICY user_alerts_select_own ON public.user_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_alerts_insert_own ON public.user_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alerts_update_own ON public.user_alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alerts_delete_own ON public.user_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Bankroll Transactions Policies
CREATE POLICY bankroll_transactions_select_own ON public.bankroll_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bankroll_transactions_insert_own ON public.bankroll_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bet Templates Policies
CREATE POLICY bet_templates_select_own ON public.bet_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bet_templates_insert_own ON public.bet_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bet_templates_update_own ON public.bet_templates
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY bet_templates_delete_own ON public.bet_templates
  FOR DELETE USING (auth.uid() = user_id);

-- User Sessions Policies
CREATE POLICY user_sessions_select_own ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_sessions_insert_own ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sessions_update_own ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_bet_history_updated_at ON public.bet_history;
CREATE TRIGGER trg_bet_history_updated_at
  BEFORE UPDATE ON public.bet_history
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_watchlists_updated_at ON public.watchlists;
CREATE TRIGGER trg_watchlists_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bet_templates_updated_at ON public.bet_templates;
CREATE TRIGGER trg_bet_templates_updated_at
  BEFORE UPDATE ON public.bet_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Utility functions
CREATE OR REPLACE FUNCTION public.get_user_betting_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'total_bets', COUNT(*),
    'total_stake', COALESCE(SUM(stake), 0),
    'total_payout', COALESCE(SUM(CASE WHEN status = 'won' THEN actual_payout ELSE 0 END), 0),
    'win_rate', CASE WHEN COUNT(*) > 0 THEN 
      ROUND((COUNT(*) FILTER (WHERE status = 'won')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0 END,
    'profit_loss', COALESCE(SUM(CASE 
      WHEN status = 'won' THEN actual_payout - stake
      WHEN status = 'lost' THEN -stake
      ELSE 0 END), 0),
    'avg_odds', COALESCE(AVG(odds), 0),
    'avg_edge', COALESCE(AVG(edge_percentage), 0),
    'favorite_sport', (
      SELECT sport 
      FROM public.bet_history 
      WHERE user_id = user_uuid 
      GROUP BY sport 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    )
  )
  FROM public.bet_history
  WHERE user_id = user_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_betting_stats(uuid) TO authenticated;
