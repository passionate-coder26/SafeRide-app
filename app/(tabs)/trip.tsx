import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

// Base64 encoder for React Native
function toBase64(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    while (i < str.length) {
        const chr1 = str.charCodeAt(i++);
        const chr2 = str.charCodeAt(i++);
        const chr3 = str.charCodeAt(i++);
        const enc1 = chr1 >> 2;
        const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
        const enc4 = isNaN(chr3) ? 64 : chr3 & 63;
        output += chars[enc1] + chars[enc2] + chars[enc3] + chars[enc4];
    }
    return output;
}

export default function TripScreen() {
    const { vehicleDataStr, status: verificationStatus } = useLocalSearchParams();
    const vehicleData = vehicleDataStr ? JSON.parse(vehicleDataStr) : {
        registrationNo: 'MH01EB0264',
        ownerName: 'R***T G******H',
        vehicleClass: 'Motor Car (LMV)',
        makerModel: 'LAMBORGHINI URUS',
        insuranceUpto: '18-Feb-2025',
    };
    const router = useRouter();

    const [tripStarted, setTripStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tripId, setTripId] = useState(null);
    const [trackingToken, setTrackingToken] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [notifiedContacts, setNotifiedContacts] = useState([]);
    const [isNightMode, setIsNightMode] = useState(false);
    const locationInterval = useRef(null);
    const timerInterval = useRef(null);

    const generateToken = () => {
        return Math.random().toString(36).substring(2, 10) +
            Math.random().toString(36).substring(2, 10);
    };

    const checkNightMode = () => {
        const hour = new Date().getHours();
        return hour >= 21 || hour < 6;
    };

    const triggerSOS = async () => {
        Alert.alert(
            '🚨 Confirm SOS',
            'This will immediately alert your emergency contacts with your live location and driver details. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'SEND SOS NOW',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (tripId) {
                                await updateDoc(doc(db, 'trips', tripId), {
                                    sosTriggered: true,
                                    sosTime: serverTimestamp(),
                                    sosLocation: currentLocation,
                                    escalationLevel: 3,
                                });
                            }

                            Alert.alert(
                                '🚨 SOS Sent',
                                '✅ Emergency contacts notified\n✅ Live location shared\n✅ Driver details sent\n✅ Nearest police stations included\n\nHelp is on the way. Stay calm.',
                                [{ text: 'OK' }]
                            );

                        } catch (err) {
                            Alert.alert('Error', 'SOS failed to send. Call 112 immediately.');
                        }
                    }
                }
            ]
        );
    };

        const accountSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
        const authToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
    
    const startTrip = async () => {

        const twilioUrl = `https://corsproxy.io/?https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Location permission is required for trip tracking.');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });

            const nightMode = checkNightMode();
            setIsNightMode(nightMode);

            const token = generateToken();
            setTrackingToken(token);

            const tripDoc = await addDoc(collection(db, 'trips'), {
                userId: auth.currentUser?.uid,
                token,
                vehicleData,
                verificationStatus,
                startTime: serverTimestamp(),
                isNightMode: nightMode,
                status: 'active',
                checkInInterval: nightMode ? 5 : 10,
                currentLocation: { latitude, longitude },
                suspicionScore: 0,
            });

            setTripId(tripDoc.id);
            setTripStarted(true);

            try {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
                if (userDoc.exists()) {
                    const profile = userDoc.data();
                    const contacts = profile.emergencyContacts || [];
                    const trackingUrl = `https://saferide-tracking.vercel.app/track/${token}`;

                    for (const contact of contacts) {
                        const smsResponse = await fetch(twilioUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Basic ' + toBase64(`${accountSid}:${authToken}`),
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                From: 'whatsapp:+14155238886',
                                To: `whatsapp:${contact.phone}`,
                                Body: `🛡️ SafeRide Alert: ${profile.name} has started a trip.\n\nVehicle: ${vehicleData.registrationNo} (${vehicleData.makerModel})\n\nTrack live 👇\n${trackingUrl}\n\nNo app needed — just open the link.`
                            }).toString()
                        });
                        const smsResult = await smsResponse.json();
                        console.log('SMS result:', JSON.stringify(smsResult));
                        if (smsResult.sid) {
                            setNotifiedContacts(prev => [...prev, contact.name]);
                        }
                    }
                }
            } catch (err) {
                console.log('SMS error:', err);
            }

            // Start GPS tracking every 15 seconds
            locationInterval.current = setInterval(async () => {
                const loc = await Location.getCurrentPositionAsync({});
                const coords = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                };
                setCurrentLocation(coords);

                // Update location in Firestore
                await updateDoc(doc(db, 'trips', tripDoc.id), {
                    currentLocation: coords,
                    lastUpdated: serverTimestamp(),
                });
            }, 15000);

            timerInterval.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            Alert.alert('Error', 'Could not start trip. Try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const endTrip = async () => {
        const twilioUrl = `https://corsproxy.io/?https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        clearInterval(locationInterval.current);
        clearInterval(timerInterval.current);

        if (tripId) {
            await updateDoc(doc(db, 'trips', tripId), {
                status: 'completed',
                endTime: serverTimestamp(),
            });
        }

        // Send "Arrived Safely" WhatsApp to all contacts
        try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
            if (userDoc.exists()) {
                const profile = userDoc.data();
                const contacts = profile.emergencyContacts || [];

                for (const contact of contacts) {
                    await fetch(twilioUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + toBase64(`${accountSid}:${authToken}`),
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            From: 'whatsapp:+14155238886',
                            To: `whatsapp:${contact.phone}`,
                            Body: `✅ SafeRide: ${profile.name} has arrived safely and ended their trip.\n\nVehicle: ${vehicleData.registrationNo}\nTrip duration: ${formatTime(elapsedTime)}\n\nThank you for using SafeRide. 🛡️`
                        }).toString()
                    });
                }
            }
        } catch (err) {
            console.log('Arrived safely SMS error:', err);
        }

        setTripStarted(false);
        setElapsedTime(0);

        router.push({
            pathname: '/rating',
            params: {
                vehicleDataStr: JSON.stringify(vehicleData),
                tripId: tripId || '',
            }
        });
    };

    useEffect(() => {
        return () => {
            clearInterval(locationInterval.current);
            clearInterval(timerInterval.current);
        };
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const trackingLink = `https://saferide-tracking.vercel.app/track/${trackingToken}`;

    return (
        <ScrollView contentContainerStyle={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>🛡️ SafeRide</Text>
                {isNightMode && (
                    <View style={styles.nightBadge}>
                        <Text style={styles.nightBadgeText}>🌙 Night Mode Active</Text>
                    </View>
                )}
            </View>

            {/* Vehicle Card */}
            <View style={[
                styles.vehicleCard,
                verificationStatus === 'verified' ? styles.verifiedBorder :
                    verificationStatus === 'heightened' ? styles.heightenedBorder :
                        styles.unknownBorder
            ]}>
                <Text style={styles.vehicleTitle}>
                    {verificationStatus === 'verified' ? '✅' :
                        verificationStatus === 'heightened' ? '⚠️' : '🚨'}
                    {'  '}{vehicleData.registrationNo}
                </Text>
                <Text style={styles.vehicleDetail}>{vehicleData.makerModel}</Text>
                <Text style={styles.vehicleDetail}>{vehicleData.vehicleClass}</Text>
                <Text style={styles.vehicleOwner}>Owner: {vehicleData.ownerName}</Text>
            </View>

            {/* Trip Status */}
            {!tripStarted ? (
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={startTrip}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.startButtonText}>Start Trip</Text>
                    }
                </TouchableOpacity>
            ) : (
                <View style={styles.activeTrip}>

                    {/* Timer */}
                    <View style={styles.timerCard}>
                        <Text style={styles.timerLabel}>Trip Duration</Text>
                        <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
                        <View style={styles.liveDot}>
                            <View style={styles.dot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>

                    {/* GPS Status */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>📍 GPS Tracking</Text>
                        {currentLocation ? (
                            <>
                                <Text style={styles.infoValue}>
                                    Lat: {currentLocation.latitude.toFixed(5)}
                                </Text>
                                <Text style={styles.infoValue}>
                                    Lng: {currentLocation.longitude.toFixed(5)}
                                </Text>
                                <Text style={styles.infoSub}>Updates every 15 seconds</Text>
                            </>
                        ) : (
                            <Text style={styles.infoValue}>Acquiring GPS...</Text>
                        )}
                    </View>

                    {/* Tracking Link */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>🔗 Family Tracking Link</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(trackingLink)}>
                            <Text style={styles.trackingLink}>{trackingLink}</Text>
                        </TouchableOpacity>
                        <Text style={styles.infoSub}>
                            Tap to open · Share with family · No app needed
                        </Text>
                    </View>

                    {/* Notified Contacts */}
                    {notifiedContacts.length > 0 && (
                        <View style={styles.notifiedCard}>
                            <Text style={styles.notifiedTitle}> WhatsApp Sent To</Text>
                            {notifiedContacts.map((name, index) => (
                                <Text key={index} style={styles.notifiedContact}>
                                    ✅ {name}
                                </Text>
                            ))}
                            <Text style={styles.notifiedSub}>
                                They can track you live — no app needed
                            </Text>
                        </View>
                    )}

                    {/* Check-in interval */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>⏱️ Check-in Interval</Text>
                        <Text style={styles.infoValue}>
                            Every {isNightMode ? '5' : '10'} minutes
                            {isNightMode ? ' (night mode — doubled protection)' : ''}
                        </Text>
                    </View>

                    {/* SOS Button */}
                    <TouchableOpacity
                        style={styles.sosButton}
                        onPress={triggerSOS}
                    >
                        <Text style={styles.sosText}> SOS — Send Emergency Alert</Text>
                    </TouchableOpacity>

                    {/* End Trip */}
                    <TouchableOpacity style={styles.endButton} onPress={endTrip}>
                        <Text style={styles.endButtonText}> End Trip — I'm Safe</Text>
                    </TouchableOpacity>

                </View>
            )}

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    nightBadge: {
        backgroundColor: '#1a1a3e',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#6c63ff',
    },
    nightBadgeText: {
        color: '#6c63ff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    vehicleCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
    },
    verifiedBorder: { borderColor: '#1db954' },
    heightenedBorder: { borderColor: '#f0a500' },
    unknownBorder: { borderColor: '#e74c3c' },
    vehicleTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    vehicleDetail: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 4,
    },
    vehicleOwner: {
        color: '#888',
        fontSize: 13,
        marginTop: 8,
    },
    startButton: {
        backgroundColor: '#6c63ff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    activeTrip: {
        gap: 16,
    },
    timerCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6c63ff',
    },
    timerLabel: {
        color: '#888',
        fontSize: 13,
        marginBottom: 8,
    },
    timer: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    liveDot: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1db954',
    },
    liveText: {
        color: '#1db954',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    infoCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    infoTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoValue: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 4,
    },
    infoSub: {
        color: '#555',
        fontSize: 12,
        marginTop: 6,
    },
    trackingLink: {
        color: '#6c63ff',
        fontSize: 13,
        marginBottom: 4,
    },
    sosButton: {
        backgroundColor: '#e74c3c',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    sosText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    endButton: {
        backgroundColor: '#1db954',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 40,
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    notifiedCard: {
        backgroundColor: '#0d2b1f',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1db954',
    },
    notifiedTitle: {
        color: '#1db954',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    notifiedContact: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 6,
    },
    notifiedSub: {
        color: '#555',
        fontSize: 12,
        marginTop: 6,
    },
});