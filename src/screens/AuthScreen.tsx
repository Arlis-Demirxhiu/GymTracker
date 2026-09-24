import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { describe } from '../api';
import { useAuth } from '../auth';
import { Button, Card } from '../components';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { colors, radius } from '../theme';

const MIN_PASSWORD = 8;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';
  const canSubmit = email.trim().includes('@') && password.length >= (isSignUp ? MIN_PASSWORD : 1) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await (isSignUp ? signUp(email, password) : signIn(email, password));
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container} bottomOffset={120}>
        <View style={styles.hero}>
          <Ionicons name="barbell" size={40} color={colors.accent} />
          <Text style={styles.title}>GymTracker</Text>
          <Text style={styles.sub}>Track what you train and what to lift.</Text>
        </View>

        <Card>
          <View style={styles.tabs}>
            {(['signin', 'signup'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[styles.tab, mode === m && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={isSignUp ? `Password (${MIN_PASSWORD}+ characters)` : 'Password'}
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            autoCapitalize="none"
            textContentType={isSignUp ? 'newPassword' : 'password'}
            style={[styles.input, { marginTop: 10 }]}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Button
            label={busy ? 'Just a moment…' : isSignUp ? 'Create account' : 'Sign in'}
            onPress={submit}
            disabled={!canSubmit}
            style={{ marginTop: 14 }}
          />
        </Card>

        <Text style={styles.note}>
          Your account lives on your own GymTracker server. Over plain HTTP on a home network, keep it to a password you
          don't use anywhere else.
        </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 28 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 10 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  tabs: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: radius.pill, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  tabOn: { backgroundColor: colors.accent },
  tabText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  tabTextOn: { color: colors.accentText, fontWeight: '700' },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  note: { color: colors.textFaint, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 18 },
});
