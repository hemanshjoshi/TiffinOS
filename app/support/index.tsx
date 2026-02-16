import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Phone, Mail, HelpCircle, ChevronRight } from 'lucide-react-native';

const FAQS = [
  'Where is my order?',
  'How to cancel my order?',
  'I want to change my address',
  'Payment issue',
];

export default function SupportScreen() {
  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
         <Text style={styles.sectionTitle}>Contact Us</Text>
         <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactCard}>
               <MessageCircle size={32} color={Colors.primary} />
               <Text style={styles.contactLabel}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard}>
               <Phone size={32} color={Colors.primary} />
               <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard}>
               <Mail size={32} color={Colors.primary} />
               <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>
         </View>

         <View style={styles.divider} />

         <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
         {FAQS.map((faq, index) => (
            <TouchableOpacity key={index} style={styles.faqItem}>
               <View style={styles.faqLeft}>
                  <HelpCircle size={20} color={Colors.textSecondary} />
                  <Text style={styles.faqText}>{faq}</Text>
               </View>
               <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
         ))}
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contactCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqText: {
    fontSize: 16,
    color: Colors.text,
  },
});
