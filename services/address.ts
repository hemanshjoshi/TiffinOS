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

    const { data, error } = await supabase
      .from('addresses')
      .insert([address])
      .select()
      .single();
      
    if (error) throw error;
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
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
