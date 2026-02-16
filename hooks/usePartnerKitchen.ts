import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';

export function usePartnerKitchen() {
  const [kitchenId, setKitchenId] = useState<string | null>(null);
  const [kitchenName, setKitchenName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    async function fetch() {
      const userId = session?.user?.id;

      if (!userId) {
          console.log('No user logged in');
          setLoading(false);
          return;
      }

      // 2. Find Kitchen owned by User
      const { data, error } = await supabase
        .from('kitchens')
        .select('id, kitchen_name')
        .eq('owner_id', userId)
        .single();

      if (data) {
          setKitchenId(data.id);
          setKitchenName(data.kitchen_name);
      } else {
          console.log('No kitchen found for user:', userId);
      }
      setLoading(false);
    }
    
    if (session) {
        fetch();
    } else {
        setKitchenId(null);
        setKitchenName('');
        setLoading(false);
    }
  }, [session]);

  return { kitchenId, kitchenName, loading };
}
