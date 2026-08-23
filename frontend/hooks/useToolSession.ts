import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import {
    selectLearnSession,
    endLearnSession,
    markReloaded,
    clearLearnSession,
    getTrialKeyForSession,
    ToolSessionType,
} from "@/redux/features/learnSessionSlice";
import { selectIsSubscribed } from "@/redux/features/subscriptionSlice";
import { useLazyGetTrialStatusQuery } from "@/redux/query/lexicon-query";

export type ToolScreenState =
    | "loading"
    | "ready"
    | "session_ended"
    | "trial_limit"
    | "redirect";

export type TrialResetInfo = { at: string | null; in: number | null } | null;

/**
 * Shared hook that manages session lifecycle for any learning tool page.
 * Handles: Redux config reading, reload detection, trial limit checks, web overscroll.
 *
 * @param expectedToolId - The tool this page is for (e.g. "test", "flashcards")
 */
export function useToolSession(expectedToolId: ToolSessionType) {
    const router = useRouter();
    const dispatch = useDispatch();
    const session = useSelector(selectLearnSession);
    const isSubscribed = useSelector(selectIsSubscribed);
    const hasHandledMount = useRef(false);
    const [screenState, setScreenState] = useState<ToolScreenState>("loading");
    const [remainingTimeOnReload, setRemainingTimeOnReload] = useState<number | null>(null);
    const [trialReset, setTrialReset] = useState<TrialResetInfo>(null);
    const [fetchTrialStatus] = useLazyGetTrialStatusQuery();

    const config = session.config;
    const slug = config?.slug || "";

    // Handle mount: check session status and reload detection
    useEffect(() => {
        if (hasHandledMount.current) return;
        hasHandledMount.current = true;

        if (!config || session.status === "idle") {
            setScreenState("redirect");
            return;
        }

        // Check tool mismatch — if session is for a different tool, redirect
        if (config.toolId !== expectedToolId) {
            setScreenState("redirect");
            return;
        }

        if (session.status === "ended") {
            // Session already ended (e.g. double reload) — redirect to pack
            dispatch(clearLearnSession());
            setScreenState("redirect");
            return;
        }

        if (session.status === "active" && session.reloadCount > 0) {
            // Session was active but this is a reload — calculate remaining time
            if (config.timeLimitSeconds && config.timeLimitSeconds > 0 && session.startedAt) {
                const elapsedSec = Math.floor((Date.now() - session.startedAt) / 1000);
                const remaining = Math.max(0, config.timeLimitSeconds - elapsedSec);
                setRemainingTimeOnReload(remaining);
            } else {
                // No time limit (unlimited mode)
                setRemainingTimeOnReload(null);
            }

            dispatch(endLearnSession());
            setScreenState("session_ended");
            return;
        }

        // Active session, first load — mark as reloaded for future reloads
        dispatch(markReloaded());
        setScreenState("ready");

    }, []);

    // Redirect effect
    useEffect(() => {
        if (screenState !== "redirect") return;
        if (slug) {
            router.replace({
                pathname: "/words/start/[slug]",
                params: { slug },
            });
        } else {
            router.replace("/");
        }
    }, [screenState, slug, router]);

    // Disable pull-to-refresh on web (overscroll)
    useEffect(() => {
        if (Platform.OS !== "web") return;
        const style = document.createElement("style");
        style.textContent = "body { overscroll-behavior-y: contain; }";
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    /**
     * Call this after API data loads to check trial limits.
     * Returns true if the trial limit is exceeded (screen state will be set).
     *
     * NOTE: the backend session-data endpoints now enforce trials server-side
     * (a depleted trial returns HTTP 403 with no session content, rather than
     * silently including full data). This client-side check is a fast, local
     * mirror of that same `trialLimits` payload for a snappier UI — it is not
     * the security boundary.
     */
    const checkTrialLimit = (apiData: any): boolean => {
        if (screenState !== "ready" || isSubscribed) return false;

        if (apiData?.trialReset) setTrialReset(apiData.trialReset);

        // If apiData delivered valid session content, the server consumed the credit and authorized this session.
        // Do NOT block this session just because remaining count after consumption is now 0.
        const hasSessionContent = Array.isArray(apiData)
            ? apiData.length > 0
            : (apiData?.flatTerms?.length > 0 || apiData?.cycles?.length > 0);

        if (hasSessionContent) {
            return false;
        }

        const trialLimits = apiData?.trialLimits;
        if (!trialLimits) return false;

        const trialKey = getTrialKeyForSession(config);
        const remaining = trialLimits[trialKey];

        if (typeof remaining === "number" && remaining <= 0) {
            dispatch(endLearnSession());
            setScreenState("trial_limit");
            return true;
        }

        return false;
    };

    /**
     * Handle a 403 trial_limit_exceeded response from a session-data query
     * (the real, server-side enforcement path). Pass the RTK Query `error`
     * object here from the tool screen when a fetch fails.
     */
    const handleTrialError = useCallback((error: any): boolean => {
        const status = error?.status ?? error?.originalStatus;
        const body = error?.data;
        if (status === 403 && body?.error === "trial_limit_exceeded") {
            if (body?.trialReset) setTrialReset(body.trialReset);
            dispatch(endLearnSession());
            setScreenState("trial_limit");
            return true;
        }
        return false;
    }, [dispatch]);

    /**
     * Re-check trial status (read-only, does not consume) and, if the reset has
     * occurred and this tool has quota again, transition back to "ready" so the
     * tool screen's data query re-fires. This is what makes the reset actually
     * take effect live, instead of requiring the user to navigate away and back.
     */
    const retryTrial = useCallback(async (): Promise<boolean> => {
        try {
            const result = await fetchTrialStatus().unwrap();
            if (result.premium) {
                setScreenState("ready");
                return true;
            }
            const trialKey = getTrialKeyForSession(config);
            const remaining = result.trialLimits?.[trialKey];
            if (typeof remaining !== "number" || remaining > 0) {
                setScreenState("ready");
                return true;
            }
            if (result.trialReset) setTrialReset(result.trialReset);
            return false;
        } catch {
            return false;
        }
    }, [fetchTrialStatus, expectedToolId]);

    /** Dispatch endLearnSession — call when session completes normally */
    const endSession = useCallback(() => {
        dispatch(endLearnSession());
    }, [dispatch]);

    /** Dispatch clearLearnSession — call on full cleanup */
    const clearSession = useCallback(() => {
        dispatch(clearLearnSession());
    }, [dispatch]);

    return {
        screenState,
        config,
        slug,
        isSubscribed,
        remainingTimeOnReload,
        trialReset,
        checkTrialLimit,
        handleTrialError,
        retryTrial,
        endSession,
        clearSession,
    };
}
