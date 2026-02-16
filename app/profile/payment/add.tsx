import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, Lock } from 'lucide-react-native';
import { Text } from 'react-native';

export default function AddCardScreen() {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 1000);
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
         <View style={styles.cardPreview}>
            <View style={styles.chip} />
            <Text style={styles.previewNumber}>{number || '•••• •••• •••• ••••'}</Text>
            <View style={styles.previewFooter}>
               <View>
                  <Text style={styles.previewLabel}>Card Holder</Text>
                  <Text style={styles.previewValue}>{name || 'YOUR NAME'}</Text>
               </View>
               <View>
                  <Text style={styles.previewLabel}>Expires</Text>
                  <Text style={styles.previewValue}>{expiry || 'MM/YY'}</Text>
               </View>
            </View>
         </View>

         <View style={styles.form}>
            <Input 
               label="Card Number"
               placeholder="0000 0000 0000 0000"
               value={number}
               onChangeText={setNumber}
               keyboardType="number-pad"
               maxLength={19}
               icon={<CreditCard size={20} color={Colors.textSecondary} />}
            />
            <Input 
               label="Card Holder Name"
               placeholder="John Doe"
               value={name}
               onChangeText={setName}
            />
            <View style={styles.row}>
               <Input 
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={expiry}
                  onChangeText={setExpiry}
                  containerStyle={{ flex: 1 }}
                  icon={<Calendar size={20} color={Colors.textSecondary} />}
               />
               <View style={{ width: 16 }} />
               <Input 
                  label="CVV"
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                  containerStyle={{ flex: 1 }}
                  icon={<Lock size={20} color={Colors.textSecondary} />}
               />
            </View>
         </View>
      </ScrollView>

      <View style={styles.footer}>
         <Button 
            title="Save Card" 
            onPress={handleSave} 
            loading={loading}
            style={styles.saveButton}
         />
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: 24,
  },
  cardPreview: {
    backgroundColor: '#1A1D26',
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  chip: {
    width: 40,
    height: 28,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
  },
  previewNumber: {
    color: '#fff',
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 20,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  previewValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    width: '100%',
  },
});
