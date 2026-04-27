import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/services/authContext";
import { Colors } from "@/constants/Colors";

export default function LogoutModal() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // Navigation is handled by RootLayout onAuthStateChange
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log out?</Text>
      <Text style={styles.subtitle}>
        You’ll need to log in again to place orders.
      </Text>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>
            Log Out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EEE",
    marginRight: 12,
  },
  cancelText: {
    textAlign: "center",
    fontWeight: '600',
    color: Colors.text,
  },
  logoutButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  logoutText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: '600',
  },
});
