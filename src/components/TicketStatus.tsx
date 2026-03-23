import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function TicketStatus({ status }: any) {
  if (!status) return null;

  const isValid = status === "valid";
  const isInvalid = status === "invalid";
  const isWaiting = status === "wait";

  return (
    <View style={styles.centered}>
      <View style={[
        styles.glassCard,
        isValid && styles.validBorder,
        isInvalid && styles.invalidBorder,
        isWaiting && styles.waitBorder
      ]}>

        {/* ICON */}
        <View style={[
          styles.iconCircle,
          isValid && styles.validCircle,
          isInvalid && styles.invalidCircle,
          isWaiting && styles.waitCircle
        ]}>

          {isWaiting ? (
            <ActivityIndicator size="large" color="#f59e0b" />
          ) : (
            <Text style={[
              styles.iconText,
              isValid && styles.validIcon,
              isInvalid && styles.invalidIcon
            ]}>
              {isValid ? "✔" : "✖"}
            </Text>
          )}

        </View>

        {/* LABEL */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          {isValid && "VALIDE"}
          {isInvalid && "INVALIDE"}
          {isWaiting && "⚠️ Ticket déjà utilisé"}
        </Text>

        {/* SUBTITLE */}
        <Text style={[styles.subtitle, { marginTop: 4 }]}>
          {isValid && "Bienvenue"}
          {isInvalid && "Billet non reconnu"}
          {isWaiting && "Veuillez patienter 10 minutes avant de réessayer."}
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
  waitBorder: { borderColor: "rgba(245, 158, 11, 0.4)" },

waitCircle: {
  backgroundColor: "rgba(245, 158, 11, 0.2)",
  borderColor: "#f59e0b",
},
});