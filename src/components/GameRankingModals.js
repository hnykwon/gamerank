import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import GameImage from './GameImage';

export default function GameRankingModals({
  starRatingModal,
  comparisonModal,
  notesModal,
  selectedGame,
  selectedStarRating,
  notes,
  currentComparisonIndex,
  comparisonHistory,
  gamesToCompare,
  onStarRatingSelect,
  onGameChoice,
  onUndo,
  onTooTough,
  onSkip,
  onCancelComparison,
  onCancelStarRating,
  setSelectedStarRating,
  setNotes,
  setNotesModal,
}) {
  return (
    <>
      {/* Star Rating Modal */}
      <Modal
        visible={starRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onCancelStarRating}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate This Game</Text>
            <Text style={styles.modalSubtitle}>
              {selectedGame?.name}
            </Text>
            <Text style={styles.starRatingPrompt}>
              How many stars would you give this game?
            </Text>

            <View style={styles.horizontalStarContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setSelectedStarRating(star);
                  }}
                  style={styles.horizontalStarButton}
                >
                  <Text
                    style={[
                      styles.horizontalStar,
                      star <= selectedStarRating && styles.horizontalStarFilled,
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.starRatingActions}>
              <TouchableOpacity
                style={styles.notesButton}
                onPress={() => setNotesModal(true)}
              >
                <Text style={styles.notesButtonText}>📝 Notes</Text>
              </TouchableOpacity>
              
              <View style={styles.starRatingButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { flex: 1, marginRight: 5 }]}
                  onPress={onCancelStarRating}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { flex: 1, marginLeft: 5 }]}
                  onPress={() => {
                    if (selectedStarRating === 0) {
                      Alert.alert('Error', 'Please select a star rating');
                      return;
                    }
                    onStarRatingSelect(selectedStarRating);
                  }}
                  disabled={selectedStarRating === 0}
                >
                  <Text style={[styles.modalButtonText, selectedStarRating === 0 && styles.disabledButtonText]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Add Notes</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setNotesModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedGame?.name}
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add your thoughts about this game..."
              placeholderTextColor="#95a5a6"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setNotesModal(false)}
            >
              <Text style={styles.modalButtonText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        visible={comparisonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onCancelComparison}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Which do you prefer?</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancelComparison}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sideBySideContainer}>
              <TouchableOpacity
                style={[styles.comparisonCard, { marginRight: 7.5 }]}
                onPress={() => onGameChoice('new')}
                activeOpacity={0.7}
              >
                {selectedGame?.name && (
                  <GameImage 
                    gameName={selectedGame.name}
                    style={styles.comparisonCardImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.comparisonGameNameCenter} numberOfLines={3}>
                  {selectedGame?.name}
                </Text>
                <Text style={styles.comparisonGameGenre}>{selectedGame?.genre}</Text>
                <Text style={styles.ratingScore}>
                  {selectedStarRating * 2}.0
                </Text>
              </TouchableOpacity>

              {gamesToCompare[currentComparisonIndex] && (
                <TouchableOpacity
                  style={[styles.comparisonCard, { marginLeft: 7.5 }]}
                  onPress={() => onGameChoice('existing')}
                  activeOpacity={0.7}
                >
                  <GameImage 
                    gameName={gamesToCompare[currentComparisonIndex].name}
                    style={styles.comparisonCardImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.comparisonGameNameCenter} numberOfLines={3}>
                    {gamesToCompare[currentComparisonIndex].name}
                  </Text>
                  <Text style={styles.comparisonGameGenre}>
                    {gamesToCompare[currentComparisonIndex].genre}
                  </Text>
                  <Text style={styles.ratingScore}>
                    {parseFloat(gamesToCompare[currentComparisonIndex].rating).toFixed(1)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.undoButton, { marginRight: 5 }]}
                onPress={onUndo}
                disabled={comparisonHistory.length === 0}
              >
                <Text style={[styles.actionButtonText, comparisonHistory.length === 0 && styles.disabledButtonText]}>
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.tooToughButton, { marginHorizontal: 5 }]}
                onPress={onTooTough}
              >
                <Text style={[styles.actionButtonText, styles.centeredButtonText]}>Too Tough</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton, { marginLeft: 5 }]}
                onPress={onSkip}
              >
                <Text style={styles.actionButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#b2bec3',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#636e72',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  starRatingPrompt: {
    fontSize: 16,
    color: '#b2bec3',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  horizontalStarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    gap: 15,
  },
  horizontalStarButton: {
    padding: 5,
  },
  horizontalStar: {
    fontSize: 48,
    color: '#636e72',
  },
  horizontalStarFilled: {
    color: '#fdcb6e',
  },
  starRatingActions: {
    marginTop: 20,
  },
  starRatingButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  notesButton: {
    backgroundColor: '#74b9ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  notesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#636e72',
    minHeight: 150,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#636e72',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  centeredButtonText: {
    textAlign: 'center',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#636e72',
    minHeight: 280,
    justifyContent: 'flex-start',
    minWidth: '45%',
  },
  comparisonCardImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#2d3436',
  },
  comparisonGameNameCenter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  comparisonGameGenre: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  ratingScore: {
    color: '#fdcb6e',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  undoButton: {
    backgroundColor: '#636e72',
  },
  tooToughButton: {
    backgroundColor: '#fdcb6e',
  },
  skipButton: {
    backgroundColor: '#74b9ff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

