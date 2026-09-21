import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BODY_PART_MAP } from './data';
import { colors, radius } from './theme';
import { BodyPart } from './types';

/**
 * Tappable anatomy picker. Shapes are authored for the right half of a
 * 200x440 canvas and mirrored onto the left, so every muscle is one path.
 */

const VIEW_W = 200;
const VIEW_H = 440;

/** Mirrors absolute M/L/C path data across the vertical centre line. */
const mirror = (d: string) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => {
    const isX = i++ % 2 === 0;
    return isX ? `${VIEW_W - Number(n)}` : n;
  });
};

const SILHOUETTE = [
  // torso + leg
  `M 100 58 C 110 60, 116 66, 122 74 C 138 80, 150 90, 152 106
   C 153 126, 148 148, 142 166 C 133 182, 128 196, 127 212
   C 129 226, 133 238, 134 256 C 135 288, 130 312, 125 336
   C 121 356, 118 376, 117 396 C 116 410, 116 420, 118 428
   L 104 428 C 104 412, 106 396, 105 376 C 104 348, 101 312, 100 284 Z`,
  // arm
  `M 146 88 C 158 94, 165 108, 167 128 C 170 152, 174 176, 177 198
   C 179 212, 179 225, 175 230 C 169 234, 163 227, 160 214
   C 155 190, 149 162, 145 140 C 141 120, 140 98, 146 88 Z`,
  // neck + head + foot
  `M 100 52 L 112 54 L 114 74 L 100 76 Z`,
  `M 100 8 C 114 8, 122 20, 122 34 C 122 48, 113 58, 100 58 Z`,
  `M 104 424 L 119 424 C 128 428, 131 437, 122 438 L 104 438 Z`,
];

const DELTOID = `M 126 80 C 141 80, 154 91, 158 108 C 160 122, 155 133, 147 133
                 C 138 132, 130 120, 127 104 C 125 92, 125 84, 126 80 Z`;

const FRONT: { part: BodyPart; d: string }[] = [
  { part: 'shoulders', d: DELTOID },
  {
    part: 'chest',
    d: `M 101 86 L 122 86 C 132 91, 139 101, 140 114
        C 140 124, 132 132, 119 132 C 109 131, 103 125, 101 117 Z`,
  },
  {
    part: 'abs',
    d: `M 101 136 C 108 134, 116 136, 119 141
        C 121 158, 121 176, 118 192 C 115 208, 109 220, 101 228 Z`,
  },
  {
    part: 'biceps',
    d: `M 149 120 C 159 126, 164 140, 164 158 C 163 170, 157 176, 152 172
        C 147 164, 144 146, 145 130 C 146 123, 147 121, 149 120 Z`,
  },
  {
    part: 'forearms',
    d: `M 164 164 C 171 174, 176 192, 179 210 C 180 220, 178 228, 174 228
        C 169 226, 165 214, 162 198 C 160 184, 160 172, 164 164 Z`,
  },
  {
    part: 'quads',
    d: `M 103 250 C 116 246, 128 252, 131 266 C 133 288, 129 312, 123 332
        C 118 342, 110 344, 106 336 C 102 320, 101 286, 103 250 Z`,
  },
  {
    part: 'calves',
    d: `M 108 352 C 117 352, 122 362, 121 380 C 120 396, 116 406, 111 406
        C 107 404, 105 392, 105 376 C 105 364, 106 356, 108 352 Z`,
  },
];

const BACK: { part: BodyPart; d: string }[] = [
  { part: 'shoulders', d: DELTOID },
  {
    part: 'back',
    d: `M 101 80 L 121 79 C 129 85, 133 97, 134 109
        C 139 127, 141 147, 137 165 C 129 181, 115 191, 101 193 Z`,
  },
  {
    part: 'triceps',
    d: `M 149 118 C 160 124, 165 140, 165 160 C 164 172, 158 178, 153 174
        C 148 165, 145 146, 146 130 C 147 122, 148 119, 149 118 Z`,
  },
  {
    part: 'forearms',
    d: `M 165 164 C 172 174, 177 192, 180 210 C 181 220, 179 228, 175 228
        C 170 226, 166 214, 163 198 C 161 184, 161 172, 165 164 Z`,
  },
  {
    part: 'glutes',
    d: `M 101 206 C 114 202, 127 209, 131 223 C 133 238, 128 251, 116 254
        C 108 255, 103 250, 101 243 Z`,
  },
  {
    part: 'hamstrings',
    d: `M 102 259 C 114 257, 126 263, 129 277 C 131 297, 127 317, 122 333
        C 117 343, 109 344, 106 335 C 102 319, 101 285, 102 259 Z`,
  },
  {
    part: 'calves',
    d: `M 107 350 C 118 350, 124 362, 123 382 C 122 398, 117 408, 111 408
        C 106 406, 104 392, 104 376 C 104 362, 105 353, 107 350 Z`,
  },
];

/** Parts the figure can show; anything else (cardio) needs a chip. */
export const MAPPED_PARTS: BodyPart[] = Array.from(new Set([...FRONT, ...BACK].map((r) => r.part)));

export function BodyMap({
  selected,
  onToggle,
  planned = [],
  height = 330,
}: {
  selected: BodyPart[];
  onToggle: (p: BodyPart) => void;
  planned?: BodyPart[];
  height?: number;
}) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const regions = view === 'front' ? FRONT : BACK;

  const muscle = (part: BodyPart, d: string, key: string) => {
    const on = selected.includes(part);
    const isPlanned = !on && planned.includes(part);
    const color = BODY_PART_MAP[part].color;
    return (
      <Path
        key={key}
        d={d}
        fill={on || isPlanned ? color : colors.muscle}
        fillOpacity={isPlanned ? 0.22 : 1}
        stroke={on ? '#FFFFFF' : isPlanned ? color : colors.muscleLine}
        strokeOpacity={on ? 0.5 : 1}
        strokeWidth={isPlanned ? 1.5 : 1.2}
        strokeDasharray={isPlanned ? [4, 3] : undefined}
        onPress={() => onToggle(part)}
        accessibilityLabel={`${BODY_PART_MAP[part].label}${on ? ', selected' : ''}`}
      />
    );
  };

  return (
    <View>
      <View style={styles.viewToggle}>
        {(['front', 'back'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[styles.viewBtn, view === v && styles.viewBtnOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
          >
            <Text style={[styles.viewText, view === v && styles.viewTextOn]}>
              {v === 'front' ? 'Front' : 'Back'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
        {SILHOUETTE.map((d, i) => (
          <Path key={`s${i}`} d={d} fill={colors.silhouette} stroke={colors.silhouetteLine} strokeWidth={1.5} />
        ))}
        {SILHOUETTE.map((d, i) => (
          <Path key={`sm${i}`} d={mirror(d)} fill={colors.silhouette} stroke={colors.silhouetteLine} strokeWidth={1.5} />
        ))}
        {regions.map((r) => muscle(r.part, r.d, `r-${r.part}`))}
        {regions.map((r) => muscle(r.part, mirror(r.d), `l-${r.part}`))}
      </Svg>

      <Text style={styles.hint}>
        Tap a muscle to select it{view === 'front' ? ' — switch to Back for lats, glutes & hamstrings' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 8,
  },
  viewBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: radius.pill },
  viewBtnOn: { backgroundColor: colors.accent },
  viewText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  viewTextOn: { color: colors.accentText, fontWeight: '700' },
  hint: { color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: 4 },
});
