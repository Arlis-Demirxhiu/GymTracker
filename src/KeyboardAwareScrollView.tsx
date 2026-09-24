import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
} from 'react-native';

type Props = ScrollViewProps & {
  /**
   * How much of the screen below the focused field must stay visible, in
   * points — enough for the buttons that usually sit under an input.
   */
  bottomOffset?: number;
};

/** iOS announces the keyboard before it moves; Android only after the window resizes. */
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * A ScrollView that keeps the focused field *and what's under it* above the
 * keyboard, moving together with the keyboard rather than after it.
 *
 * React Native's own `automaticallyAdjustKeyboardInsets` animates in step with
 * the keyboard but only brings the field's text into view, which leaves
 * "Update log" or "Sign in" hidden right underneath. So this does it by hand:
 * as soon as iOS says the keyboard is about to appear, it adds room at the
 * bottom equal to the keyboard's height and scrolls far enough to reveal
 * `bottomOffset` points below the field — during the keyboard's slide.
 *
 * iOS sends "keyboard will show" *before* React Native records which field
 * was tapped, so the field is looked up on the next frame, not in the event.
 */
export function KeyboardAwareScrollView({ bottomOffset = 150, onScroll, contentInset, children, ...props }: Props) {
  const ref = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let frame = 0;

    const reveal = (keyboardTop: number, attemptsLeft: number) => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input) {
        // Focus hasn't been recorded yet; try again next frame, briefly.
        if (attemptsLeft > 0) frame = requestAnimationFrame(() => reveal(keyboardTop, attemptsLeft - 1));
        return;
      }
      input.measureInWindow((_x, y, _w, height) => {
        const hidden = y + height + bottomOffset - keyboardTop;
        if (hidden > 0) ref.current?.scrollTo({ y: scrollY.current + hidden, animated: true });
      });
    };

    const show = Keyboard.addListener(SHOW, (e) => {
      // Android shrinks the window around the keyboard, so only iOS needs the
      // extra room to scroll into.
      if (Platform.OS === 'ios') setKeyboardHeight(e.endCoordinates.height);
      cancelAnimationFrame(frame);
      // The inset above needs one frame to reach the native view; scrolling
      // earlier would be clamped to the old, shorter content.
      frame = requestAnimationFrame(() => reveal(e.endCoordinates.screenY, 5));
    });
    const hide = Keyboard.addListener(HIDE, () => {
      cancelAnimationFrame(frame);
      setKeyboardHeight(0);
    });
    return () => {
      cancelAnimationFrame(frame);
      show.remove();
      hide.remove();
    };
  }, [bottomOffset]);

  const trackScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  const bottomInset = Math.max(keyboardHeight, contentInset?.bottom ?? 0);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={trackScroll}
      contentInset={{ ...contentInset, bottom: bottomInset }}
      scrollIndicatorInsets={{ bottom: bottomInset }}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
