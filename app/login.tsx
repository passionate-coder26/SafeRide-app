import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contact1Name, setContact1Name] = useState('');
  const [contact1Phone, setContact1Phone] = useState('');
  const [contact2Name, setContact2Name] = useState('');
  const [contact2Phone, setContact2Phone] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/');
    } catch (err) {
      Alert.alert('Login failed', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !phone || !contact1Phone) {
      Alert.alert('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name,
        email,
        phone,
        emergencyContacts: [
          { name: contact1Name || 'Contact 1', phone: contact1Phone },
          { name: contact2Name || 'Contact 2', phone: contact2Phone },
        ].filter(c => c.phone),
        createdAt: new Date().toISOString(),
      });

      router.replace('/');
    } catch (err) {
      Alert.alert('Signup failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🛡️ SafeRide</Text>
        <Text style={styles.tagline}>Your safety, automated.</Text>
      </View>

      <View style={styles.card}>
        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, !isSignup && styles.toggleActive]}
            onPress={() => setIsSignup(false)}
          >
            <Text style={[styles.toggleText, !isSignup && styles.toggleTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isSignup && styles.toggleActive]}
            onPress={() => setIsSignup(true)}
          >
            <Text style={[styles.toggleText, isSignup && styles.toggleTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Signup fields */}
        {isSignup && (
          <>
            <Text style={styles.sectionLabel}>Your Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name *"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number *"
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.sectionLabel}>Emergency Contacts</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact 1 name (e.g. Mom)"
              placeholderTextColor="#555"
              value={contact1Name}
              onChangeText={setContact1Name}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact 1 phone * (with country code eg. +91)"
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
            <Text style={styles.sectionLabel}>Account</Text>
          </>
        )}

        {/* Common fields */}
        <TextInput
          style={styles.input}
          placeholder="Email address *"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password *"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Submit */}
        <TouchableOpacity
          style={styles.button}
          onPress={isSignup ? handleSignup : handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {isSignup ? 'Create Account →' : 'Login →'}
              </Text>
          }
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Text
            style={styles.switchLink}
            onPress={() => setIsSignup(!isSignup)}
          >
            {isSignup ? 'Login' : 'Sign up'}
          </Text>
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#0f0f1a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#6c63ff',
  },
  toggleText: {
    color: '#888',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    color: '#6c63ff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
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
  button: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  switchLink: {
    color: '#6c63ff',
    fontWeight: 'bold',
  },
});