import apiSlice from "@/api/mainQuery";

interface GoogleAuthResponse {
  success: boolean;
  data?: {
    // Normalized shape: tokens nested under data.tokens (matches login/firebaseExchange).
    tokens?: { accessToken: string; refreshToken?: string };
    onboardingStatus?: boolean;
    isNewUser?: boolean;
    user?: any;
    // Legacy top-level accessToken kept optional for backward compatibility.
    accessToken?: string;
  };
  user?: { onBoarding?: boolean };
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: { accessToken?: string; user?: any };
  onboardingStatus?: boolean | "true" | "false" | 1 | 0 | "1" | "0";
  user?: { id: string; email: string; username?: string; firebase_uuid?: string };
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    firebase: {
      idToken: string;
      refreshToken: string;
      uid: string;
    };
    onboardingStatus: boolean;
    user: {
      id: string;
      email: string;
      username: string;
      emailVerified: boolean;
      firebase_uuid: string;
      accountStatus: string;
    };
  };
}

/**
 * ✅ New response type for POST /auth/firebase (firebaseExchange)
 * This matches your backend controller: auth.firebase.controller -> firebaseExchange
 */
interface FirebaseExchangeResponse {
  success: boolean;
  message?: string;
  data?: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    // Your backend currently returns firebase.idToken too, but you don't need it client-side.
    // Keep it optional for backward compatibility.
    firebase?: {
      idToken?: string;
      refreshToken?: string | null;
      uid?: string;
    };
    onboardingStatus: boolean;
    user: {
      id: string;
      email: string;
      username: string;
      emailVerified: boolean;
      firebase_uuid: string;
      accountStatus: string;
    };
  };
}

type ChangePasswordArgs = {
  email: string;
  oldPassword: string;
  newPassword: string;
  token?: string;
};

const authQuery = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserInfo: builder.query({
      query: () => ({
        url: "/auth/v2/me",
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data || response,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data && typeof data.unreadNotificationsCount === "number") {
            dispatch(
              (apiSlice.util.upsertQueryData as any)(
                "getUnreadNotificationsCount",
                undefined,
                {
                  success: true,
                  data: { unreadCount: data.unreadNotificationsCount },
                }
              )
            );
          }
        } catch (error) {
          console.error("Error populating unread count cache:", error);
        }
      },
    }),

    // Legacy Firebase REST email/password login (backend receives password)
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "/auth/fb-email-login",
        method: "POST",
        body: { email, password },
      }),
    }),

    // Legacy Google endpoint (you can keep it, but recommended to use /auth/firebase instead)
    googleAuth: builder.mutation<GoogleAuthResponse, { token: string }>({
      query: ({ token }) => ({
        url: "/auth/google-auth",
        method: "POST",
        body: { token },
      }),
    }),

    // Legacy Firebase REST registration
    register: builder.mutation<RegisterResponse, { email: string; password: string; username?: string }>({
      query: ({ email, password, username }) => ({
        url: "/auth/fb-email-register",
        method: "POST",
        body: { email, password, username },
      }),
    }),

    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/fb-email-forgot",
        method: "POST",
        body,
      }),
    }),

    resendVerification: builder.mutation<void, { idToken: string }>({
      query: ({ idToken }) => ({
        url: "/auth/fb-resend-verification",
        method: "POST",
        body: { idToken },
      }),
    }),

    changePassword: builder.mutation<{ message?: string }, ChangePasswordArgs>({
      query: ({ email, oldPassword, newPassword, token }) => ({
        url: "/auth/fb-change-password",
        method: "POST",
        body: { currentPassword: oldPassword, newPassword },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    }),

    /**
     * ✅ NEW: Firebase SDK-first exchange endpoint
     * Client does: Firebase SDK login (Google/Apple/etc) -> user.getIdToken()
     * Then call this endpoint to get YOUR backend JWT tokens.
     *
     * Backend route: router.post("/firebase", firebaseAuthController.firebaseExchange);
     * Full URL here (because apiSlice base likely already includes /api/v1):
     *   /auth/firebase
     */
    firebaseExchange: builder.mutation<FirebaseExchangeResponse, { token: string }>({
      query: ({ token }) => ({
        url: "/auth/firebase",
        method: "POST",
        body: { token },
      }),
    }),

    /**
     * ✅ Optional: backend refresh (uses refreshToken cookie)
     * Only works if your app is actually using cookies (web) or you’ve set them up on native.
     * If you’re using tokens in AsyncStorage and Authorization header, you can ignore this.
     */
    firebaseRefresh: builder.mutation<{ success: boolean; data?: { accessToken: string } }, void>({
      query: () => ({
        url: "/auth/firebase/refresh",
        method: "POST",
      }),
    }),

    /**
     * ✅ Optional: backend logout endpoints
     */
    firebaseLogout: builder.mutation<{ success: boolean; message?: string }, void>({
      query: () => ({
        url: "/auth/firebase/logout",
        method: "POST",
      }),
    }),
  }),

  overrideExisting: true,
});

export const {
  useGetUserInfoQuery,
  useLoginMutation,
  useGoogleAuthMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResendVerificationMutation,
  useChangePasswordMutation,

  // ✅ export new hooks
  useFirebaseExchangeMutation,
  useFirebaseRefreshMutation,
  useFirebaseLogoutMutation,
} = authQuery;

export default authQuery;