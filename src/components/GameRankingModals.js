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
          <View style={styles.modalContentStarRating}>
            <Text style={styles.modalTitle}>Rate This Game</Text>
            
            {/* Game Info Block - Separate Card */}
            <View style={styles.gameInfoBlock}>
              <View style={styles.gameInfoContent}>
                <View style={styles.gameInfoText}>
                  <Text style={styles.gameInfoName}>{selectedGame?.name}</Text>
                  <Text style={styles.gameInfoDetails}>
                    {(() => {
                      const getPriceCategory = (price) => {
                        if (!price || price === null || price === undefined) return null;
                        const numPrice = parseFloat(price);
                        if (isNaN(numPrice)) return null;
                        if (numPrice < 20) return 1;
                        if (numPrice < 40) return 2;
                        if (numPrice < 60) return 3;
                        return 4;
                      };
                      const priceCategory = getPriceCategory(selectedGame?.price);
                      const priceDisplay = priceCategory ? '$'.repeat(priceCategory) : '?';
                      return `${priceDisplay} | ${selectedGame?.genre || 'Unknown'}`;
                    })()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeInfoButton}
                  onPress={onCancelStarRating}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeInfoButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Star Rating Block - Separate Card */}
            <View style={styles.ratingBlock}>
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
                  <Text style={styles.notesButtonText}>Add Note</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.rankButton, selectedStarRating === 0 && styles.rankButtonDisabled]}
                  onPress={() => {
                    if (selectedStarRating === 0) {
                      Alert.alert('Error', 'Please select a star rating');
                      return;
                    }
                    onStarRatingSelect(selectedStarRating);
                  }}
                  disabled={selectedStarRating === 0}
                >
                  <Text style={[styles.rankButtonText, selectedStarRating === 0 && styles.disabledButtonText]}>
                    Rank
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
              placeholderTextColor="#666"
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
                <Text style={[styles.undoButtonText, comparisonHistory.length === 0 && styles.disabledButtonText]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  modalContentStarRating: {
    backgroundColor: 'transparent',
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
    fontFamily: 'Raleway',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameInfoBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gameInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfoText: {
    flex: 1,
    marginRight: 10,
  },
  gameInfoName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 8,
  },
  gameInfoDetails: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
  },
  closeInfoButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeInfoButtonText: {
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    lineHeight: 28,
  },
  ratingBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    lineHeight: 28,
  },
  horizontalStarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  horizontalStarButton: {
    padding: 5,
  },
  horizontalStar: {
    fontSize: 48,
    fontFamily: 'Raleway',
    color: '#ddd',
  },
  horizontalStarFilled: {
    color: '#001f3f',
  },
  starRatingActions: {
    marginTop: 20,
  },
  notesButton: {
    backgroundColor: '#001f3f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  notesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  rankButton: {
    backgroundColor: '#001f3f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  rankButtonDisabled: {
    opacity: 0.5,
  },
  rankButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    color: '#000',
    fontSize: 16,
    fontFamily: 'Raleway',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 150,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#001f3f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#ddd',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    minHeight: 280,
    justifyContent: 'flex-start',
    minWidth: '45%',
  },
  comparisonCardImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  comparisonGameNameCenter: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  comparisonGameGenre: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Raleway',
    marginTop: 4,
    textAlign: 'center',
  },
  ratingScore: {
    color: '#001f3f',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
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
    backgroundColor: '#ddd',
  },
  undoButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  tooToughButton: {
    backgroundColor: '#001f3f',
  },
  skipButton: {
    backgroundColor: '#001f3f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
});


