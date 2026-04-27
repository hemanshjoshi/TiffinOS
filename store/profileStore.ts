import { create } from 'zustand';
import { supabase } from '@/services/supabase';

export type UserProfile = {
  id: string;
  full_name: string | null;
  mobile_number: string | null;
  email?: string;
  profile_photo_url?: string;
  food_preference?: string;
  date_of_birth?: string;
};

export type ProfileState = {
  user: UserProfile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  loading: false,
  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const { data, error, status } = await supabase
        .from('users')
        .select(`*`)
        .eq('id', userId)
        .single();
      
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        set({ user: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },
  updateProfile: async (userId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({ 
          id: userId,
          updated_at: new Date().toISOString(),
          ...updates 
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      if (data) {
        set({ user: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ loading: false });
      throw error;
    }
  },
  clearProfile: () => set({ user: null }),
}));
