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

function WalkingPeople() {
  return (
    <View style={styles.peopleRow}>
      <View style={styles.person}>
        <View style={styles.personHead} />
        <View style={styles.personBody} />
        <View style={styles.personLegs}>
          <View style={styles.personLeg} />
          <View style={[styles.personLeg, { transform: [{ rotate: '18deg' }] }]} />
        </View>
      </View>
      <View style={[styles.person, { marginLeft: 4 }]}>
        <View style={styles.personHead} />
        <View style={styles.personBody} />
        <View style={styles.personLegs}>
          <View style={[styles.personLeg, { transform: [{ rotate: '-12deg' }] }]} />
          <View style={styles.personLeg} />
        </View>
      </View>
    </View>
  );
}

function KeyIcon() {
  return (
    <View style={styles.keyIcon}>
      <View style={styles.keyHead} />
      <View style={styles.keyShaft} />
      <View style={styles.keyBit} />
    </View>
  );
}

function DoorIcon({ handleRotate, doorOpen, holeRef }) {
  const handleDeg = handleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-125deg'],
  });
  const openDeg = doorOpen.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-82deg'],
  });

  return (
    <View style={styles.doorStage}>
      <Animated.View
        style={[
          styles.doorHinge,
          {
            transform: [{ perspective: 800 }, { rotateY: openDeg }],
          },
        ]}
      >
        <View style={styles.door}>
          <View ref={holeRef} collapsable={false} style={styles.keyhole}>
            <View style={styles.keyholeCircle} />
            <View style={styles.keyholeSlot} />
          </View>
          <Animated.View
            style={[
              styles.handle,
              { transform: [{ rotate: handleDeg }] },
            ]}
          >
            <View style={styles.handlePivot} />
            <View style={styles.handleBar} />
            <View style={styles.handleKnob} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('diclebolek@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyTarget, setKeyTarget] = useState(118);
  const walkX = useRef(new Animated.Value(0)).current;
  const walkOpacity = useRef(new Animated.Value(1)).current;
  const keyX = useRef(new Animated.Value(0)).current;
  const keyRotate = useRef(new Animated.Value(0)).current;
  const keyScale = useRef(new Animated.Value(1)).current;
  const keyOpacity = useRef(new Animated.Value(1)).current;
  const handleRotate = useRef(new Animated.Value(0)).current;
  const doorOpen = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const loopRef = useRef(null);
  const pathRef = useRef(null);
  const holeRef = useRef(null);
  const keyTargetRef = useRef(118);
  const insertingRef = useRef(false);

  const measureKeyTarget = () => {
    if (!pathRef.current || !holeRef.current) {
      return;
    }
    pathRef.current.measureInWindow((px) => {
      holeRef.current.measureInWindow((hx, _hy, hw) => {
        const next = hx + hw / 2 - px - 19;
        if (Number.isFinite(next) && next > 20) {
          keyTargetRef.current = next;
          setKeyTarget(next);
        }
      });
    });
  };

  useEffect(() => {
    const walkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(walkX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(walkOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(walkX, {
          toValue: 118,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(walkOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );

    const runKeyCycle = () => {
      if (insertingRef.current) {
        return;
      }
      keyX.setValue(0);
      keyRotate.setValue(0);
      keyScale.setValue(1);
      keyOpacity.setValue(1);
      handleRotate.setValue(0);
      doorOpen.setValue(0);

      const cycle = Animated.sequence([
        Animated.timing(keyX, {
          toValue: keyTargetRef.current,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(keyScale, {
            toValue: 0.12,
            duration: 320,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(keyOpacity, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(handleRotate, {
          toValue: 0.4,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(handleRotate, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(450),
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

    loopRef.current = { walkLoop, glowLoop, keyCycle: null };
    walkLoop.start();
    runKeyCycle();
    glowLoop.start();

    return () => {
      walkLoop.stop();
      glowLoop.stop();
      loopRef.current?.keyCycle?.stop();
    };
  }, [glow, handleRotate, keyOpacity, keyRotate, keyScale, keyX, walkOpacity, walkX]);

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
    const target = keyTargetRef.current;
    walkX.setValue(0);
    walkOpacity.setValue(1);
    keyX.setValue(0);
    keyRotate.setValue(0);
    keyScale.setValue(1);
    keyOpacity.setValue(1);
    handleRotate.setValue(0);
    doorOpen.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(walkX, {
          toValue: Math.max(target - 24, 80),
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(keyX, {
          toValue: target,
          duration: 780,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(keyScale, {
          toValue: 0.08,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(keyOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(walkOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(handleRotate, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(doorOpen, {
        toValue: 1,
        duration: 620,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setTimeout(finishLogin, 220);
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
    loopRef.current?.walkLoop?.stop();
    loopRef.current?.keyCycle?.stop();
    measureKeyTarget();
    setTimeout(playInsertAndOpen, 40);
  };

  const keySpin = keyRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '25deg'],
  });

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

            <View style={styles.actionRow} onLayout={measureKeyTarget}>
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
                {!isLoading ? <WalkingPeople /> : null}
              </TouchableOpacity>

              <View
                ref={pathRef}
                collapsable={false}
                style={styles.path}
                onLayout={measureKeyTarget}
              >
                <Animated.View style={[styles.pathGlow, { opacity: glow }]} />
                <Animated.View
                  style={[
                    styles.walkersOnPath,
                    {
                      opacity: walkOpacity,
                      transform: [{ translateX: walkX }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <WalkingPeople />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.keyOnPath,
                    {
                      opacity: keyOpacity,
                      transform: [
                        { translateX: keyX },
                        { rotate: keySpin },
                        { scale: keyScale },
                      ],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <KeyIcon />
                </Animated.View>
              </View>

              <View style={styles.doorButtonWrap}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.doorButton}
                >
                  <DoorIcon
                    handleRotate={handleRotate}
                    doorOpen={doorOpen}
                    holeRef={holeRef}
                  />
                </LinearGradient>
              </View>
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
  walkersOnPath: {
    position: 'absolute',
    left: -8,
    zIndex: 2,
  },
  keyOnPath: {
    position: 'absolute',
    left: 8,
    zIndex: 8,
  },
  doorButtonWrap: {
    width: 72,
    height: 72,
    overflow: 'visible',
  },
  doorButton: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  doorStage: {
    width: 44,
    height: 52,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'visible',
  },
  doorHinge: {
    width: 34,
    height: 46,
    transformOrigin: 'left center',
  },
  door: {
    width: 34,
    height: 46,
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    alignItems: 'center',
    paddingTop: 14,
  },
  keyhole: {
    alignItems: 'center',
  },
  keyholeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7D2FE',
  },
  keyholeSlot: {
    width: 5,
    height: 9,
    backgroundColor: '#C7D2FE',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  handle: {
    position: 'absolute',
    right: 3,
    top: 20,
    width: 16,
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    transformOrigin: '4px 5px',
  },
  handlePivot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  handleBar: {
    width: 10,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginLeft: -1,
    borderRadius: 1,
  },
  handleKnob: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F8FAFC',
    marginLeft: -1,
  },
  keyIcon: {
    width: 22,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  keyShaft: {
    width: 10,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  keyBit: {
    width: 3,
    height: 6,
    backgroundColor: '#E5E7EB',
    marginLeft: -3,
    marginTop: 4,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  person: {
    width: 12,
    height: 22,
    alignItems: 'center',
  },
  personHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
