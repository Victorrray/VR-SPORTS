// Betting data management hook
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './SimpleAuth';
import { db, isSupabaseEnabled } from '../utils/supabase';

export const useBettingData = () => {
  const { user, profile } = useAuth();
  const [betHistory, setBetHistory] = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [bankrollTransactions, setBankrollTransactions] = useState([]);
  const [betTemplates, setBetTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user betting data
  const fetchBettingData = useCallback(async () => {
    if (!user || !isSupabaseEnabled) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch bet history
      const { data: bets, error: betsError } = await db
        .from('bet_history')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });

      if (betsError) throw betsError;
      setBetHistory(bets || []);

      // Fetch watchlists
      const { data: lists, error: listsError } = await db
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;
      setWatchlists(lists || []);

      // Fetch alerts
      const { data: userAlerts, error: alertsError } = await db
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alertsError) throw alertsError;
      setAlerts(userAlerts || []);

      // Fetch bankroll transactions
      const { data: transactions, error: transactionsError } = await db
        .from('bankroll_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setBankrollTransactions(transactions || []);

      // Fetch bet templates
      const { data: templates, error: templatesError } = await db
        .from('bet_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setBetTemplates(templates || []);

    } catch (err) {
      console.error('Error fetching betting data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Place a bet
  const placeBet = useCallback(async (betData) => {
    if (!user || !isSupabaseEnabled) {
      throw new Error('Authentication required');
    }

    const { data, error } = await db
      .from('bet_history')
      .insert({
        user_id: user.id,
        ...betData,
        placed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Add to local state
    setBetHistory(prev => [data, ...prev]);

    // Record bankroll transaction
    await recordBankrollTransaction({
      transaction_type: 'bet_stake',
      amount: -betData.stake,
      description: `Bet placed: ${betData.selections[0]?.team || 'Multiple selections'}`,
      bet_id: data.id
    });

    return data;
  }, [user]);

  // Update bet status (win/loss)
  const updateBetStatus = useCallback(async (betId, status, actualPayout = 0) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('bet_history')
      .update({
        status,
        actual_payout: actualPayout,
        settled_at: new Date().toISOString()
      })
      .eq('id', betId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setBetHistory(prev => 
      prev.map(bet => bet.id === betId ? data : bet)
    );

    // Record payout transaction if won
    if (status === 'won' && actualPayout > 0) {
      await recordBankrollTransaction({
        transaction_type: 'bet_payout',
        amount: actualPayout,
        description: `Bet won: ${data.selections[0]?.team || 'Multiple selections'}`,
        bet_id: betId
      });
    }

    return data;
  }, [user]);

  // Record bankroll transaction
  const recordBankrollTransaction = useCallback(async (transactionData) => {
    if (!user || !profile || !isSupabaseEnabled) return;

    const currentBalance = profile.bankroll || 0;
    const newBalance = currentBalance + transactionData.amount;

    const { data, error } = await db
      .from('bankroll_transactions')
      .insert({
        user_id: user.id,
        balance_before: currentBalance,
        balance_after: newBalance,
        ...transactionData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setBankrollTransactions(prev => [data, ...prev]);

    return data;
  }, [user, profile]);

  // Create watchlist
  const createWatchlist = useCallback(async (watchlistData) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('watchlists')
      .insert({
        user_id: user.id,
        ...watchlistData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    setWatchlists(prev => [data, ...prev]);
    return data;
  }, [user]);

  // Update watchlist
  const updateWatchlist = useCallback(async (watchlistId, updates) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('watchlists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', watchlistId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setWatchlists(prev => 
      prev.map(list => list.id === watchlistId ? data : list)
    );

    return data;
  }, [user]);

  // Create alert
  const createAlert = useCallback(async (alertData) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('user_alerts')
      .insert({
        user_id: user.id,
        ...alertData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    setAlerts(prev => [data, ...prev]);
    return data;
  }, [user]);

  // Mark alert as read
  const markAlertRead = useCallback(async (alertId) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('user_alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setAlerts(prev => 
      prev.map(alert => alert.id === alertId ? data : alert)
    );

    return data;
  }, [user]);

  // Save bet template
  const saveBetTemplate = useCallback(async (templateData) => {
    if (!user || !isSupabaseEnabled) return;

    const { data, error } = await db
      .from('bet_templates')
      .insert({
        user_id: user.id,
        ...templateData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    setBetTemplates(prev => [data, ...prev]);
    return data;
  }, [user]);

  // Get betting statistics
  const getBettingStats = useCallback(async () => {
    if (!user || !isSupabaseEnabled) return null;

    try {
      const { data, error } = await db.rpc('get_user_betting_stats', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching betting stats:', err);
      return null;
    }
  }, [user]);

  // Load data on user change
  useEffect(() => {
    if (user) {
      fetchBettingData();
    } else {
      // Clear data when user logs out
      setBetHistory([]);
      setWatchlists([]);
      setAlerts([]);
      setBankrollTransactions([]);
      setBetTemplates([]);
    }
  }, [user, fetchBettingData]);

  return {
    // Data
    betHistory,
    watchlists,
    alerts,
    bankrollTransactions,
    betTemplates,
    loading,
    error,

    // Actions
    fetchBettingData,
    placeBet,
    updateBetStatus,
    recordBankrollTransaction,
    createWatchlist,
    updateWatchlist,
    createAlert,
    markAlertRead,
    saveBetTemplate,
    getBettingStats,

    // Computed values
    unreadAlerts: alerts.filter(alert => !alert.is_read).length,
    totalProfit: bankrollTransactions.reduce((sum, tx) => 
      tx.transaction_type === 'bet_payout' ? sum + tx.amount : sum, 0
    ),
    totalStaked: bankrollTransactions.reduce((sum, tx) => 
      tx.transaction_type === 'bet_stake' ? sum + Math.abs(tx.amount) : sum, 0
    )
  };
};
