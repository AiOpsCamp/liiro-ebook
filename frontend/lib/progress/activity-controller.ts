import { AppState, AppStateStatus } from "react-native";
import {
  addActiveSeconds,
  makeLocalDayISO,
  readDoc,
  upsertMeta,
  type ActivityDoc,
} from "./track-vocabulary-progress";

export type Meta = { slug: string | number; name?: string; image_url?: string };

type Options = {
  page: string; // e.g. "challenges"
  getMeta: () => Promise<Meta>;
  onPersist?: (doc: ActivityDoc) => void; // fires on actual writes and on initial snapshot
};

type Session = { startedAt: number; dayKey: string };

export class ScreenActivityControllerExpo {
  private opts: Options;
  private appState: AppStateStatus = AppState.currentState;
  private session: Session | null = null;

  private metaReady = false;
  private meta?: Meta;

  private bufferedSeconds = 0; // seconds accrued before meta
  private bufferedStartAt: number | null = null;

  private removeAppState?: () => void;

  constructor(opts: Options) {
    this.opts = opts;
  }

  attach() {
    const sub = AppState.addEventListener("change", this.onAppStateChange);
    this.removeAppState = () => sub.remove?.();
    this.initMeta(); // try immediately
  }

  dispose() {
    this.endSession("dispose").catch(() => {});
    this.flushBuffer().catch(() => {});
    this.removeAppState?.();
  }

  focus() {
    const now = Date.now();
    if (this.metaReady && this.meta) {
      this.session = { startedAt: now, dayKey: makeLocalDayISO(new Date(now)) };
    } else {
      if (this.bufferedStartAt == null) this.bufferedStartAt = now;
      if (!this.metaReady) this.initMeta(); // retry
    }
  }

  async blur() {
    await this.endSession("blur");
  }

  /** Optional: add seconds on your own event (no timers needed) */
  async bump(seconds: number, at: Date = new Date()) {
    if (!this.metaReady || !this.meta) {
      this.bufferedSeconds += Math.max(0, Math.floor(seconds));
      return;
    }
    const doc = await addActiveSeconds(
      this.meta.slug,
      this.opts.page,
      seconds,
      makeLocalDayISO(at)
    );
    this.opts.onPersist?.(doc);
  }

  /** Persisted doc (no live session added) */
  async getDoc(): Promise<ActivityDoc | null> {
    if (!this.metaReady || !this.meta) return null;
    return readDoc(this.meta.slug);
  }

  /**
   * Live snapshot = persisted + current session elapsed (no write).
   * Safe to call from your existing UI tick (e.g., your countdown).
   */
  async getLiveDoc(): Promise<ActivityDoc | null> {
    if (!this.metaReady || !this.meta) return null;
    const persisted = await readDoc(this.meta.slug);
    const now = Date.now();

    // current in-memory elapsed
    let liveElapsed = 0;
    if (this.session) {
      liveElapsed += Math.max(0, Math.floor((now - this.session.startedAt) / 1000));
    } else if (this.bufferedStartAt != null) {
      liveElapsed += Math.max(0, Math.floor((now - this.bufferedStartAt) / 1000));
    }
    liveElapsed += this.bufferedSeconds;

    if (liveElapsed <= 0) return persisted;

    // merge into today's page bucket
    const dayKey = makeLocalDayISO(new Date(now));
    const page = this.opts.page;

    const clone: ActivityDoc = JSON.parse(
      JSON.stringify(
        persisted ?? {
          slug: this.meta.slug,
          name: "",
          image_url: "",
          activity: {},
        }
      )
    );

    if (!clone.activity[dayKey]) clone.activity[dayKey] = {};
    if (!clone.activity[dayKey][page]) clone.activity[dayKey][page] = { totalActive: 0 };
    clone.activity[dayKey][page].totalActive += liveElapsed;

    return clone;
  }

  // ---------- internals ----------
  private async initMeta() {
    try {
      const meta = await this.opts.getMeta();
      this.meta = meta;
      this.metaReady = true;

      await upsertMeta(meta.slug, { name: meta.name, image_url: meta.image_url });

      // Immediately push a snapshot so UI isn't stuck at null
      const snap = await readDoc(meta.slug);
      this.opts.onPersist?.(snap);

      // flush any buffered time
      await this.flushBuffer();
    } catch {
      this.metaReady = false; // retry on next focus
    }
  }

  private async flushBuffer() {
    if (!this.metaReady || !this.meta) return;
    if (this.bufferedSeconds <= 0) return;
    const seconds = this.bufferedSeconds;
    this.bufferedSeconds = 0;
    const doc = await addActiveSeconds(
      this.meta.slug,
      this.opts.page,
      seconds,
      makeLocalDayISO(new Date())
    );
    this.opts.onPersist?.(doc);
  }

  private onAppStateChange = async (next: AppStateStatus) => {
    const prev = this.appState;
    this.appState = next;
    if (prev === "active" && (next === "background" || next === "inactive")) {
      await this.endSession("app->background");
    }
    if ((prev === "background" || prev === "inactive") && next === "active") {
      this.focus();
    }
  };

  private async endSession(_reason: string) {
    const now = Date.now();

    if (this.session && this.metaReady && this.meta) {
      const { startedAt, dayKey } = this.session;
      this.session = null;

      const totalSec = Math.floor((now - startedAt) / 1000);
      if (totalSec <= 0) return;

      const endKey = makeLocalDayISO(new Date(now));
      if (dayKey === endKey) {
        const doc = await addActiveSeconds(this.meta.slug, this.opts.page, totalSec, dayKey);
        this.opts.onPersist?.(doc);
      } else {
        // split across midnight edge
        const startDayEnd = new Date(dayKey);
        startDayEnd.setDate(startDayEnd.getDate() + 1);
        const boundary = startDayEnd.getTime();
        const firstPart = Math.max(0, Math.floor((boundary - startedAt) / 1000));
        const secondPart = Math.max(0, totalSec - firstPart);
        if (firstPart > 0)
          await addActiveSeconds(this.meta.slug, this.opts.page, firstPart, dayKey);
        if (secondPart > 0)
          await addActiveSeconds(this.meta.slug, this.opts.page, secondPart, endKey);
        const finalDoc = await readDoc(this.meta.slug);
        this.opts.onPersist?.(finalDoc);
      }
      return;
    }

    // meta not ready but we had buffered start
    if (!this.metaReady && this.bufferedStartAt != null) {
      const add = Math.floor((now - this.bufferedStartAt) / 1000);
      if (add > 0) this.bufferedSeconds += add;
      this.bufferedStartAt = null;
    }
  }
}
