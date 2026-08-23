import { AppText as Text, AppTextInput as TextInput } from '@/components/ui/AppText';
import type React from "react";
import { useEffect, useState, useRef, memo } from "react";
import {
  View,
  Pressable,
  Animated,
  Keyboard,
  Dimensions,
  ActivityIndicator} from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { colors } from "@/lib/utils";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
type FormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

type RegistrationFormProps = {
  formData: FormData;
  handleChange: (name: keyof FormData, value: string) => void;
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
  handleSubmit?: () => void;
  isLoading?: boolean;
};

// Regular input field component (non-password)
const InputField = memo(
  ({
    label,
    name,
    value,
    onChangeText,
    onFocus,
    onBlur,
    keyboardType = "default",
    placeholder,
    hasError,
    isFocused,
    icon}: {
    label: string;
    name: string;
    value: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    keyboardType?: "default" | "email-address" | "numeric";
    placeholder?: string;
    hasError?: boolean | string;
    isFocused?: boolean;
    icon?: string;
  }) => {
    return (
      <View className="flex-1 px-2 mb-4">
        <Text className="text-gray-700 font-medium mb-1.5 text-sm">{label}</Text>
        <View className={`relative ${hasError ? "mb-1" : "mb-0"}`}>
          <View className="flex-row items-center relative">
            {icon && (
              <View className="absolute left-3 z-10">
                <FontAwesome5 name={icon as any} size={16} color={colors.darkGreen} />
              </View>
            )}
            <TextInput
              className={`border rounded-xl py-3 ${icon ? "pl-10" : "pl-4"} pr-4 text-base w-full ${
                hasError
                  ? "border-red-500 bg-red-50"
                  : isFocused
                    ? `border-2`
                    : "border-gray-200 bg-gray-50"
              }`}
              style={{
                borderColor: hasError
                  ? colors.error
                  : isFocused
                    ? colors.darkGreen
                    : colors.gray[200],
                backgroundColor: hasError
                  ? AppColors.red50
                  : isFocused
                    ? `${colors.lightGreen}30`
                    : colors.gray[50]}}
              value={value}
              onChangeText={onChangeText}
              onFocus={onFocus}
              onBlur={onBlur}
              keyboardType={keyboardType}
              autoCapitalize={name === "email" ? "none" : name === "username" ? "none" : "words"}
              autoCorrect={false}
              placeholder={placeholder}
              placeholderTextColor={themeColors["gray-400"]}
            />
          </View>
        </View>
        {hasError && typeof hasError === "string" && (
          <Text className="text-red-500 text-xs mt-1">{hasError}</Text>
        )}
      </View>
    );
  }
);
InputField.displayName = "InputField";

// Dedicated Password Input Component
const PasswordInput = ({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  hasError,
  isFocused,
  showPassword,
  onTogglePassword}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
  hasError?: boolean | string;
  isFocused?: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}) => {
  return (
    <View className="flex-1 px-2 mb-4">
      <Text className="text-gray-700 font-medium mb-1.5 text-sm">{label}</Text>
      <View className={`relative ${hasError ? "mb-1" : "mb-0"}`}>
        <View className="flex-row items-center relative">
          <View className="absolute left-3 z-10">
            <FontAwesome5 name="lock" size={16} color={colors.darkGreen} />
          </View>
          <TextInput
            className={`border rounded-xl py-3 pl-10 pr-12 text-base w-full ${
              hasError
                ? "border-red-500 bg-red-50"
                : isFocused
                  ? `border-2`
                  : "border-gray-200 bg-gray-50"
            }`}
            style={{
              borderColor: hasError
                ? colors.error
                : isFocused
                  ? colors.darkGreen
                  : colors.gray[200],
              backgroundColor: hasError
                ? AppColors.red50
                : isFocused
                  ? `${colors.lightGreen}30`
                  : colors.gray[50]}}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            secureTextEntry={!showPassword}
            placeholder={placeholder}
            placeholderTextColor={themeColors["gray-400"]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View className="absolute right-3 top-0 bottom-0 justify-center">
            <Pressable
              onPress={onTogglePassword}
              style={{ padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color={colors.darkGreen}
              />
            </Pressable>
          </View>
        </View>
      </View>
      {hasError && typeof hasError === "string" && (
        <Text className="text-red-500 text-xs mt-1">{hasError}</Text>
      )}
    </View>
  );
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  isLoading = false}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedGender, setSelectedGender] = useState(formData.gender || "");
  const [isFocused, setIsFocused] = useState<{ [key: string]: boolean }>({});
  const [inputValues, setInputValues] = useState<FormData>(formData);
  const { width } = Dimensions.get("window");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isTablet = width > 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    setInputValues(formData);
  }, [formData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true}),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true}),
    ]).start();
     
  }, []);

  useEffect(() => {
    console.log("Password visibility states:", { showPassword, showConfirmPassword });
  }, [showPassword, showConfirmPassword]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!inputValues.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!inputValues.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!inputValues.username.trim()) {
      newErrors.username = "Username is required";
    } else if (inputValues.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }

    // Improved email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2}$/;
    const commonDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
    ];

    if (!inputValues.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(inputValues.email)) {
      newErrors.email = "Please enter a valid email address";
    } else {
      const domain = inputValues.email.split("@")[1]?.toLowerCase();
      if (domain) {
        // Check for common typos in popular domains
        const typoChecks = [
          { correct: "gmail.com", typos: ["gmai.com", "gmial.com", "gmail.co", "gmaill.com"] },
          { correct: "yahoo.com", typos: ["yaho.com", "yahoo.co", "yahooo.com"] },
          { correct: "hotmail.com", typos: ["hotmai.com", "hotmail.co", "hotmial.com"] },
          { correct: "outlook.com", typos: ["outlok.com", "outlook.co", "outloook.com"] },
        ];

        for (const check of typoChecks) {
          if (check.typos.includes(domain)) {
            newErrors.email = `Did you mean ${check.correct}?`;
            break;
          }
        }

        // Check for suspicious domains (too short TLD or suspicious patterns)
        if (!newErrors.email) {
          const tld = domain.split(".").pop();
          if (tld && tld.length < 2) {
            newErrors.email = "Please enter a valid email domain";
          } else if (domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
            newErrors.email = "Please enter a valid email address";
          } else if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
            newErrors.email = "Email domain contains invalid characters";
          }
        }
      }
    }

    if (!inputValues.password) {
      newErrors.password = "Password is required";
    } else if (inputValues.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (inputValues.password !== inputValues.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!selectedGender) {
      newErrors.gender = "Please select a gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    Keyboard.dismiss();
    if (validateForm() && handleSubmit) {
      handleSubmit();
    } else {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true}),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true}),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true}),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true}),
      ]).start();
    }
  };

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
    handleChange("gender", gender);
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setInputValues((prev) => ({ ...prev, [name]: value }));
    handleChange(name, value);
  };

  const handleInputFocus = (name: string) => {
    setIsFocused((prev) => ({ ...prev, [name]: true }));
  };

  const handleInputBlur = (name: string) => {
    setIsFocused((prev) => ({ ...prev, [name]: false }));
  };

  // Separate toggle functions for each password field
  const togglePasswordVisibility = () => {
    console.log(`Toggling password visibility from ${showPassword} to ${!showPassword}`);
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    console.log(
      `Toggling confirm password visibility from ${showConfirmPassword} to ${!showConfirmPassword}`
    );
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "", color: colors.gray[200] };
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const strengthMap = [
      { text: "Weak", color: colors.error },
      { text: "Fair", color: colors.warning },
      { text: "Good", color: colors.mediumGreen },
      { text: "Strong", color: colors.darkGreen },
    ];

    return {
      strength: strength,
      text: strengthMap[strength - 1]?.text || "",
      color: strengthMap[strength - 1]?.color || colors.gray[200]};
  };

  const getEmailValidation = (email: string) => {
    if (!email) return { isValid: true, message: "", color: colors.gray[400] };

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2}$/;

    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Invalid email format", color: colors.error };
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (domain) {
      // Check for common typos
      const typoChecks = [
        { correct: "gmail.com", typos: ["gmai.com", "gmial.com", "gmail.co", "gmaill.com"] },
        { correct: "yahoo.com", typos: ["yaho.com", "yahoo.co", "yahooo.com"] },
        { correct: "hotmail.com", typos: ["hotmai.com", "hotmail.co", "hotmial.com"] },
        { correct: "outlook.com", typos: ["outlok.com", "outlook.co", "outloook.com"] },
      ];

      for (const check of typoChecks) {
        if (check.typos.includes(domain)) {
          return {
            isValid: false,
            message: `Did you mean ${check.correct}?`,
            color: colors.warning};
        }
      }

      // Check domain validity
      const tld = domain.split(".").pop();
      if (tld && tld.length < 2) {
        return { isValid: false, message: "Invalid domain", color: colors.error };
      }

      if (domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
        return { isValid: false, message: "Invalid email format", color: colors.error };
      }

      if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
        return {
          isValid: false,
          message: "Domain contains invalid characters",
          color: colors.error};
      }
    }

    return { isValid: true, message: "Valid email", color: colors.darkGreen };
  };

  const passwordStrength = getPasswordStrength(inputValues.password);
  const emailValidation = getEmailValidation(inputValues.email);

  return (
    <View className="flex-1">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]}}
        className="p-3"
      >
        {/* Name fields */}
        <View className={isTablet ? "flex-row" : ""}>
          <InputField
            label="First Name"
            name="firstName"
            value={inputValues.firstName}
            onChangeText={(text) => handleInputChange("firstName", text)}
            onFocus={() => handleInputFocus("firstName")}
            onBlur={() => handleInputBlur("firstName")}
            placeholder="John"
            hasError={errors.firstName}
            isFocused={isFocused.firstName}
            icon="user"
          />
          <InputField
            label="Last Name"
            name="lastName"
            value={inputValues.lastName}
            onChangeText={(text) => handleInputChange("lastName", text)}
            onFocus={() => handleInputFocus("lastName")}
            onBlur={() => handleInputBlur("lastName")}
            placeholder="Doe"
            hasError={errors.lastName}
            isFocused={isFocused.lastName}
            icon="user"
          />
        </View>

        {/* Username field */}
        <InputField
          label="Username"
          name="username"
          value={inputValues.username}
          onChangeText={(text) => handleInputChange("username", text)}
          onFocus={() => handleInputFocus("username")}
          onBlur={() => handleInputBlur("username")}
          placeholder="your_username"
          hasError={errors.username}
          isFocused={isFocused.username}
          icon="at"
        />

        <View className="mb-2">
          <InputField
            label="Email"
            name="email"
            value={inputValues.email}
            onChangeText={(text) => handleInputChange("email", text)}
            onFocus={() => handleInputFocus("email")}
            onBlur={() => handleInputBlur("email")}
            placeholder="you@example.com"
            keyboardType="email-address"
            hasError={errors.email}
            isFocused={isFocused.email}
            icon="envelope"
          />

          {/* Email validation indicator */}
          {inputValues.email && (
            <View className="px-2 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500">Email Status:</Text>
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: emailValidation.color}}
                >
                  {emailValidation.message}
                </Text>
              </View>
              <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className={`h-1`}
                  style={{
                    width: emailValidation.isValid ? "100%" : "0%",
                    backgroundColor: emailValidation.color}}
                />
              </View>
            </View>
          )}
        </View>

        {/* Password fields - Using dedicated PasswordInput components */}
        <View className="mb-2">
          <PasswordInput
            label="Password"
            value={inputValues.password}
            onChangeText={(text) => handleInputChange("password", text)}
            onFocus={() => handleInputFocus("password")}
            onBlur={() => handleInputBlur("password")}
            placeholder="••••••••"
            hasError={errors.password}
            isFocused={isFocused.password}
            showPassword={showPassword}
            onTogglePassword={togglePasswordVisibility}
          />

          {/* Password strength indicator */}
          {inputValues.password && (
            <View className="px-2 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500">Password Strength:</Text>
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: passwordStrength.color}}
                >
                  {passwordStrength.text}
                </Text>
              </View>
              <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className={`h-1`}
                  style={{
                    width: `${(passwordStrength.strength / 4) * 100}%`,
                    backgroundColor: passwordStrength.color}}
                />
              </View>
            </View>
          )}
        </View>

        <PasswordInput
          label="Confirm Password"
          value={inputValues.confirmPassword}
          onChangeText={(text) => handleInputChange("confirmPassword", text)}
          onFocus={() => handleInputFocus("confirmPassword")}
          onBlur={() => handleInputBlur("confirmPassword")}
          placeholder="••••••••"
          hasError={errors.confirmPassword}
          isFocused={isFocused.confirmPassword}
          showPassword={showConfirmPassword}
          onTogglePassword={toggleConfirmPasswordVisibility}
        />

        {/* Gender selection */}
        <View className="mb-6 px-2">
          <Text className="text-gray-700 font-medium mb-2 text-sm">Gender</Text>
          <View
            className={`${isTablet ? "flex-row" : "flex-col"} space-y-2 space-x-0 ${
              isTablet ? "space-y-0 space-x-2" : ""
            }`}
          >
            {["Male", "Female", "Other"].map((gender) => (
              <Pressable
                key={gender}
                className={`flex-row items-center justify-center py-3 px-4 rounded-xl mb-2 ${
                  isTablet ? "mb-0" : ""
                } ${selectedGender === gender ? "border-2" : "bg-gray-100 border border-gray-200"}`}
                style={{
                  backgroundColor:
                    selectedGender === gender ? `${colors.lightGreen}50` : colors.gray[100],
                  borderColor: selectedGender === gender ? colors.darkGreen : colors.gray[200]}}
                onPress={() => handleGenderSelect(gender)}
              >
                <FontAwesome5
                  name={gender === "Male" ? "mars" : gender === "Female" ? "venus" : "transgender"}
                  size={16}
                  color={selectedGender === gender ? colors.darkGreen : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-medium ${selectedGender === gender ? "text-green-700" : "text-gray-600"}`}
                  style={{ color: selectedGender === gender ? colors.darkGreen : colors.gray[600] }}
                >
                  {gender}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.gender && <Text className="text-red-500 text-xs mt-1">{errors.gender}</Text>}
        </View>

        {/* Terms and conditions */}
        <View className="px-2 mb-4">
          <View
            className="flex-row items-start p-3 rounded-xl"
            style={{ backgroundColor: `${colors.yellow}30` }}
          >
            <FontAwesome5
              name="info-circle"
              size={16}
              color={colors.darkGreen}
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text className="text-xs flex-1" style={{ color: colors.darkGreen }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy. Your
              data will be securely stored and protected.
            </Text>
          </View>
        </View>

        {/* Register button */}
        <View className="px-2 mb-6">
          <Pressable
            onPress={onSubmit}
            disabled={isLoading}
            className="py-4 rounded-xl items-center justify-center"
            style={{ backgroundColor: isLoading ? colors.gray[300] : colors.darkGreen }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">Register</Text>
                <FontAwesome5 name="user-plus" size={16} color="white" />
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

export default RegistrationForm;
