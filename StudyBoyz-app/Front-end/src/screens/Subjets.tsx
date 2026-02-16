import { View, StyleSheet, FlatList } from "react-native";
import { Card } from "../../components/Card";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";


export const Subject = () => {
    interface Subject {
        title: string;
        icon: ComponentProps<typeof Ionicons>["name"];
        notes: string;
        color: "blue" | "red" | "green" | "yellow" | "purple";
    }

    const subjects: Subject[] = [
        { title: "Historia", icon: "book", notes: "8 notas", color: "green" },
        { title: "Ciencias", icon: "flask", notes: "15 notas", color: "purple" },
        { title: "Literatura", icon: "book", notes: "5 notas", color: "yellow" },
        { title: "Matemáticas", icon: "calculator", notes: "12 notas", color: "blue" },
        { title: "Inglés", icon: "language", notes: "7 notas", color: "red" },
        { title: "Geografía", icon: "globe", notes: "9 notas", color: "green" },
        { title: "Física", icon: "flash", notes: "11 notas", color: "purple" },
        { title: "Química", icon: "beaker", notes: "6 notas", color: "yellow" },
        { title: "Biología", icon: "leaf", notes: "10 notas", color: "green" },
        { title: "Informática", icon: "laptop", notes: "8 notas", color: "blue" },
    ];

    return (
        <FlatList
            data={subjects}
            numColumns={2}

            keyExtractor={(item) => item.title}

            style={styles.list}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                    <Card
                        title={item.title}
                        icon={item.icon}
                        notes={item.notes}
                        color={item.color}
                    />
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
        width: "100%",
    },
    listContent: {
        padding: 12,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardWrapper: {
        flex: 1,
        marginHorizontal: 6,
    },
});