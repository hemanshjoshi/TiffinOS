import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { Search, Clock, X, TrendingUp } from 'lucide-react-native';

const RECENT_SEARCHES = ['Pizza', 'Burger', 'Biryani', 'Cake'];
const TRENDING_SEARCHES = ['Ice Cream', 'Rolls', 'Sandwich', 'North Indian'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim().length > 0) {
      router.push(`/search/results?q=${query}`);
    }
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
         <Input 
            placeholder="Search for food..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
            icon={<Search size={20} color={Colors.primary} />}
            rightIcon={query.length > 0 ? <X size={20} color={Colors.textSecondary} /> : null}
            onRightIconPress={() => setQuery('')}
            containerStyle={{ flex: 1, marginBottom: 0 }}
         />
         <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {RECENT_SEARCHES.map((item, index) => (
               <TouchableOpacity 
                 key={index} 
                 style={styles.searchItem}
                 onPress={() => router.push(`/search/results?q=${item}`)}
               >
                  <Clock size={16} color={Colors.textSecondary} style={{ marginRight: 12 }} />
                  <Text style={styles.searchText}>{item}</Text>
               </TouchableOpacity>
            ))}
         </View>

         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            {TRENDING_SEARCHES.map((item, index) => (
               <TouchableOpacity 
                 key={index} 
                 style={styles.searchItem}
                 onPress={() => router.push(`/search/results?q=${item}`)}
               >
                  <TrendingUp size={16} color={Colors.primary} style={{ marginRight: 12 }} />
                  <Text style={styles.searchText}>{item}</Text>
               </TouchableOpacity>
            ))}
         </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
