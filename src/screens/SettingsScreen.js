import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ onLogout }) => {
  const { theme } = useTheme();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('123456'); // Varsayılan şifre
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email || '');
      setEditEmail(email || '');
    } catch (error) {
      console.error('Kullanıcı bilgisi yüklenirken hata:', error);
    }
  };

  const handleEditProfile = () => {
    setEditEmail(userEmail);
    setEditPassword(userPassword);
    setEditConfirmPassword('');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    // Şifre kontrolü
    if (!editPassword.trim()) {
      Alert.alert('Uyarı', 'Lütfen şifre giriniz.');
      return;
    }

    if (editPassword.length < 6) {
      Alert.alert('Uyarı', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (editPassword !== editConfirmPassword) {
      Alert.alert('Uyarı', 'Şifreler eşleşmiyor.');
      return;
    }

    try {
      // E-posta değiştiyse güncelle
      if (editEmail.trim() !== userEmail) {
        await AsyncStorage.setItem('userEmail', editEmail.trim());
        setUserEmail(editEmail.trim());
      }

      // Şifreyi kaydet (gerçek uygulamada şifre hash'lenmeli)
      await AsyncStorage.setItem('userPassword', editPassword);
      setUserPassword(editPassword);

      Keyboard.dismiss();
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      setShowLogoutModal(false);
      setTimeout(() => {
        if (onLogout) {
          onLogout();
        }
      }, 50);
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.appTitle, { color: theme.colors.primary }]}>FocusFlow</Text>
        <ThemeToggle />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Profil Bilgileri */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Profil Bilgileri
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
                  Düzenle
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileItem}>
              <View style={styles.profileIconContainer}>
                <Ionicons
                  name="mail-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: theme.colors.textSecondary }]}>
                  E-posta
                </Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>
                  {userEmail || 'Yükleniyor...'}
                </Text>
              </View>
            </View>

            <View style={[styles.profileItem, { marginTop: 16 }]}>
              <View style={styles.profileIconContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: theme.colors.textSecondary }]}>
                  Şifre
                </Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>
                  ••••••••••
                </Text>
              </View>
            </View>
          </View>

          {/* Çıkış Yap Butonu */}
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.error,
                shadowColor: theme.colors.error,
              },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>

          {/* Uygulama Bilgileri */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Uygulama Bilgileri
            </Text>
            <Text style={[styles.appInfo, { color: theme.colors.textSecondary }]}>
              Versiyon: 1.0.0{'\n'}
              FocusFlow - Odaklanma ve Verimlilik Uygulaması
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Düzenleme Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowEditModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Profil Bilgilerini Düzenle
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowEditModal(false);
                    }}
                  >
                    <Ionicons
                      name="close-outline"
                      size={28}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    E-posta
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="E-posta adresinizi giriniz"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Yeni Şifre
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Yeni şifrenizi giriniz"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Şifre Tekrar
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Şifrenizi tekrar giriniz"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editConfirmPassword}
                    onChangeText={setEditConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowEditModal(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                      İptal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      Kaydet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutOverlay}>
          <View style={[styles.logoutCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Çıkış Yap</Text>
            <Text style={[styles.appInfo, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              Çıkış yapmak istediğinizden emin misiniz?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.modalButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={performLogout}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  appInfo: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  logoutCard: {
    borderRadius: 20,
    padding: 20,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;

