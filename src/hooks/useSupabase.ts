import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useSupabaseQuery<T>(
  tableName: string, 
  options: { 
    select?: string; 
    orderCol?: string; 
    limit?: number; 
    eq?: [string, any] 
  } = {}
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        let query = supabase.from(tableName).select(options.select || '*');
        
        if (options.eq) query = query.eq(options.eq[0], options.eq[1]);
        if (options.orderCol) query = query.order(options.orderCol, { ascending: false });
        if (options.limit) query = query.limit(options.limit);

        const { data: result, error } = await query;
        if (error) throw error;
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime subscription if applicable
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        console.log('Realtime update:', payload);
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, JSON.stringify(options)]);

  return { data, loading, error };
}
