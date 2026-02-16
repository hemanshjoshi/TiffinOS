import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Colors } from "@/constants/Colors";
import { AlertCircle } from "lucide-react-native";

export default function PaymentFailed() {
  const router = useRouter();

  return (
    <Screen backgroundColor="#FFF" safeArea={true}>
      <View style={styles.container}>
        <AlertCircle size={80} color={Colors.error} style={{marginBottom: 20}} />
        <Text style={styles.title}>
          Payment Failed
        </Text>

        <Text style={styles.subtitle}>
          Don’t worry, no money was deducted.
        </Text>

        <Pressable
          onPress={() => router.replace("/checkout/payment")}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            Retry Payment
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={styles.changeText}>
            Change Payment Method
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    padding: 24
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: Colors.text,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  retryButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    width: '100%',
  },
  retryText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: 'bold',
    fontSize: 16,
  },
  changeText: {
    textAlign: "center",
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
