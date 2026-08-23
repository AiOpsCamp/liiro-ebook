import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const HEADER_MAX_HEIGHT = 300;
const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - 48) / 2;

const ShimmerPlaceholder = ({ width, height, style }: any) => {
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[{ width, height, overflow: "hidden", backgroundColor: "#E8E8E8" }, style]}>
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.3)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const VocabularyLoading = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <ShimmerPlaceholder
        width={screenWidth}
        height={HEADER_MAX_HEIGHT}
        style={styles.headerSkeleton}
      />

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ShimmerPlaceholder width={screenWidth * 0.7} height={32} style={styles.titleSkeleton} />
          <ShimmerPlaceholder
            width={screenWidth * 0.5}
            height={20}
            style={styles.subtitleSkeleton}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {[1, 2].map((_, index) => (
            <View key={index} style={styles.statItem}>
              <ShimmerPlaceholder width={80} height={24} style={styles.statLabel} />
              <ShimmerPlaceholder width={60} height={20} style={styles.statValue} />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {[1, 2, 3].map((_, index) => (
            <ShimmerPlaceholder
              key={index}
              width={(screenWidth - 96) / 3}
              height={80}
              style={styles.buttonSkeleton}
            />
          ))}
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsContainer}>
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <View key={index} style={styles.card}>
              <ShimmerPlaceholder width={cardWidth - 24} height={100} style={styles.cardImage} />
              <ShimmerPlaceholder width={cardWidth - 48} height={20} style={styles.cardTitle} />
              <ShimmerPlaceholder
                width={(cardWidth - 48) * 0.8}
                height={16}
                style={styles.cardSubtitle}
              />
              <ShimmerPlaceholder
                width={(cardWidth - 48) * 0.6}
                height={16}
                style={styles.cardText}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors["gray-100"],
  },
  headerSkeleton: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  content: {
    padding: 24,
    backgroundColor: themeColors["white"],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleSkeleton: {
    borderRadius: 8,
    marginBottom: 12,
  },
  subtitleSkeleton: {
    borderRadius: 6,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    borderRadius: 6,
    marginBottom: 8,
  },
  statValue: {
    borderRadius: 4,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  buttonSkeleton: {
    borderRadius: 16,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: cardWidth - 8,
    backgroundColor: themeColors["white"],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    borderRadius: 8,
    marginBottom: 12,
  },
  cardTitle: {
    borderRadius: 4,
    marginBottom: 8,
  },
  cardSubtitle: {
    borderRadius: 4,
    marginBottom: 6,
  },
  cardText: {
    borderRadius: 4,
  },
});

export default VocabularyLoading;
