import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function HistoryScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', user.uid),
        orderBy('startTime', 'desc')
      );
      const tripsSnapshot = await getDocs(tripsQuery);
      const tripsData = tripsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));


      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('userId', '==', user.uid)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsMap = {};
      ratingsSnapshot.docs.forEach(d => {
        const data = d.data();
        ratingsMap[data.tripId] = data;
      });

      // Merge trips with ratings
      const merged = tripsData.map(trip => ({
        ...trip,
        rating: ratingsMap[trip.id] || null,
      }));

      setTrips(merged);
    } catch (err) {
      console.log('History error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#1db954';
    if (status === 'active') return '#6c63ff';
    return '#888';
  };

  const getVerificationColor = (status) => {
    if (status === 'verified') return '#1db954';
    if (status === 'heightened') return '#f0a500';
    return '#e74c3c';
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#6c63ff" size="large" />
      <Text style={styles.loadingText}>Loading trip history...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {trips.filter(t => t.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {trips.filter(t => t.rating?.flagged).length}
          </Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
      </View>

      {/* Trip List */}
      {trips.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>
            Your trip history will appear here after your first ride
          </Text>
        </View>
      ) : (
        trips.map((trip, index) => (
          <View key={trip.id} style={styles.tripCard}>

            {/* Trip Header */}
            <View style={styles.tripHeader}>
              <View style={styles.tripPlate}>
                <Text style={styles.plateText}>
                  {trip.vehicleData?.registrationNo || 'Unknown'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { borderColor: getStatusColor(trip.status) }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(trip.status) }
                ]}>
                  {trip.status === 'completed' ? '✅ Completed' :
                    trip.status === 'active' ? '🔴 Active' : trip.status}
                </Text>
              </View>
            </View>

            {/* Vehicle Info */}
            <Text style={styles.vehicleModel}>
              {trip.vehicleData?.makerModel || 'Unknown vehicle'}
            </Text>

            {/* Verification Status */}
            <View style={styles.verificationRow}>
              <Text style={[
                styles.verificationBadge,
                { color: getVerificationColor(trip.verificationStatus) }
              ]}>
                {trip.verificationStatus === 'verified' ? '✅ Verified' :
                  trip.verificationStatus === 'heightened' ? '⚠️ Heightened' :
                    '🚨 Unknown'}
              </Text>
              {trip.isNightMode && (
                <Text style={styles.nightBadge}>🌙 Night Mode</Text>
              )}
              {trip.sosTriggered && (
                <Text style={styles.sosBadge}>🚨 SOS Triggered</Text>
              )}
            </View>

            {/* Date */}
            <Text style={styles.tripDate}>
             {formatDate(trip.startTime)}
            </Text>

            {/* Rating */}
            {trip.rating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStars}>
                  {'★'.repeat(trip.rating.stars)}{'☆'.repeat(5 - trip.rating.stars)}
                </Text>
                {trip.rating.flagged && (
                  <Text style={styles.flaggedText}>🚩 Flagged</Text>
                )}
                {trip.rating.tags?.length > 0 && (
                  <Text style={styles.tagsText}>
                    {trip.rating.tags.slice(0, 2).join(' · ')}
                  </Text>
                )}
              </View>
            ) : (
              trip.status === 'completed' && (
                <Text style={styles.noRating}>No rating given</Text>
              )
            )}

          </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statNumber: {
    color: '#6c63ff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySub: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripPlate: {
    backgroundColor: '#0f0f1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  plateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleModel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  verificationBadge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nightBadge: {
    color: '#6c63ff',
    fontSize: 12,
  },
  sosBadge: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingStars: {
    color: '#f0a500',
    fontSize: 14,
  },
  flaggedText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagsText: {
    color: '#888',
    fontSize: 12,
  },
  noRating: {
    color: '#555',
    fontSize: 12,
  },
});