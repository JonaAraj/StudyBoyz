import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons"; // Las "llaves" para los iconos
import { LinearGradient } from "expo-linear-gradient";

export default function ConfiguracionScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>


            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#3b82f6" />
                    <Text style={styles.backText}>Atrás</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>


                <View style={styles.appInfoSection}>
                    <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logoPlaceholder}
                    >
                        <MaterialIcons name="graphic-eq" size={44} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.appName}>StudyBoys</Text>
                    <Text style={styles.appVersion}>v1</Text>
                </View>


                <Text style={styles.sectionLabel}>GENERAL</Text>
                <View style={styles.groupCard}>
                    {renderRow("mic-outline", "Calidad de Audio", "Alta", true)}
                    {renderRow("notifications-outline", "Notificaciones", "", true)}
                    {renderRow("moon-outline", "Apariencia", "Automático", false)}
                </View>


                <Text style={styles.sectionLabel}>INFORMACIÓN</Text>
                <View style={styles.groupCard}>
                    {renderRow("information-circle-outline", "Acerca de StudyBoys", "", true)}
                    {renderRow("lock-closed-outline", "Términos y Privacidad", "", true)}
                    {renderRow("headset-outline", "Soporte", "", false)}
                </View>


                <TouchableOpacity style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Eliminar todos los datos</Text>
                </TouchableOpacity>
                <Text style={styles.disclaimerText}>
                    Esta acción eliminará permanentemente todas tus grabaciones y transcripciones. No se puede deshacer.
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}


function renderRow(iconName: string, label: string, value: string, hasDivider: boolean) {
    return (
        <View>
            <TouchableOpacity style={styles.row}>
                <View style={styles.rowLeft}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={iconName as any} size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.rowLabel}>{label}</Text>
                </View>
                <View style={styles.rowRight}>
                    {value ? <Text style={styles.rowValueText}>{value}</Text> : null}
                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                </View>
            </TouchableOpacity>

            {hasDivider && <View style={styles.divider} />}
        </View>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f4f6fb" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: "#fff",
    },
    backButton: { flexDirection: "row", alignItems: "center" },
    backText: { color: "#3b82f6", fontSize: 17, marginLeft: -4 },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
    scrollContainer: { padding: 16, paddingBottom: 120 },


    appInfoSection: { alignItems: "center", marginVertical: 30 },
    logoPlaceholder: {
        width: 80,
        height: 80,
        //backgroundColor: "#4f46e5",
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        elevation: 4,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    appName: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
    appVersion: { fontSize: 14, color: "#9ca3af" },


    sectionLabel: { fontSize: 13, color: "#6b7280", marginBottom: 8, marginLeft: 8 },
    groupCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 24,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    rowLeft: { flexDirection: "row", alignItems: "center" },
    iconCircle: {
        width: 32,
        height: 32,
        backgroundColor: "#eff6ff",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    rowLabel: { fontSize: 16, color: "#1f2937" },
    rowRight: { flexDirection: "row", alignItems: "center" },
    rowValueText: { color: "#9ca3af", marginRight: 8 },
    divider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 58 },


    deleteButton: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },
    deleteButtonText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
    disclaimerText: {
        textAlign: "center",
        color: "#9ca3af",
        fontSize: 12,
        marginTop: 12,
        paddingHorizontal: 20,
        lineHeight: 18,
    }
});