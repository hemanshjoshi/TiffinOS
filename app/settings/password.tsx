import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ChevronLeft, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PasswordSettingScreen() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Password Setting</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                style={styles.passwordInput}
                value={passwords.current}
                secureTextEntry
                placeholder="***************"
                onChangeText={t => setPasswords({...passwords, current: t})}
              />
              <EyeOff size={20} color="#EE5D28" />
            </View>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                style={styles.passwordInput}
                value={passwords.new}
                secureTextEntry
                placeholder="***************"
                onChangeText={t => setPasswords({...passwords, new: t})}
              />
              <EyeOff size={20} color="#EE5D28" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                style={styles.passwordInput}
                value={passwords.confirm}
                secureTextEntry
                placeholder="***************"
                onChangeText={t => setPasswords({...passwords, confirm: t})}
              />
              <EyeOff size={20} color="#EE5D28" />
            </View>
          </View>

          <TouchableOpacity style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Tab Bar Placeholder */}
      <View style={styles.bottomTab}>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDCB52',
  },
  yellowHeader: {
    height: 150,
    backgroundColor: '#FDCB52',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingHorizontal: 30,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
    gap: 30,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3E1F1F',
    marginLeft: 5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EBC1',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#3E1F1F',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  forgotPasswordText: {
    color: '#EE5D28',
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    backgroundColor: '#EE5D28',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#EE5D28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomTab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#EE5D28',
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.8,
  }
});
