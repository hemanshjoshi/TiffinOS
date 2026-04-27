import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Colors } from "@/constants/Colors";
import { BellOff } from "lucide-react-native";

export default function NotificationsEmpty() {
  const router = useRouter();

  return (
    <Screen backgroundColor="#FFF" safeArea={true}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <BellOff size={60} color={Colors.textSecondary} style={{marginBottom: 16}} />
        <Text style={{ fontSize: 20, fontWeight: "600", color: Colors.text }}>
          No notifications yet
        </Text>
        <Text style={{ marginTop: 6, color: "#666", fontSize: 16 }}>
          We’ll let you know when something happens.
        </Text>

        <Pressable
          onPress={() => router.replace("/(tabs)/home")}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: "#FE724C"
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: 'bold' }}>Explore Food</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
