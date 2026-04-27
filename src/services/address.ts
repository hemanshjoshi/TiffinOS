import { supabase } from './supabase';
import { Address } from '@/types/address';

export const AddressService = {
  async getAddresses(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Address[];
  },

  async addAddress(address: Omit<Address, 'id'>) {
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', address.user_id);
    }

    // Attempt insert without forced return first to prevent RLS select hanging
    const { error: insertError } = await supabase
      .from('addresses')
      .insert([address]);
      
    if (insertError) throw insertError;

    // Try to fetch the latest inserted address to return it with ID
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', address.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
        console.warn("Address saved but could not fetch details:", error);
        // Return a temporary object so UI doesn't crash
        return { ...address, id: 'temp-id-' + Date.now() } as Address;
    }
    return data;
  },

  async updateAddress(id: string, updates: Partial<Address>) {
    if (updates.is_default) {
        const { data: current } = await supabase.from('addresses').select('user_id').eq('id', id).single();
        if (current) {
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', current.user_id);
        }
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAddress(id: string) {
    console.log("Deleting address:", id);
    const { error, count } = await supabase
      .from('addresses')
      .delete({ count: 'exact' })
      .eq('id', id);
      
    if (error) {
        console.error("Delete failed:", error);
        throw error;
    }
    console.log("Deleted count:", count);
    if (count === 0) {
        console.warn("Delete returned 0 rows. Possible RLS issue or ID mismatch.");
        throw new Error("Address not found or permission denied (count 0)");
    }
  }
};
