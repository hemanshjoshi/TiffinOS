import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { CheckCircle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function CancelSuccess() {
  const router = useRouter();

  return (
    <Screen backgroundColor="#FFF" safeArea={true}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <CheckCircle size={80} color={Colors.primary} style={{marginBottom: 20}} />
        <Text style={{ fontSize: 26, fontWeight: "700", color: Colors.text }}>Order Cancelled</Text>
        <Text style={{ marginTop: 8, color: "#666", textAlign: "center", lineHeight: 22 }}>
          Your order has been successfully cancelled. The refund will be initiated shortly.
        </Text>

        <Pressable
          onPress={() => router.replace("/(tabs)/orders")}
          style={{
            marginTop: 32,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 20,
            backgroundColor: "#FE724C",
            width: '100%'
          }}
        >
          <Text style={{ color: "#FFF", textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Back to Orders</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
