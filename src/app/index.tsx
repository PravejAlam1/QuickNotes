
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
};

const STORAGE_KEY = "quicknotes_notes";

const NOTE_COLORS = [
  "#FFFFFF",
  "#FFF3B0",
  "#D8F3DC",
  "#DDEBFF",
  "#FFE0E9",
  "#E9DDFB",
];

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedNotes !== null) {
          const parsedNotes = JSON.parse(savedNotes);

          // Keep older notes compatible with the new color feature.
          const compatibleNotes: Note[] = parsedNotes.map((note: any) => ({
            ...note,
            color: note.color || "#FFFFFF",
          }));

          setNotes(compatibleNotes);
        }
      } catch {
        Alert.alert("Error", "Could not load saved notes.");
      } finally {
        setIsLoaded(true);
      }
    };

    loadNotes();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const saveNotes = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch {
        Alert.alert("Error", "Could not save notes.");
      }
    };

    saveNotes();
  }, [notes, isLoaded]);

  const clearForm = () => {
    setTitle("");
    setContent("");
    setSelectedColor("#FFFFFF");
    setEditingId(null);
  };

  const addOrUpdateNote = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please write something first.");
      return;
    }

    if (editingId !== null) {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: title.trim() || "Untitled Note",
                content: content.trim(),
                color: selectedColor,
              }
            : note
        )
      );

      clearForm();
      Alert.alert("Success", "Note updated successfully!");
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || "Untitled Note",
      content: content.trim(),
      color: selectedColor,
    };

    setNotes((previousNotes) => [newNote, ...previousNotes]);
    clearForm();
  };

  const editNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color || "#FFFFFF");
    setEditingId(note.id);
  };

  const deleteNote = (id: string) => {
    Alert.alert("Delete Note", "Do you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setNotes((previousNotes) =>
            previousNotes.filter((note) => note.id !== id)
          );

          if (editingId === id) {
            clearForm();
          }
        },
      },
    ]);
  };

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();

    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>QuickNotes</Text>
          <Text style={styles.subtitle}>Your thoughts, your space.</Text>
        </View>
        <Text style={styles.headerIcon}>📝</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId !== null ? "Edit Note" : "Create a Note"}
        </Text>

        <TextInput
          style={styles.titleInput}
          placeholder="Note title"
          placeholderTextColor="#888888"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write something..."
          placeholderTextColor="#888888"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.colorLabel}>Choose note color</Text>

        <View style={styles.colorRow}>
          {NOTE_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor,
              ]}
            >
              {selectedColor === color && (
                <Text style={styles.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={addOrUpdateNote}
        >
          <Text style={styles.addButtonText}>
            {editingId !== null ? "Save Changes" : "+ Add Note"}
          </Text>
        </TouchableOpacity>

        {editingId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.cancelButtonText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your notes..."
          placeholderTextColor="#888888"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notesHeader}>
        <Text style={styles.notesTitle}>My Notes</Text>
        <Text style={styles.noteCount}>
          {filteredNotes.length} of {notes.length} notes
        </Text>
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📒</Text>
            <Text style={styles.emptyTitle}>
              {search ? "No matching notes" : "No notes yet"}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? "Try searching with another word."
                : "Create your first note above!"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.noteCard, { backgroundColor: item.color }]}>
            <View style={styles.noteTextContainer}>
              <Text style={styles.noteCardTitle}>{item.title}</Text>
              {item.content ? (
                <Text style={styles.noteCardContent}>{item.content}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editNote(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNote(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 29,
    fontWeight: "bold",
    color: "#5B42C8",
  },
  subtitle: {
    fontSize: 13,
    color: "#77718D",
    marginTop: 4,
  },
  headerIcon: {
    fontSize: 35,
  },
  form: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#29233F",
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: "#F7F5FF",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    color: "#29233F",
  },
  contentInput: {
    backgroundColor: "#F7F5FF",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    color: "#29233F",
    marginBottom: 12,
  },
  colorLabel: {
    fontSize: 14,
    color: "#514A68",
    fontWeight: "600",
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D6D1E4",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#5B42C8",
  },
  colorCheck: {
    color: "#5B42C8",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#5B42C8",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 12,
    padding: 8,
  },
  cancelButtonText: {
    color: "#5B42C8",
    fontWeight: "bold",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 18,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    color: "#29233F",
    fontSize: 14,
  },
  clearSearch: {
    fontSize: 18,
    color: "#77718D",
    padding: 5,
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#29233F",
  },
  noteCount: {
    color: "#77718D",
    fontSize: 12,
  },
  list: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 35,
  },
  emptyIcon: {
    fontSize: 45,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#514A68",
  },
  emptyText: {
    fontSize: 13,
    color: "#88819A",
    marginTop: 5,
  },
  noteCard: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  noteTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#29233F",
    marginBottom: 5,
  },
  noteCardContent: {
    fontSize: 14,
    color: "#514A68",
  },
  actions: {
    gap: 8,
  },
  editButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#5B42C8",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FDECEC",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#C03939",
    fontSize: 12,
    fontWeight: "bold",
  },
});

