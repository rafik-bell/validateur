import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TicketStatus({ status }: any) {
  if (!status) return null;

  const isValid = status === "valid";

  return (
    <View style={styles.centered}>
      <View style={[styles.glassCard, isValid ? styles.validBorder : styles.invalidBorder]}>

        <View style={[styles.iconCircle, isValid ? styles.validCircle : styles.invalidCircle]}>
          <Text style={[styles.iconText, isValid ? styles.validIcon : styles.invalidIcon]}>
            {isValid ? "✔" : "✖"}
          </Text>
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>
          {isValid ? "VALIDE" : "INVALIDE"}
        </Text>

        <Text style={[styles.subtitle, { marginTop: 4 }]}>
          {isValid ? "Bienvenue" : "Billet non reconnu"}
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex:10,
  },
  glassCard: {
    backgroundColor: "rgb(255, 255, 255)",
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 56,
    alignItems: "center",
  },
  validBorder: { borderColor: "rgba(34, 197, 94, 0.4)" },
  invalidBorder: { borderColor: "rgba(239, 68, 68, 0.4)" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  validCircle: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "#22c55e",
  },
  invalidCircle: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  iconText: { fontSize: 28, fontWeight: "bold" },
  validIcon: { color: "#22c55e" },
  invalidIcon: { color: "#ef4444" },
  label: { fontSize: 30, fontWeight: "600", color: "#020202", letterSpacing: 1 },
  subtitle: { fontSize: 11, color: "rgba(3, 3, 3, 0.45)", letterSpacing: 2 },
});