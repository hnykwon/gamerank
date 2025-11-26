import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { getUsageStats } from '../services/rawgUsageTracker';

export default function APIUsageDisplay() {
  const [usageStats, setUsageStats] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadUsageStats = async () => {
    const stats = await getUsageStats();
    setUsageStats(stats);
  };

  useEffect(() => {
    loadUsageStats();
    // Refresh stats every 5 seconds when modal is visible
    const interval = setInterval(() => {
      if (modalVisible) {
        loadUsageStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [modalVisible]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatResetTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUsagePercentage = () => {
    if (!usageStats?.rateLimitLimit) return null;
    const used = usageStats.rateLimitLimit - (usageStats.rateLimitRemaining || 0);
    return Math.round((used / usageStats.rateLimitLimit) * 100);
  };

  const getStatusColor = () => {
    const percentage = getUsagePercentage();
    if (percentage === null) return '#666';
    if (percentage < 50) return '#001f3f'; // Green
    if (percentage < 80) return '#001f3f'; // Yellow
    return '#000'; // Red
  };

  return (
    <>
      <TouchableOpacity
        style={styles.usageButton}
        onPress={() => {
          setModalVisible(true);
          loadUsageStats();
        }}
      >
        <Text style={styles.usageButtonText}>📊 API Usage</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>RAWG API Usage</Text>

            <ScrollView style={styles.statsContainer}>
              {/* Local Tracking */}
              <View style={styles.statSection}>
                <Text style={styles.sectionTitle}>Local Tracking (This App)</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Calls This Month:</Text>
                  <Text style={styles.statValue}>{usageStats?.localCallsThisMonth || 0}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Month Reset:</Text>
                  <Text style={styles.statValue}>
                    {formatDate(usageStats?.lastResetDate)}
                  </Text>
                </View>
              </View>

              {/* RAWG Rate Limit Info */}
              {usageStats?.rateLimitLimit && (
                <View style={styles.statSection}>
                  <Text style={styles.sectionTitle}>RAWG.io Rate Limits</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Remaining:</Text>
                    <Text style={styles.statValue}>
                      {usageStats.rateLimitRemaining?.toLocaleString() || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Limit:</Text>
                    <Text style={styles.statValue}>
                      {usageStats.rateLimitLimit?.toLocaleString() || 'N/A'}
                    </Text>
                  </View>
                  {usageStats.rateLimitReset && (
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Resets:</Text>
                      <Text style={styles.statValue}>
                        {formatResetTime(usageStats.rateLimitReset)}
                      </Text>
                    </View>
                  )}
                  {getUsagePercentage() !== null && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${getUsagePercentage()}%`,
                              backgroundColor: getStatusColor(),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {getUsagePercentage()}% used
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!usageStats?.rateLimitLimit && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Rate limit info will appear here after making API calls. 
                    RAWG.io includes rate limit headers in API responses.
                  </Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>📌 Free Tier Limit</Text>
                <Text style={styles.infoText}>
                  RAWG.io free tier: 20,000 requests/month
                </Text>
                <Text style={styles.infoSubtext}>
                  Check your account at: rawg.io
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  usageButton: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  usageButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    maxHeight: 500,
  },
  statSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#fff',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: 'Raleway',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Raleway',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#001f3f',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Raleway',
    lineHeight: 20,
  },
  infoSubtext: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'Raleway',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
});

