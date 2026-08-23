import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Play, Square } from "lucide-react-native";
import { AudioController, AudioUIState } from "@/audio/AudioController";

interface AudioPlayerButtonProps {
  audioUrl: string;
  autoPlay?: boolean;

  playIcon?: React.ReactNode;
  stopIcon?: React.ReactNode;

  showBufferingIndicator?: boolean;

  className?: string;
  style?: ViewStyle | any;
  disabled?: boolean;

  /**
   * Default true:
   * - true: tapping play always restarts from 0
   * - false: if same URL was paused, it resumes
   */
  restartOnPlay?: boolean;
}

export const AudioPlayerButton = memo(
  ({
    audioUrl,
    autoPlay = false,
    playIcon,
    stopIcon,
    showBufferingIndicator = true,
    className,
    style,
    disabled,
    restartOnPlay = true,
  }: AudioPlayerButtonProps) => {
    const [ui, setUI] = useState<AudioUIState>(() => AudioController.getUIState());

    useEffect(() => {
      return AudioController.subscribeUI(setUI);
    }, []);

    const isThisUrl = ui.url === audioUrl;
    const isPlaying = isThisUrl && ui.isPlaying;
    const isBuffering = isThisUrl && ui.isBuffering;

    // Autoplay: controller call only
    useEffect(() => {
      if (!autoPlay) return;
      if (!audioUrl) return;

      const s = AudioController.getUIState();
      if (s.url === audioUrl && s.isPlaying) return;

      const t = setTimeout(() => {
        AudioController.play(audioUrl, { restart: true }).catch(() => {});
      }, 250);

      return () => clearTimeout(t);
    }, [audioUrl, autoPlay]);

    const scale = useSharedValue(1);

    const onPressIn = useCallback(() => {
      scale.value = withTiming(0.98, { duration: 80, easing: Easing.out(Easing.quad) });
    }, [scale]);

    const onPressOut = useCallback(() => {
      scale.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const toggle = useCallback(() => {
      if (!audioUrl) return;
      AudioController.toggle(audioUrl, { restartOnPlay }).catch(() => {});
    }, [audioUrl, restartOnPlay]);

    const DefaultPlayIcon = useMemo(
      () => <Play size={14} color="white" fill="white" style={{ marginLeft: 2 }} />,
      []
    );
    const DefaultStopIcon = useMemo(
      () => <Square size={12} color="white" fill="white" />,
      []
    );

    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={toggle}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || !audioUrl}
          className={className}
          style={({ pressed }) => [
            style,
            {
              opacity: pressed ? 0.85 : 1,
              ...(className
                ? {}
                : {
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                  }),
            },
          ]}
        >
          {showBufferingIndicator && isBuffering ? (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : isPlaying ? (
            stopIcon || DefaultStopIcon
          ) : (
            playIcon || DefaultPlayIcon
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

AudioPlayerButton.displayName = "AudioPlayerButton";