import { createElement, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from './theme';

/**
 * YouTube's own embedded player — the video streams from YouTube with the
 * creator credited, which is what embedding permits.
 *
 * The player is loaded from an HTML page with a real https base URL rather
 * than the embed URL directly: YouTube refuses embeds that arrive without a
 * referrer (its "error 153"), and a WebView loading a bare URL sends none.
 */
const embedUrl = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0&modestbranding=1`;

const page = (videoId: string) => `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style>
</head><body>
<iframe src="${embedUrl(videoId)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
</body></html>`;

/** Origin the player page claims; only used as the referrer YouTube asks for. */
const PLAYER_ORIGIN = 'https://gymtracker.app';

export function YouTubePlayer({ videoId, title }: { videoId: string; title?: string }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (Platform.OS === 'web') {
    // The browser build can embed the iframe directly.
    return (
      <View style={styles.frame}>
        {createElement('iframe', {
          src: embedUrl(videoId),
          title: title ?? 'Exercise video',
          allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
          allowFullScreen: true,
          style: { border: 0, width: '100%', height: '100%' },
        })}
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.failText}>Couldn’t load the video. Check your connection.</Text>
        </View>
      ) : (
        <WebView
          source={{ html: page(videoId), baseUrl: PLAYER_ORIGIN }}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          // Taps inside the player that leave it (the YouTube logo, "watch
          // later") open in the YouTube app or browser instead of the sheet.
          setSupportMultipleWindows={false}
          accessibilityLabel={title ? `Video: ${title}` : 'Exercise video'}
        />
      )}
      {loading && !failed && (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  failText: { color: colors.textDim, fontSize: 13, textAlign: 'center' },
});
