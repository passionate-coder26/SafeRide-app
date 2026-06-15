import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contact1Name, setContact1Name] = useState('');
  const [contact1Phone, setContact1Phone] = useState('');
  const [contact2Name, setContact2Name] = useState('');
  const [contact2Phone, setContact2Phone] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const profileDoc = await getDoc(doc(db, 'users', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setName(data.name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        const contacts = data.emergencyContacts || [];
        if (contacts[0]) {
          setContact1Name(contacts[0].name || '');
          setContact1Phone(contacts[0].phone || '');
        }
        if (contacts[1]) {
          setContact2Name(contacts[1].name || '');
          setContact2Phone(contacts[1].phone || '');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!name || !phone) {
      Alert.alert('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
        emergencyContacts: [
          { name: contact1Name || 'Contact 1', phone: contact1Phone },
          { name: contact2Name || 'Contact 2', phone: contact2Phone },
        ].filter(c => c.phone),
      });
      Alert.alert('✅ Saved', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            router.replace('/login');
          }
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#6c63ff" size="large" />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.avatarName}>{name}</Text>
        <Text style={styles.avatarEmail}>{email}</Text>
      </View>

      {/* Personal Details */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Personal Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#555"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={email}
          editable={false}
        />
      </View>

      {/* Emergency Contacts */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🚨 Emergency Contacts</Text>
        <Text style={styles.sectionSub}>
          These people will be notified when you start a trip
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Contact 1 name"
          placeholderTextColor="#555"
          value={contact1Name}
          onChangeText={setContact1Name}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact 1 phone (e.g. +919324479267)"
          placeholderTextColor="#555"
          value={contact1Phone}
          onChangeText={setContact1Phone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Contact 2 name (optional)"
          placeholderTextColor="#555"
          value={contact2Name}
          onChangeText={setContact2Name}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact 2 phone (optional)"
          placeholderTextColor="#555"
          value={contact2Phone}
          onChangeText={setContact2Phone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveButtonText}>Save Changes</Text>
        }
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        SafeRide · Your data is encrypted and private
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionLabel: {
    color: '#6c63ff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionSub: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0f0f1a',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 15,
  },
  inputDisabled: {
    color: '#555',
    borderColor: '#222',
  },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
});