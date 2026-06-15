import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const TAGS = [
    'Safe driving', 'Polite', 'Route was correct',
    'On time', 'Felt uncomfortable', 'Wrong route',
    'Rash driving', 'Unprofessional'
];

export default function RatingScreen() {
    const { vehicleDataStr, tripId } = useLocalSearchParams();
    const vehicleData = vehicleDataStr ? JSON.parse(vehicleDataStr) : {};
    const router = useRouter();

    const [stars, setStars] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [flagged, setFlagged] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const submitRating = async () => {
        if (stars === 0) {
            Alert.alert('Please select a star rating first');
            return;
        }

        try {
            const uid = auth.currentUser?.uid;

            await addDoc(collection(db, 'ratings'), {
                userId: uid,
                plate: vehicleData.registrationNo,
                stars,
                tags: selectedTags,
                flagged,
                tripId,
                timestamp: serverTimestamp(),
            });

            if (flagged) {
                await addDoc(collection(db, 'flags'), {
                    userId: uid,
                    plate: vehicleData.registrationNo,
                    timestamp: serverTimestamp(),
                    reason: selectedTags,
                });
            }

            setSubmitted(true);
        } catch (err) {
            Alert.alert('Error', 'Could not submit rating. Try again.');
        }
    };

    if (submitted) return (
        <View style={styles.container}>
            <View style={styles.successCard}>
                <Text style={styles.successIcon}>🙏</Text>
                <Text style={styles.successTitle}>Thank you!</Text>
                <Text style={styles.successSub}>
                    Your rating helps keep other women safe.
                </Text>
                {flagged && (
                    <View style={styles.flagConfirm}>
                        <Text style={styles.flagConfirmText}>
                             Plate flagged. This will be visible to all future passengers who scan this vehicle.
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => router.replace({ pathname: '/', params: { reset: 'true' } })}
                >
                    <Text style={styles.doneButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>🛡️ SafeRide</Text>
                <Text style={styles.tagline}>Rate your trip</Text>
            </View>

            {/* Vehicle info */}
            <View style={styles.vehicleCard}>
                <Text style={styles.vehicleTitle}>
                    {vehicleData.registrationNo || 'Unknown plate'}
                </Text>
                <Text style={styles.vehicleDetail}>
                    {vehicleData.makerModel || ''} · {vehicleData.vehicleClass || ''}
                </Text>
            </View>

            {/* Star rating */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>How was your trip?</Text>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setStars(s)}>
                            <Text style={[
                                styles.star,
                                s <= stars ? styles.starActive : styles.starInactive
                            ]}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.starLabel}>
                    {stars === 0 ? 'Tap to rate' :
                        stars === 1 ? 'Very unsafe' :
                            stars === 2 ? 'Uncomfortable' :
                                stars === 3 ? 'Okay' :
                                    stars === 4 ? 'Good' : 'Very safe'}
                </Text>
            </View>

            {/* Tags */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>What stood out?</Text>
                <View style={styles.tagsGrid}>
                    {TAGS.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tag,
                                selectedTags.includes(tag) && styles.tagSelected
                            ]}
                            onPress={() => toggleTag(tag)}
                        >
                            <Text style={[
                                styles.tagText,
                                selectedTags.includes(tag) && styles.tagTextSelected
                            ]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Flag plate */}
            <TouchableOpacity
                style={[styles.flagCard, flagged && styles.flagCardActive]}
                onPress={() => setFlagged(!flagged)}
            >
                <Text style={styles.flagIcon}>🚩</Text>
                <View style={styles.flagText}>
                    <Text style={styles.flagTitle}>Flag this plate</Text>
                    <Text style={styles.flagSub}>
                        I did not feel safe · Warn future passengers
                    </Text>
                </View>
                <View style={[styles.checkbox, flagged && styles.checkboxActive]}>
                    {flagged && <Text style={styles.checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
                <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
                Ratings help the next passenger · Data helps the community
            </Text>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0f0f1a',
        padding: 24,
        paddingTop: 60,
    },
    header: {
        marginBottom: 24,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    tagline: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    vehicleCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    vehicleTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    vehicleDetail: {
        color: '#888',
        fontSize: 13,
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
    cardTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    star: {
        fontSize: 44,
    },
    starActive: {
        color: '#f0a500',
    },
    starInactive: {
        color: '#333',
    },
    starLabel: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#0f0f1a',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    tagSelected: {
        backgroundColor: '#1a1a3e',
        borderColor: '#6c63ff',
    },
    tagText: {
        color: '#888',
        fontSize: 13,
    },
    tagTextSelected: {
        color: '#6c63ff',
        fontWeight: 'bold',
    },
    flagCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flagCardActive: {
        borderColor: '#e74c3c',
        backgroundColor: '#2b0d0d',
    },
    flagIcon: {
        fontSize: 24,
    },
    flagText: {
        flex: 1,
    },
    flagTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    flagSub: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#e74c3c',
        borderColor: '#e74c3c',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#6c63ff',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        color: '#333',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 40,
    },
    successCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        margin: 24,
        marginTop: 100,
        borderWidth: 1,
        borderColor: '#1db954',
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    successTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    successSub: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    flagConfirm: {
        backgroundColor: '#2b0d0d',
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    flagConfirmText: {
        color: '#e74c3c',
        fontSize: 13,
        textAlign: 'center',
    },
    doneButton: {
        backgroundColor: '#1db954',
        borderRadius: 12,
        padding: 16,
        paddingHorizontal: 32,
    },
    doneButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});