import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { ComponentProps } from 'react';
import { Ionicons } from "@expo/vector-icons";


interface Props {
    title: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    notes: string;
    color: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

export const Card = ({ title, icon, notes, color }: Props) => {
    const colorVariants = {
        blue: { bg: "#dbeafe", text: "#2563eb" },
        red: { bg: "#fee2e2", text: "#dc2626" },
        green: { bg: "#dcfce7", text: "#16a34a" },
        yellow: { bg: "#fef3c7", text: "#ca8a04" },
        purple: { bg: "#e9d5ff", text: "#9333ea" },
    };

    const selectedColor = colorVariants[color] || colorVariants.blue;

    const handleMore = () => {
        // Acción para el menú de más opciones
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: selectedColor.bg },
                    ]}
                >
                    <Ionicons name={icon} size={24} color={selectedColor.text} />
                </View>

                <TouchableOpacity onPress={handleMore} style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>

            <View style={styles.footerContainer}>
                <Ionicons name="document" size={12} color="#6b7280" />
                <Text style={styles.notes}>{notes}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    moreButton: {
        padding: 8,
        minWidth: 40,
        alignItems: "center",
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    footerContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    notes: {
        fontSize: 12,
        fontWeight: "500",
        color: "#6b7280",
    },
});
