import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';

import { setItem } from '../services/storageService';

const { width } = Dimensions.get('window');

const TRANSPORTS = [
  {
    id: '2',
    name: 'Train',
    tag: 'Longue distance',
    desc: 'Réseau ferroviaire national SNTF',
    emoji: '🚆',
    image: { uri: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80' },
  },
  {
    id: '4',
    name: 'Métro',
    tag: 'Urbain souterrain',
    desc: "Métro d'Alger — ligne 1 & extensions",
    emoji: '🚇',
    image: { uri: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=600&q=80' },
  },
  {
    id: '1',
    name: 'Bus',
    tag: 'Surface',
    desc: 'Réseau ETUSA — toute la wilaya',
    emoji: '🚌',
    image: { uri: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&q=80' },
  },
  {
    id: '3',
    name: 'Tramway',
    tag: 'Urbain guidé',
    desc: "Tramway d'Alger — axe Est–Ouest",
    emoji: '🚊',
    image: { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  },
  {
    id: '5',
    name: 'Téléférique',
    tag: 'Aérien',
    desc: 'Liaisons panoramiques en hauteur',
    emoji: '🚡',
    image: { uri: 'https://images.unsplash.com/photo-1548013553-3d11b8df1b9b?w=600&q=80' },
  },
];


// ✅ Component خارج (fix للـ warning)
const TransportCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(item.id)}
    >
      <ImageBackground
        source={item.image}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.imageFade} />
      </ImageBackground>

      <View style={styles.cardBody}>
        <View style={styles.tagWrap}>
          <Text style={styles.tagText}>{item.tag.toUpperCase()}</Text>
        </View>

        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardDesc}>{item.desc}</Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.leftBar} />
    </TouchableOpacity>
  );
};


export default function TransportCards({ onSelect }) {
  // ✅ حفظ ID
  const saveSelectedTransport = async (id) => {
  try {
    await setItem('SELECTED_TRANSPORT_ID', id.toString());
    console.log('Saved transport id:', id);

    if (onSelect) {
      onSelect(id); // 👈 notify parent
    }

  } catch (e) {
    console.error('Error saving transport id', e);
  }
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f0fb" />

      {/* Header */}
      

      {/* Cards */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {TRANSPORTS.map((item) => (
          <TransportCard
            key={item.id}
            item={item}
            onPress={saveSelectedTransport}
          />
        ))}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f0fb',
    paddingTop: 0,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    color: '#1a56db',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleSolid: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0f1e3d',
  },
  headerTitleOutline: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1a56db',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 100,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d0dff5',
    elevation: 3,
  },

  cardImage: {
    width: 140,
    height: '100%',
  },
  cardImageStyle: {
    resizeMode: 'cover',
  },
  imageFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },

  cardBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  tagWrap: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1a56db',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f1e3d',
  },
  cardDesc: {
    fontSize: 11,
    color: '#6b7a99',
  },

  cardRight: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  arrow: {
    fontSize: 18,
    color: '#1a56db',
  },

  leftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1a56db',
  },
});