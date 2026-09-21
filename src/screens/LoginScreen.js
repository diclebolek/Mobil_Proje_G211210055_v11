import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemeToggle from '../components/ThemeToggle';

const COLORS = {
  bg: '#111827',
  surface: '#1F2937',
  input: '#1A2234',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  purple: '#6366F1',
  purpleDeep: '#4F46E5',
};

function ButtonIcons() {
  return (
    <View style={styles.buttonIcons}>
      <View style={styles.person}>
        <View style={styles.personHead} />
        <View style={styles.personBody} />
        <View style={styles.personLegs}>
          <View style={styles.personLeg} />
          <View style={styles.personLeg} />
        </View>
      </View>
      <View style={styles.miniDoor}>
        <View style={styles.miniDoorHole} />
      </View>
    </View>
  );
}

function KeyIcon() {
  return (
    <View style={styles.keyIcon}>
      <View style={styles.keyBow}>
        <View style={styles.keyBowHole} />
      </View>
      <View style={styles.keyShaft} />
      <View style={styles.keyTeethCol}>
        <View style={styles.keyToothTall} />
        <View style={styles.keyToothShort} />
      </View>
    </View>
  );
}

function DoorIcon({ handleRotate, holeRef }) {
  const handleDeg = handleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '95deg'],
  });

  return (
    <View style={styles.doorStage}>
      <View style={styles.door}>
        <View
          ref={holeRef}
          collapsable={false}
          style={styles.keyhole}
        >
          <View style={styles.keyholeCircle} />
          <View style={styles.keyholeSlot} />
        </View>
        <Animated.View
          style={[
            styles.handle,
            { transform: [{ rotate: handleDeg }] },
          ]}
        >
          <View style={styles.handleBase} />
          <View style={styles.handleBar} />
        </Animated.View>
      </View>
    </View>
  );
}

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('diclebolek@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyHome, setKeyHome] = useState({ left: 148, top: 36 });
  const keyX = useRef(new Animated.Value(0)).current;
  const keyY = useRef(new Animated.Value(0)).current;
  const keyScale = useRef(new Animated.Value(1)).current;
  const keyOpacity = useRef(new Animated.Value(1)).current;
  const handleRotate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const loopRef = useRef(null);
  const rowRef = useRef(null);
  const keyHomeRef = useRef(null);
  const holeRef = useRef(null);
  const keyDeltaRef = useRef({ x: 90, y: 0 });
  const insertingRef = useRef(false);

  const measureKeyTarget = () => {
    if (!rowRef.current || !keyHomeRef.current || !holeRef.current) {
      return;
    }
    rowRef.current.measureInWindow((rx, ry) => {
      keyHomeRef.current.measureInWindow((sx, sy, sw, sh) => {
        holeRef.current.measureInWindow((hx, hy, hw, hh) => {
          const left = sx - rx;
          const top = sy - ry;
          const dx = hx + hw / 2 - sx - sw / 2;
          const dy = hy + hh / 2 - sy - sh / 2;
          if (Number.isFinite(dx) && Number.isFinite(dy)) {
            keyDeltaRef.current = { x: dx, y: dy };
            setKeyHome({ left, top });
          }
        });
      });
    });
  };

  useEffect(() => {
    const runKeyCycle = () => {
      if (insertingRef.current) {
        return;
      }
      keyX.setValue(0);
      keyY.setValue(0);
      keyScale.setValue(1);
      keyOpacity.setValue(1);
      handleRotate.setValue(0);

      const cycle = Animated.sequence([
        Animated.parallel([
          Animated.timing(keyX, {
            toValue: keyDeltaRef.current.x,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(keyY, {
            toValue: keyDeltaRef.current.y,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(keyScale, {
          toValue: 0.15,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(keyOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(handleRotate, {
          toValue: 0.45,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(handleRotate, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ]);

      cycle.start(({ finished }) => {
        if (finished && !insertingRef.current) {
          runKeyCycle();
        }
      });
      loopRef.current.keyCycle = cycle;
    };

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    loopRef.current = { glowLoop, keyCycle: null };
    runKeyCycle();
    glowLoop.start();

    return () => {
      glowLoop.stop();
      loopRef.current?.keyCycle?.stop();
    };
  }, [glow, handleRotate, keyOpacity, keyScale, keyX, keyY]);

  const finishLogin = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', email.trim());
      onLogin();
    } catch (error) {
      console.error('Login kayıt hatası:', error);
      setIsLoading(false);
      insertingRef.current = false;
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
    }
  };

  const playInsertAndOpen = () => {
    const { x, y } = keyDeltaRef.current;
    keyX.setValue(0);
    keyY.setValue(0);
    keyScale.setValue(1);
    keyOpacity.setValue(1);
    handleRotate.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(keyX, {
          toValue: x,
          duration: 820,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(keyY, {
          toValue: y,
          duration: 820,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(keyScale, {
        toValue: 0.12,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(keyOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(handleRotate, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setTimeout(finishLogin, 180);
      }
    });
  };

  const handleLogin = () => {
    if (insertingRef.current) {
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'Lütfen e-posta ve şifre giriniz.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (email.trim() !== 'diclebolek@gmail.com' || password !== '123456') {
      Alert.alert('Hata', 'E-posta veya şifre hatalı!');
      return;
    }

    insertingRef.current = true;
    setIsLoading(true);
    loopRef.current?.keyCycle?.stop();
    measureKeyTarget();
    setTimeout(() => {
      measureKeyTarget();
      playInsertAndOpen();
    }, 60);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.themeButton}>
        <ThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <LinearGradient
            colors={['#6366F1', '#A78BFA', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleBorder}
          >
            <View style={styles.titleInner}>
              <Text style={styles.logo}>FocusFlow</Text>
            </View>
          </LinearGradient>
          <Text style={styles.subtitle}>Odaklanma ve Verimlilik Uygulaması</Text>

          <View style={styles.form}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="E-posta adresinizi giriniz"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { marginTop: 18 }]}>Şifre</Text>
            <LinearGradient
              colors={['#4F46E5', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.passwordBorder}
            >
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Şifrenizi giriniz"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </LinearGradient>

            <View
              ref={rowRef}
              collapsable={false}
              style={styles.actionRow}
              onLayout={measureKeyTarget}
            >
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Text>
                {!isLoading ? <ButtonIcons /> : null}
              </TouchableOpacity>

              <View style={styles.path} onLayout={measureKeyTarget}>
                <Animated.View style={[styles.pathGlow, { opacity: glow }]} />
                <View
                  ref={keyHomeRef}
                  collapsable={false}
                  style={styles.keyHome}
                />
              </View>

              <View style={styles.doorButtonWrap}>
                <LinearGradient
                  colors={['#6D73F5', '#4F46E5']}
                  style={styles.doorButton}
                >
                  <DoorIcon
                    handleRotate={handleRotate}
                    holeRef={holeRef}
                  />
                </LinearGradient>
              </View>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.keyOverlay,
                  {
                    left: keyHome.left,
                    top: keyHome.top,
                    opacity: keyOpacity,
                    transform: [
                      { translateX: keyX },
                      { translateY: keyY },
                      { scale: keyScale },
                    ],
                  },
                ]}
              >
                <KeyIcon />
              </Animated.View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Demo hesap:{'\n'}
                E-posta: diclebolek@gmail.com{'\n'}
                Şifre: 123456
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  themeButton: {
    position: 'absolute',
    top: 18,
    right: 16,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 36,
    overflow: 'visible',
  },
  titleBorder: {
    alignSelf: 'center',
    borderRadius: 18,
    padding: 2,
    marginBottom: 12,
  },
  titleInner: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 42,
  },
  form: {
    width: '100%',
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.input,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  passwordBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  passwordInput: {
    borderWidth: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    minHeight: 84,
    overflow: 'visible',
    zIndex: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 18,
    minWidth: 142,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  path: {
    flex: 1,
    height: 52,
    marginHorizontal: 6,
    justifyContent: 'center',
    overflow: 'visible',
  },
  pathGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  buttonIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 4,
    height: 22,
  },
  miniDoor: {
    width: 13,
    height: 22,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDoorHole: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.purple,
  },
  keyHome: {
    width: 28,
    height: 16,
    marginLeft: 4,
  },
  keyOverlay: {
    position: 'absolute',
    zIndex: 40,
    elevation: 40,
  },
  doorButtonWrap: {
    width: 74,
    height: 74,
    overflow: 'visible',
  },
  doorButton: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  doorStage: {
    width: 58,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  door: {
    width: 36,
    height: 48,
    backgroundColor: '#0B0F1A',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  keyhole: {
    alignItems: 'center',
    marginTop: 4,
  },
  keyholeCircle: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#C7D2FE',
  },
  keyholeSlot: {
    width: 7,
    height: 10,
    backgroundColor: '#C7D2FE',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: -1,
  },
  handle: {
    position: 'absolute',
    right: -13,
    top: 14,
    width: 24,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    transformOrigin: '6px 6px',
    zIndex: 2,
  },
  handleBase: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#070A12',
  },
  handleBar: {
    width: 14,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#070A12',
    marginLeft: -2,
  },
  keyIcon: {
    width: 28,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyBow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBowHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  keyShaft: {
    width: 11,
    height: 2.5,
    backgroundColor: '#F3F4F6',
    marginLeft: -1,
  },
  keyTeethCol: {
    marginLeft: -1,
    justifyContent: 'flex-end',
    height: 10,
  },
  keyToothTall: {
    width: 5,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 1,
  },
  keyToothShort: {
    width: 3,
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 1,
    marginTop: 1,
  },
  person: {
    width: 12,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  personHead: {
    width: 7,
    height: 6,
    borderRadius: 3.5,
    backgroundColor: '#111827',
  },
  personBody: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#111827',
    marginTop: 1,
  },
  personLegs: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  personLeg: {
    width: 2,
    height: 6,
    backgroundColor: '#111827',
    borderRadius: 1,
  },
  infoContainer: {
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    color: COLORS.muted,
  },
});

export default LoginScreen;
