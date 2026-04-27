import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

const SORT_OPTIONS = ['Relevance', 'Rating: High to Low', 'Delivery Time: Low to High', 'Cost: Low to High', 'Cost: High to Low'];
const CUISINES = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food', 'Desserts'];
const PRICE_RANGE = ['₹', '₹₹', '₹₹₹', '₹₹₹₹'];

export default function FilterScreen() {
  const [selectedSort, setSelectedSort] = useState('Relevance');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  const togglePrice = (price: string) => {
    if (selectedPrice.includes(price)) {
      setSelectedPrice(selectedPrice.filter(p => p !== price));
    } else {
      setSelectedPrice([...selectedPrice, price]);
    }
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
           <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sort By */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Sort By</Text>
           <View style={styles.optionsContainer}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity 
                   key={option} 
                   style={[styles.radioOption, selectedSort === option && styles.radioOptionSelected]}
                   onPress={() => setSelectedSort(option)}
                >
                   <View style={[styles.radioCircle, selectedSort === option && styles.radioCircleSelected]}>
                      {selectedSort === option && <View style={styles.radioInner} />}
                   </View>
                   <Text style={[styles.optionText, selectedSort === option && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <View style={styles.divider} />

        {/* Cuisines */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Cuisines</Text>
           <View style={styles.chipContainer}>
              {CUISINES.map((cuisine) => (
                <TouchableOpacity 
                   key={cuisine}
                   style={[styles.chip, selectedCuisines.includes(cuisine) && styles.chipSelected]}
                   onPress={() => toggleCuisine(cuisine)}
                >
                   <Text style={[styles.chipText, selectedCuisines.includes(cuisine) && styles.chipTextSelected]}>{cuisine}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <View style={styles.divider} />

        {/* Price */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Price</Text>
           <View style={styles.chipContainer}>
              {PRICE_RANGE.map((price) => (
                <TouchableOpacity 
                   key={price}
                   style={[styles.chip, selectedPrice.includes(price) && styles.chipSelected]}
                   onPress={() => togglePrice(price)}
                >
                   <Text style={[styles.chipText, selectedPrice.includes(price) && styles.chipTextSelected]}>{price}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
         <Button 
            title="Apply Filters" 
            onPress={() => router.back()} 
            size="lg"
            style={styles.applyButton}
         />
         <TouchableOpacity onPress={() => {
            setSelectedSort('Relevance');
            setSelectedCuisines([]);
            setSelectedPrice([]);
         }}>
            <Text style={styles.clearText}>Clear all</Text>
         </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOptionSelected: {
    //
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    gap: 16,
  },
  applyButton: {
    width: '100%',
  },
  clearText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
