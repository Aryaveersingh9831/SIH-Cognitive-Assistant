import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import notifee from '@notifee/react-native';

export default function AlarmScreen({ route, navigation }: any) {
  const { title } = route.params;

  const handleStop = async () => {
    await notifee.cancelAllNotifications();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏰</Text>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.button} onPress={handleStop}>
        <Text style={styles.buttonText}>OK, DONE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D64545', justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 48, borderRadius: 16 },
  buttonText: { fontSize: 24, fontWeight: '800', color: '#D64545' },
});