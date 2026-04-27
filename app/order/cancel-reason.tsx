import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Colors } from "@/constants/Colors";
import { ArrowLeft } from "lucide-react-native";
import { supabase } from "@/services/supabase";

const reasons = [
  "Ordered by mistake",
  "Delivery taking too long",
  "Changed my mind",
  "Other"
];

export default function CancelReason() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const handleConfirm = async () => {
    if (!selected) return;
    if (!orderId) {
        Alert.alert("Error", "Order ID missing");
        return;
    }

    setLoading(true);
    const { error } = await supabase
        .from('orders')
        .update({ status: 'Cancelled' })
        .eq('id', orderId);
    
    setLoading(false);

    if (error) {
        Alert.alert("Error", "Failed to cancel order: " + error.message);
    } else {
        router.replace("/order/cancel-success");
    }
  };

  return (
    <Screen backgroundColor="#FFF" safeArea={true}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color="#000" />
        </Pressable>
      </View>

      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: "600" }}>Cancel Order</Text>
        <Text style={{ marginVertical: 8, color: "#666" }}>
          Please tell us why you’re cancelling.
        </Text>

        {reasons.map(reason => (
          <Pressable
            key={reason}
            onPress={() => setSelected(reason)}
            style={{
              padding: 16,
              borderRadius: 16,
              marginTop: 12,
              backgroundColor: selected === reason ? "#FE724C" : "#F5F5F5"
            }}
          >
            <Text style={{ color: selected === reason ? "#FFF" : "#000" }}>
              {reason}
            </Text>
          </Pressable>
        ))}

        <Pressable
          disabled={!selected || loading}
          onPress={handleConfirm}
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 20,
            backgroundColor: (selected && !loading) ? "#FE724C" : "#CCC"
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: 'bold' }}>
                Confirm Cancellation
            </Text>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
});
