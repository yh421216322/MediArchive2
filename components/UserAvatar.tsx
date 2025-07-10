import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  name: string;
  relationship: string;
}

interface UserAvatarProps {
  user: User;
  size: number;
  showName?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size, showName = false }) => {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials(user.name)}
        </Text>
      </View>
      {showName && (
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.name}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
  },
  nameContainer: {
    marginTop: 4,
  },
  name: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
}); 