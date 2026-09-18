import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ComponentProps, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AgendaScreen from './src/screens/AgendaScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import TodayScreen from './src/screens/TodayScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { key: string; label: string; icon: IconName; iconOn: IconName; Screen: () => React.JSX.Element }[] = [
  { key: 'today', label: 'Today', icon: 'barbell-outline', iconOn: 'barbell', Screen: TodayScreen },
  { key: 'agenda', label: 'Agenda', icon: 'calendar-outline', iconOn: 'calendar', Screen: AgendaScreen },
  { key: 'history', label: 'History', icon: 'stats-chart-outline', iconOn: 'stats-chart', Screen: HistoryScreen },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState(TABS[0].key);
  const { Screen } = TABS.find((t) => t.key === tab)!;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        {ready ? <Screen /> : <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />}
      </View>
      <SafeAreaView edges={['bottom']} style={styles.tabBar}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Ionicons name={on ? t.iconOn : t.icon} size={24} color={on ? colors.accent : colors.textFaint} />
              <Text style={[styles.tabLabel, on && { color: colors.accent }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  tabLabel: { color: colors.textFaint, fontSize: 11, fontWeight: '600', marginTop: 3 },
});
