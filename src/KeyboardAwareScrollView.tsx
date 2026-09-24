import { useEffect, useRef } from 'react';
import { Keyboard, NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps, TextInput } from 'react-native';

type Props = ScrollViewProps & {
  /**
   * How much of the screen below the focused field must stay visible, in
   * points — enough for the buttons that usually sit under an input.
   */
  bottomOffset?: number;
};

/**
 * A ScrollView that keeps the focused field *and what's under it* above the
 * keyboard.
 *
 * KeyboardAvoidingView and iOS's own inset adjustment only guarantee the
 * field itself is visible, which leaves "Update log" or "Sign in" hidden
 * right underneath the keyboard. Here, once the keyboard is up, the view
 * scrolls far enough to reveal `bottomOffset` points below the field.
 */
export function KeyboardAwareScrollView({ bottomOffset = 150, onScroll, children, ...props }: Props) {
  const ref = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    // "Did" rather than "Will": by then iOS has grown the content inset, so
    // the scroll view is allowed to move far enough.
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input) return;
      const keyboardTop = e.endCoordinates.screenY;
      input.measureInWindow((_x, y, _w, height) => {
        const hidden = y + height + bottomOffset - keyboardTop;
        if (hidden > 0) ref.current?.scrollTo({ y: scrollY.current + hidden, animated: true });
      });
    });
    return () => sub.remove();
  }, [bottomOffset]);

  const trackScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  return (
    <ScrollView
      ref={ref}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={trackScroll}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
