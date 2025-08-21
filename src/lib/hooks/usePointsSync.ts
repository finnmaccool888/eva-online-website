import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTwitterAuth } from './useTwitterAuth';

export function usePointsSync() {
  const { twitterHandle } = useTwitterAuth();
  const [points, setPoints] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch latest points
  const refreshPoints = async () => {
    if (!twitterHandle) return;
    
    setIsRefreshing(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, user_profiles(*)')
        .eq('twitter_handle', twitterHandle)
        .single();

      if (userError) throw userError;

      const profile = Array.isArray(user.user_profiles) 
        ? (user.user_profiles.length > 0 ? user.user_profiles[0] : null)
        : user.user_profiles;

      if (profile) {
        setPoints(profile.points);
      }
    } catch (error) {
      console.error('Error refreshing points:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Subscribe to point changes
  useEffect(() => {
    if (!twitterHandle) return;

    // Initial fetch
    refreshPoints();

    // Subscribe to changes
    const subscription = supabase
      .channel('points-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `twitter_handle=eq.${twitterHandle}`
        },
        (payload) => {
          // Update points when changed
          if (payload.new && payload.new.points !== undefined) {
            setPoints(payload.new.points);
          }
        }
      )
      .subscribe();

    // Also subscribe to notifications for point changes
    const notificationSubscription = supabase
      .channel('point-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `type=eq.points_restored`
        },
        (payload) => {
          if (payload.new && payload.new.user_id) {
            // Refresh points when a restore notification is received
            refreshPoints();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  }, [twitterHandle]);

  return {
    points,
    refreshPoints,
    isRefreshing
  };
}
