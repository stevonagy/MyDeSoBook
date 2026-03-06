import { configure, identity } from "https://cdn.jsdelivr.net/npm/deso-protocol@3.4.1/+esm";

const NODE_URL = "https://node.deso.org";
const FEE_RATE = 1000;
const COMMENTS_PAGE_SIZE = 20;

const CROSSPOST_ORIGIN = "https://mytalkzone.xyz";
const CROSSPOST_BASE = "/mycrossposter";
const FB_SHARE_TEXT = "Check this post on DeSo blockchain:";

function buildCrossposterShareUrl(postHashHex) {
  return `${CROSSPOST_ORIGIN}${CROSSPOST_BASE}/p/${postHashHex}`;
}

async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  // Fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {}
  return false;
}

function openFacebookShare(shareUrl) {
  const fbUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` +
    `&quote=${encodeURIComponent(FB_SHARE_TEXT)}`;
  window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=700");
}

// Best-effort: resolve the post hash by looking up your latest posts (copied from your MyCrossPoster app logic)
async function resolvePostHashByLookingUpLatest({ body, imageURLs }) {
  if (!state.user?.publicKey) return null;

  const targetBody = String(body || "").trim();
  const targetImg = String((imageURLs?.[0] || "")).trim();

  const attempts = 10;
  for (let i = 0; i < attempts; i++) {
    try {
      const data = await apiPost("/api/v0/get-posts-for-public-key", {
        PublicKeyBase58Check: state.user.publicKey,
        ReaderPublicKeyBase58Check: state.user.publicKey,
        NumToFetch: 10,
      });
      const posts = data?.Posts || [];
      if (posts.length) {
        // Strict match first
        for (const p of posts) {
          const b = String(p?.Body || "").trim();
          const img0 = String((p?.ImageURLs?.[0] || "")).trim();
          const h = p?.PostHashHex;
          if (!h) continue;

          const bodyMatch = targetBody && b === targetBody;
          const imgMatch = !targetImg || img0 === targetImg;
          if (bodyMatch && imgMatch) return h;
        }
        // Soft match (prefix)
        const softTarget = targetBody.replace(/\s+/g, " ").slice(0, 80);
        for (const p of posts) {
          const b = String(p?.Body || "").trim().replace(/\s+/g, " ");
          const h = p?.PostHashHex;
          if (!h) continue;
          if (softTarget && b.includes(softTarget)) return h;
        }
      }
    } catch {}
    await sleep(800);
  }
  return null;
}



const ICONS = {
  like: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,
  comment: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>`,
  repost: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>`,
  diamond: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
    <path d="M2 9h20" />
    <path d="M8 9l4 13 4-13" />
    <path d="M11 3 8 9" />
    <path d="M13 3 16 9" />
  </svg>`
};


// ---- UI refs
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const postBtn = document.getElementById("postBtn");

const postGroupSelectEl = document.getElementById("postGroupSelect");

// Groups UI
const groupsStatusEl = document.getElementById("groupsStatus");
const groupsListEl = document.getElementById("groupsList");
const myGroupsCountEl = document.getElementById("myGroupsCount");
const groupsRefreshBtn = document.getElementById("groupsRefreshBtn");
const groupNameInputEl = document.getElementById("groupNameInput");
const groupDescInputEl = document.getElementById("groupDescInput");
const createGroupBtn = document.getElementById("createGroupBtn");
const importGroupInputEl = document.getElementById("importGroupInput");
const importGroupBtn = document.getElementById("importGroupBtn");

const groupTitleEl = document.getElementById("groupTitle");
const groupSubtitleEl = document.getElementById("groupSubtitle");
const groupIdLineEl = document.getElementById("groupIdLine");
const groupCopyIdBtn = document.getElementById("groupCopyIdBtn");
const groupJoinBtn = document.getElementById("groupJoinBtn");
const groupLeaveBtn = document.getElementById("groupLeaveBtn");
const groupShareBtn = document.getElementById("groupShareBtn");
const groupRefreshBtn = document.getElementById("groupRefreshBtn");
const groupFeedStatusEl = document.getElementById("groupFeedStatus");
const groupPinnedEl = document.getElementById("groupPinned");
const groupFeedEl = document.getElementById("groupFeed");
const groupLoadMoreBtn = document.getElementById("groupLoadMoreBtn");
const fbShareToggle = document.getElementById("fbShareToggle");
const whoami = document.getElementById("whoami");
const feedEl = document.getElementById("feed");
const tabFollowingBtn = document.getElementById("tabFollowing");
const tabGlobalBtn = document.getElementById("tabGlobal");
const tabFavoriteBtn = document.getElementById("tabFavorite");
const refreshFeedBtn = document.getElementById("refreshFeedBtn");
const feedStatus = document.getElementById("feedStatus");
const postStatus = document.getElementById("postStatus");
const composerAvatar = document.getElementById("composerAvatar");

// Notifications UI
const notifBadgeEl = document.getElementById("notifBadge");
const notificationsListEl = document.getElementById("notificationsList");
const notificationsStatusEl = document.getElementById("notificationsStatus");
const refreshNotificationsBtn = document.getElementById("refreshNotificationsBtn");

// Post detail UI
const postDetailEl = document.getElementById("postDetail");
const postDetailStatusEl = document.getElementById("postDetailStatus");
const postBackBtn = document.getElementById("postBackBtn");
const postViewTitleEl = document.getElementById("postViewTitle");

const addPhotosBtn = document.getElementById("addPhotosBtn");
const imageInput = document.getElementById("imageInput");
const thumbsEl = document.getElementById("thumbs");
const photoCountEl = document.getElementById("photoCount");

// Stories UI
const storiesBarEl = document.getElementById("storiesBar");
const storiesStatusEl = document.getElementById("storiesStatus");
const refreshStoriesBtn = document.getElementById("refreshStoriesBtn");
const storyInputEl = document.getElementById("storyInput");
const storyModalEl = document.getElementById("storyModal");
const storyModalImgEl = document.getElementById("storyModalImg");
const storyModalNameEl = document.getElementById("storyModalName");
const storyModalTimeEl = document.getElementById("storyModalTime");
const storyModalCloseEl = document.getElementById("storyModalClose");
const storyOpenImgEl = document.getElementById("storyOpenImg");
const storyOpenPostEl = document.getElementById("storyOpenPost");
const addVideoBtn = document.getElementById("addVideoBtn");
const videoInput = document.getElementById("videoInput");
const videoChip = document.getElementById("videoChip");
const videoNameEl = document.getElementById("videoName");
const removeVideoBtn = document.getElementById("removeVideoBtn");
const videoProgressEl = document.getElementById("videoProgress");



// ---- SDK init (this is the login approach from your working app.js)
configure({
  // Change appName to force a new derived key approval when permissions change.
  // (Helps when an older derived key is cached with restrictive limits.)
  appName: "DeSoBook Actions +Profile",
  nodeURI: NODE_URL,

  // Derived key permissions:
  // - Diamonds are a BASIC_TRANSFER tx type (with extra metadata), so BASIC_TRANSFER must be allowed.
  // - Likes are LIKE tx type.
  // - Posts/comments/reposts are SUBMIT_POST.
  spendingLimitOptions: {
    TransactionCountLimitMap: {
      BASIC_TRANSFER: "UNLIMITED",
      LIKE: "UNLIMITED",
      SUBMIT_POST: "UNLIMITED",
      FOLLOW: "UNLIMITED",
      UPDATE_PROFILE: "UNLIMITED",
    },
    // Allow spending for tips (diamonds). Keep generous; user can still approve in Identity.
    GlobalDESOLimit: 1 * 1e9, // 1 DESO in nanos
  },

  MinFeeRateNanosPerKB: FEE_RATE,
});

let identityState = { currentUser: null, alternateUsers: [], event: null };
identity.subscribe((st) => { identityState = st || identityState; });

// ---- state
let state = {
  groups: [], // { id, name, desc, ownerPk, manifestPostHash, createdAt }
  joinedGroups: new Set(), // set of group ids

  user: null, // { publicKey, username }
  feedMode: "following", // "following" | "global" | "favorite"
  favorites: new Set(), // local favorites: Set<publicKey>
  followingCache: new Set(), // local UI cache for followed users (best-effort)
  feed: { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() },
  images: [], // { file, url(objectURL), name, size }
video: null, // { file, url(objectURL), name, size }

  notifications: {
    loading: false,
    exhausted: false,
    nextIndex: -1,
    seen: new Set(),
    latestIndex: null,
  },
  postCommentsUI: null, // { hash, refresh: () => void }
};

// Restore local favorites
state.favorites = loadFavoritesFromStorage();

let activeHashtag = null; // e.g. "#DeSo"

function friendlyDerivedKeyError(msg) {
  const s = String(msg || "");
  if (
    s.includes("RuleErrorDerivedKeyTxnTypeNotAuthorized") ||
    s.includes("_checkAndUpdateDerivedKeySpendingLimit") ||
    s.includes("No more transactions of type")
  ) {
    return (
      "Derived key nema dozvole za ovu akciju (Like/Diamond/Follow/Profile update).\n\n" +
      "Rješenje: klikni Logout → Login i u Identity prozoru odobri nove dozvole za DeSoBook Actions (LIKE, SUBMIT_POST, BASIC_TRANSFER, FOLLOW, UPDATE_PROFILE).\n" +
      "Ako ne pita za dozvole, u Identity walletu obriši/ukloni stari derived key za DeSoBook pa login ponovno."
    );
  }
  return s;
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function setStatus(el, msg){ el.textContent = msg || ""; }

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalizeMediaUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  // Common decentralized URL schemes -> http gateways
  if (s.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + s.slice("ipfs://".length);
  if (s.startsWith("ar://")) return "https://arweave.net/" + s.slice("ar://".length);
  return s;
}


// Video helpers (HLS + direct)
function attachVideo(videoEl, url) {
  if (!videoEl || !url) return;

  try {
    videoEl.setAttribute("playsinline", "true");
    videoEl.setAttribute("controls", "true");
    videoEl.setAttribute("preload", "metadata");

    const u = String(url);
    const lower = u.toLowerCase();

    const looksLikeHls =
      lower.includes("m3u8") ||
      lower.includes("/hls") ||
      lower.includes("playlist") ||
      lower.includes("master");

    const looksLikeFile = lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov");

    const fallbackToDirect = () => {
      try { videoEl.removeAttribute("crossorigin"); } catch {}
      videoEl.src = u;
    };

    if (looksLikeHls && !looksLikeFile) {
      // Safari native HLS
      if (videoEl.canPlayType && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        fallbackToDirect();
        return;
      }
      // hls.js for Chrome/Firefox
      const Hls = window.Hls;
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          manifestLoadingTimeOut: 20000,
          levelLoadingTimeOut: 20000,
          fragLoadingTimeOut: 20000,
        });
        hls.on(Hls.Events.ERROR, (evt, data) => {
          if (data?.fatal) {
            try { hls.destroy(); } catch {}
            fallbackToDirect();
          }
        });
        hls.loadSource(u);
        hls.attachMedia(videoEl);
        return;
      }
      fallbackToDirect();
      return;
    }

    // Direct file (mp4 etc)
    fallbackToDirect();
  } catch (e) {
    console.warn("attachVideo failed:", e);
    try { videoEl.src = String(url); } catch {}
  }
}

function initVideos(container) {
  if (!container) return;
  container.querySelectorAll("video.post-video[data-src]").forEach(video => {
    const url = video.getAttribute("data-src");
    if (!url) return;

    video.addEventListener("error", () => {
      if (video.dataset.errShown === "1") return;
      video.dataset.errShown = "1";
      const hint = document.createElement("div");
      hint.className = "muted";
      hint.style.marginTop = "6px";
      hint.style.fontSize = "12px";
      hint.innerHTML = `Video can't be played here. <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Open video</a>`;
      video.insertAdjacentElement("afterend", hint);
    });

    attachVideo(video, url);
  });
}


function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem("deso_favorites_v1");
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter(Boolean));
  } catch {
    return new Set();
  }
}
function saveFavoritesToStorage() {
  try { localStorage.setItem("deso_favorites_v1", JSON.stringify(Array.from(state.favorites))); } catch {}
}
function toggleFavoritePublicKey(pk) {
  if (!pk) return false;
  const had = state.favorites.has(pk);
  if (had) state.favorites.delete(pk);
  else state.favorites.add(pk);
  saveFavoritesToStorage();
  return !had;
}

function setFeedTabActive() {
  if (tabFollowingBtn) tabFollowingBtn.classList.toggle("active", state.feedMode === "following");
  if (tabGlobalBtn) tabGlobalBtn.classList.toggle("active", state.feedMode === "global");
  if (tabFavoriteBtn) tabFavoriteBtn.classList.toggle("active", state.feedMode === "favorite");
}

function resetFeed() {
  state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
  try { feedEl.innerHTML = ""; } catch {}
  try { setStatus(feedStatus, ""); } catch {}
}



function showToast(message, opts = {}) {
  const duration = Number(opts.duration ?? 1800);
  if (!message) return;

  // Inject styles once
  if (!document.getElementById("sn-toast-style")) {
    const style = document.createElement("style");
    style.id = "sn-toast-style";
    style.textContent = `
      .sn-toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 99999;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(20,20,20,0.92);
        color: #fff;
        font-size: 14px;
        line-height: 1.25;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        max-width: min(360px, calc(100vw - 36px));
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 160ms ease, transform 160ms ease;
        pointer-events: none;
      }
      .sn-toast.sn-toast--show {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement("div");
  toast.className = "sn-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add("sn-toast--show"));

  // Remove after duration
  window.setTimeout(() => {
    toast.classList.remove("sn-toast--show");
    window.setTimeout(() => toast.remove(), 220);
  }, Math.max(800, duration));
}


function getMyPublicKeyOrNull() {
  const u = identityState?.currentUser;
  return (
    u?.publicKey ||
    u?.publicKeyBase58Check ||
    u?.PublicKeyBase58Check ||
    u?.publicKeyBase58 ||
    null
  );
}

function profilePicUrl(publicKeyBase58Check) {
  return `${NODE_URL}/api/v0/get-single-profile-picture/${publicKeyBase58Check}`;
}

async function apiPost(path, body) {
  const res = await fetch(`${NODE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}


// ---- Stories (FB-like)
// Story = normal post with PostExtraData { Story: "1" } and an image.
// We show stories only from the last 24 hours.
const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

function isStoryPost(p) {
  const x = p?.PostExtraData || p?.PostExtraDataResponse || {};
  const v = x?.Story || x?.story || x?.STORY || null;
  return String(v || "") === "1";
}

function msFromNanos(nanos) {
  const n = Number(nanos);
  if (!Number.isFinite(n)) return null;
  return n / 1e6;
}

function timeAgo(ms) {
  if (!Number.isFinite(ms)) return "";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

let storiesState = { loading: false, items: [] }; // items: { pk, username, img, tsNanos }

function closeStoryModal() {
  if (!storyModalEl) return;
  storyModalEl.classList.add("hidden");
  if (storyModalImgEl) storyModalImgEl.removeAttribute("src");
}

function openStoryModal(item) {
  if (!storyModalEl || !storyModalImgEl) return;
  storyModalEl.classList.remove("hidden");

  const pk = item?.pk || "";
  const u = item?.username || "";
  const title = u ? `@${u}` : (pk ? `@${pk.slice(0, 10)}` : "Story");

  if (storyModalNameEl) storyModalNameEl.textContent = title;
  if (storyModalTimeEl) storyModalTimeEl.textContent = timeAgo(msFromNanos(item?.tsNanos));

  const imgUrl = item?.img || "";
  storyModalImgEl.src = imgUrl;

  // Open links
  if (storyOpenImgEl) {
    storyOpenImgEl.href = imgUrl || "#";
    storyOpenImgEl.style.display = imgUrl ? "inline-flex" : "none";
  }
  if (storyOpenPostEl) {
    const postHash = item?.postHash || "";
    // Open on node.deso.org (safe default)
    storyOpenPostEl.href = postHash ? `https://node.deso.org/posts/${encodeURIComponent(postHash)}` : "#";
    storyOpenPostEl.style.display = postHash ? "inline-flex" : "none";
  }
}

if (storyModalCloseEl) storyModalCloseEl.addEventListener("click", closeStoryModal);
if (storyModalEl) {
  storyModalEl.addEventListener("click", (e) => {
    if (e.target === storyModalEl) closeStoryModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeStoryModal();
});

function renderStoriesBar() {
  if (!storiesBarEl) return;
  storiesBarEl.innerHTML = "";

  if (!state.user) {
    if (storiesStatusEl) setStatus(storiesStatusEl, "Login to see stories.");
    return;
  }

  // Add story
  const add = document.createElement("div");
  add.className = "story-item story-add";
  add.innerHTML = `<div class="story-avatar">+</div><div class="story-label">Add</div>`;
  add.addEventListener("click", () => {
    if (!state.user) return alert("Login first.");
    if (storyInputEl) { storyInputEl.value = ""; storyInputEl.click(); }
  });
  storiesBarEl.appendChild(add);

  // Existing
  for (const it of storiesState.items) {
    const el = document.createElement("div");
    el.className = "story-item";
    const label = it.username ? `@${it.username}` : (it.pk ? `@${it.pk.slice(0, 10)}` : "@user");
    el.innerHTML = `
      <img class="story-avatar" src="${escapeHtml(it.img || profilePicUrl(it.pk))}" alt="" />
      <div class="story-label">${escapeHtml(label)}</div>
    `;
    el.addEventListener("click", () => openStoryModal(it));
    storiesBarEl.appendChild(el);
  }
}

// IMPORTANT FIX: include your own posts (follow feed may not include self on some nodes/apps)
async function fetchStoryCandidates() {
  const now = Date.now();
  const candidates = [];

  // A) Your own posts (profile)
  try {
    const self = await apiPost("/api/v0/get-posts-for-public-key", {
      PublicKeyBase58Check: state.user.publicKey,
      ReaderPublicKeyBase58Check: state.user.publicKey,
      NumToFetch: 50,
      MediaRequired: true,
    });
    const posts = self?.Posts || self?.PostsFound || [];
    for (const p of posts) {
      if (!isStoryPost(p)) continue;
      const ms = msFromNanos(p?.TimestampNanos);
      if (!Number.isFinite(ms)) continue;
      if (now - ms > STORY_LIFETIME_MS) continue;
      candidates.push(p);
    }
  } catch (e) {
    console.warn("stories: self fetch failed", e?.message || e);
  }

  // B) Follow feed (others you follow)
  try {
    const ff = await apiPost("/api/v0/get-posts-stateless", {
      ReaderPublicKeyBase58Check: state.user.publicKey,
      GetPostsForFollowFeed: true,
      NumToFetch: 120,
      MediaRequired: true,
    });
    const posts = ff?.PostsFound || [];
    for (const p of posts) {
      if (!isStoryPost(p)) continue;
      const ms = msFromNanos(p?.TimestampNanos);
      if (!Number.isFinite(ms)) continue;
      if (now - ms > STORY_LIFETIME_MS) continue;
      candidates.push(p);
    }
  } catch (e) {
    console.warn("stories: follow feed fetch failed", e?.message || e);
  }

  return candidates;
}

async function loadStories(force = false) {
  if (!storiesBarEl || !storiesStatusEl) return;
  if (!state.user) {
    storiesState.items = [];
    setStatus(storiesStatusEl, "Login to see stories.");
    renderStoriesBar();
    return;
  }
  if (storiesState.loading) return;

  storiesState.loading = true;
  setStatus(storiesStatusEl, "Loading...");
  try {
    const posts = await fetchStoryCandidates();

    // pick latest story per user
    const map = new Map(); // pk -> post
    for (const p of posts) {
      const pk = p?.PosterPublicKeyBase58Check || "";
      if (!pk) continue;
      const prev = map.get(pk);
      if (!prev || Number(p?.TimestampNanos || 0) > Number(prev?.TimestampNanos || 0)) {
        map.set(pk, p);
      }
    }

    const items = [];
    for (const [pk, p] of map.entries()) {
      const username = await resolveUsernameForPk(pk, "");
      const img = Array.isArray(p?.ImageURLs) ? (p.ImageURLs[0] || "") : "";
      if (!img) continue;
      items.push({ pk, username, img, tsNanos: p?.TimestampNanos || 0, postHash: p?.PostHashHex || "" });
    }

    items.sort((a, b) => Number(b.tsNanos || 0) - Number(a.tsNanos || 0));
    storiesState.items = items.slice(0, 30);

    setStatus(storiesStatusEl, storiesState.items.length ? "" : "No stories in last 24h.");
    renderStoriesBar();
  } catch (e) {
    console.error(e);
    setStatus(storiesStatusEl, `Error: ${e.message}`);
  } finally {
    storiesState.loading = false;
  }
}

async function createStoryFromFile(file) {
  if (!state.user) return alert("Login first.");
  if (!file) return;

  const okType = ["image/png","image/jpeg","image/gif","image/webp"].includes(file.type);
  if (!okType) return alert("Story supports png/jpg/gif/webp.");
  if (file.size > 10 * 1024 * 1024) return alert("Max 10MB.");

  try {
    setStatus(storiesStatusEl, "Uploading story image...");
    const url = await uploadImage(file);

    setStatus(storiesStatusEl, "Posting story...");
    const expiresAt = String(Date.now() + STORY_LIFETIME_MS);

    const resp = await apiPost("/api/v0/submit-post", {
      UpdaterPublicKeyBase58Check: state.user.publicKey,
      BodyObj: { Body: "", ImageURLs: [url], VideoURLs: [] },
      PostExtraData: { Story: "1", StoryExpiresAt: expiresAt },
      MinFeeRateNanosPerKB: FEE_RATE,
    });

    const txHex = resp?.TransactionHex;
    if (!txHex) throw new Error("submit-post(story) missing TransactionHex.");
    await signAndSubmit(txHex);

    showToast("Story posted ✅");
    setStatus(storiesStatusEl, "");
    await loadStories(true);
  } catch (e) {
    console.error(e);
    alert(friendlyDerivedKeyError(e?.message || e));
  }
}

if (storyInputEl) {
  storyInputEl.addEventListener("change", (e) => {
    const f = e.target?.files?.[0];
    createStoryFromFile(f);
  });
}
if (refreshStoriesBtn) {
  refreshStoriesBtn.addEventListener("click", () => loadStories(true));
}



// ---- Social actions (Like / Comment / Repost / Diamonds)
// Like/unlike: POST /api/v0/create-like-stateless -> TransactionHex -> signTx -> submitTx
async function createLikeTxnAndSubmit(postHashHex, isUnlike) {
  const resp = await apiPost("/api/v0/create-like-stateless", {
    ReaderPublicKeyBase58Check: state.user.publicKey,
    LikedPostHashHex: postHashHex,
    IsUnlike: !!isUnlike,
    MinFeeRateNanosPerKB: FEE_RATE,
  });
  const txHex = resp?.TransactionHex;
  if (!txHex) throw new Error("create-like-stateless missing TransactionHex.");
  return signAndSubmit(txHex);
}

// Follow/unfollow: POST /api/v0/create-follow-txn-stateless -> TransactionHex -> signTx -> submitTx
async function createFollowTxnAndSubmit(followedPublicKey, isUnfollow) {
  const resp = await apiPost("/api/v0/create-follow-txn-stateless", {
    FollowerPublicKeyBase58Check: state.user.publicKey,
    FollowedPublicKeyBase58Check: followedPublicKey,
    IsUnfollow: !!isUnfollow,
    MinFeeRateNanosPerKB: FEE_RATE,
  });
  const txHex = resp?.TransactionHex;
  if (!txHex) throw new Error("create-follow-txn-stateless missing TransactionHex.");
  return signAndSubmit(txHex);
}

// Diamonds: POST /api/v0/send-diamonds -> TransactionHex -> signTx -> submitTx
async function sendDiamond(receiverPublicKey, diamondPostHashHex, diamondLevel) {
  const resp = await apiPost("/api/v0/send-diamonds", {
    SenderPublicKeyBase58Check: state.user.publicKey,
    ReceiverPublicKeyBase58Check: receiverPublicKey,
    DiamondPostHashHex: diamondPostHashHex,
    DiamondLevel: Number(diamondLevel),
    MinFeeRateNanosPerKB: FEE_RATE,
  });
  const txHex = resp?.TransactionHex;
  if (!txHex) throw new Error("send-diamonds missing TransactionHex.");
  return signAndSubmit(txHex);
}

// Comment: use submit-post with ParentStakeID set to parent PostHashHex
async function submitComment(parentPostHashHex, commentBody) {
  const submitPostResp = await apiPost("/api/v0/submit-post", {
    UpdaterPublicKeyBase58Check: state.user.publicKey,
    ParentStakeID: parentPostHashHex,
    BodyObj: { Body: commentBody, ImageURLs: [], VideoURLs: [] },
    MinFeeRateNanosPerKB: FEE_RATE,
  });
  const txHex = submitPostResp?.TransactionHex;
  if (!txHex) throw new Error("submit-post(comment) missing TransactionHex.");
  return signAndSubmit(txHex);
}

// Repost: use submit-post with RepostedPostHashHex
async function repost(repostedPostHashHex) {
  const submitPostResp = await apiPost("/api/v0/submit-post", {
    UpdaterPublicKeyBase58Check: state.user.publicKey,
    RepostedPostHashHex: repostedPostHashHex,
    BodyObj: { Body: "", ImageURLs: [], VideoURLs: [] },
    MinFeeRateNanosPerKB: FEE_RATE,
  });
  const txHex = submitPostResp?.TransactionHex;
  if (!txHex) throw new Error("submit-post(repost) missing TransactionHex.");
  return signAndSubmit(txHex);
}
async function fetchUsername(publicKeyBase58Check) {
  try {
    const r = await apiPost("/api/v0/get-single-profile", {
      PublicKeyBase58Check: publicKeyBase58Check,
      NoErrorOnMissing: true,
    });
    return r?.Profile?.Username || r?.ProfileEntryResponse?.Username || "";
  } catch {
    return "";
  }
}

// Cache usernames per public key to avoid repeated /get-single-profile calls
const usernameCache = new Map(); // pk -> username string

async function resolveUsernameForPk(pk, fallback = "") {
  if (!pk) return fallback;
  if (usernameCache.has(pk)) return usernameCache.get(pk) || fallback;
  const u = await fetchUsername(pk);
  usernameCache.set(pk, u || "");
  return u || fallback;
}

function setLoggedInUI(user) {
  state.user = user;
  whoami.textContent = user?.username ? `@${user.username}` : (user?.publicKey ? user.publicKey : "");
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  postBtn.disabled = false;
  composerAvatar.src = profilePicUrl(user.publicKey);
}

function setLoggedOutUI() {
  state.user = null;
  whoami.textContent = "";
  loginBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  postBtn.disabled = true;
  composerAvatar.removeAttribute("src");
  // Notifications
  try {
    if (notifBadgeEl) { notifBadgeEl.textContent = "0"; notifBadgeEl.classList.add("hidden"); }
    if (notificationsListEl) notificationsListEl.innerHTML = "";
    if (notificationsStatusEl) setStatus(notificationsStatusEl, "Login to view notifications.");
    state.notifications = { loading: false, exhausted: false, nextIndex: -1, seen: new Set(), latestIndex: null };
  } catch {}
  try { followingStatusEl && setStatus(followingStatusEl, "Login to see who you follow."); } catch {}
}

async function syncUserFromIdentity() {
  const pk = getMyPublicKeyOrNull();
  if (!pk) return false;
  const username = await fetchUsername(pk);
  setLoggedInUI({ publicKey: pk, username });
  return true;
}

// ---- Login / Logout (use the working approach: identity.login())
async function doLogin() {
  setStatus(feedStatus, "");
  setStatus(postStatus, "");
  try {
    await identity.login();
    // allow subscribe() tick
    await sleep(0);
    const pk = getMyPublicKeyOrNull();
    if (!pk) throw new Error("Login failed (no public key).");
    const username = await fetchUsername(pk);
    setLoggedInUI({ publicKey: pk, username });

    // fresh feed
    state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
    feedEl.innerHTML = "";
    await loadFeedPage();
    await loadFollowingList(true);
    await loadRecentPosts();
    try { await loadStories(true); } catch {}
    await loadTrendingHashtags();
    await loadUnreadNotificationsCount();
    try { profileTarget = null; setRoute('home'); } catch {}
  } catch (e) {
    alert(friendlyDerivedKeyError(e?.message || e));
  }
}

async function doLogout() {
  // deso-protocol handles storage; logout method name can vary by version.
  try { await identity.logout?.(); } catch {}
  try { await identity.logoutAllUsers?.(); } catch {}
  setLoggedOutUI();
  try { profileTarget = null; setRoute('home'); } catch {}
  feedEl.innerHTML = "";
  setStatus(feedStatus, "");
  setStatus(postStatus, "");
  try { followingListEl && (followingListEl.innerHTML = ""); } catch {}
  try { followingStatusEl && setStatus(followingStatusEl, "Login to see who you follow."); } catch {}
}

loginBtn.addEventListener("click", doLogin);
logoutBtn.addEventListener("click", doLogout);

// ---- Feed tabs (Following | Global | Favorite)
if (tabFollowingBtn) {
  tabFollowingBtn.addEventListener("click", async () => {
    if (state.feedMode === "following") return;
    state.feedMode = "following";
    setFeedTabActive();
    resetFeed();
    if (state.user) await loadFeedPage();
  });
}
if (tabGlobalBtn) {
  tabGlobalBtn.addEventListener("click", async () => {
    if (state.feedMode === "global") return;
    state.feedMode = "global";
    setFeedTabActive();
    resetFeed();
    if (state.user) await loadFeedPage();
  });
}
if (tabFavoriteBtn) {
  tabFavoriteBtn.addEventListener("click", async () => {
    if (state.feedMode === "favorite") return;
    state.feedMode = "favorite";
    setFeedTabActive();
    resetFeed();
    if (state.user) await loadFeedPage();
  });
}
if (refreshFeedBtn) {
  refreshFeedBtn.addEventListener("click", async () => {
    setFeedTabActive();
    resetFeed();
    if (state.user) await loadFeedPage();
  });
}


// ---- Following feed
function renderPostCard(p) {

  const card = document.createElement("div");
  card.className = "card";
  card.style.position = "relative";

  // Outer post (used for actions like like/comment/repost/diamond)
  const authorPk = p?.PosterPublicKeyBase58Check || "";
  const postHash = p?.PostHashHex || "";

  // Repost handling: show original post content when available
  const reposted = p?.RepostedPostEntryResponse || p?.RepostedPostEntry || p?.RepostedPost || null;
  const displayPost = reposted || p;
  const displayAuthorPk = displayPost?.PosterPublicKeyBase58Check || authorPk || "";

  const body = displayPost?.Body || "";
  const ts = displayPost?.TimestampNanos ? new Date(Number(displayPost.TimestampNanos) / 1e6).toLocaleString() : "";
  const avatar = displayAuthorPk ? profilePicUrl(displayAuthorPk) : "";

const images = (Array.isArray(displayPost?.ImageURLs) ? displayPost.ImageURLs : [])
    .map(normalizeMediaUrl)
    .filter(u => typeof u === 'string' && u.trim())
    .slice(0, 6);
  const videos = (Array.isArray(displayPost?.VideoURLs) ? displayPost.VideoURLs : [])
    .map(normalizeMediaUrl)
    .filter(u => typeof u === 'string' && u.trim())
    .slice(0, 2);

  // Counts (field names can vary across endpoints)
  const likeCount = Number(p?.LikeCount ?? 0);
  const commentCount = Number(p?.CommentCount ?? 0);
  const repostCount = Number(p?.RepostCount ?? p?.RecloutCount ?? 0);

  // Reader state (best-effort)
  const likedByReader =
    !!(p?.PostEntryReaderState?.LikedByReader ||
       p?.PostEntryReaderState?.LikedByReaderBool ||
       p?.PostEntryReaderState?.LikedByReaderBoolean);

  // Render with placeholder name (pk prefix), then resolve username async and update.
  const nameId = `name_${Math.random().toString(16).slice(2)}`;

// Best-effort username hints from the feed response (avoid extra lookups when possible)
const displayUsernameHint =
  displayPost?.ProfileEntryResponse?.Username ||
  displayPost?.ProfileEntryResponse?.Profile?.Username ||
  "";
const initialName = displayUsernameHint
  ? `@${displayUsernameHint}`
  : (displayAuthorPk ? `@${displayAuthorPk.slice(0, 10)}` : "@user");

// Reposter username (for repost badge)
const reposterUsernameHint =
  p?.ProfileEntryResponse?.Username ||
  p?.ProfileEntryResponse?.Profile?.Username ||
  "";
const repostNameId = reposted ? `repost_${Math.random().toString(16).slice(2)}` : "";
const initialReposterName = reposterUsernameHint
  ? `@${reposterUsernameHint}`
  : (authorPk ? `@${authorPk.slice(0, 10)}` : "@user");

  card.innerHTML = `
    <div class="post-top">
      <img class="avatar" src="${escapeHtml(avatar)}" alt="" />
      <div style="flex:1;">
        <div class="post-header">
          <button class="fav-heart-btn ${state.favorites && state.favorites.has(authorPk) ? "faved" : ""}" title="Favorite" type="button">${state.favorites && state.favorites.has(authorPk) ? "♥" : "♡"}</button>
          ${(state.feedMode === "global" || state.feedMode === "following") ? `<button class="follow-btn ${(((state.feedMode === "following") ? true : (p?.ProfileEntryResponse?.IsFollowedByReader ?? state.followingCache?.has(authorPk))) ? "followed" : "")}" title="${(((state.feedMode === "following") ? true : (p?.ProfileEntryResponse?.IsFollowedByReader ?? state.followingCache?.has(authorPk))) ? "Unfollow" : "Follow")}" type="button" data-followed="${(((state.feedMode === "following") ? true : (p?.ProfileEntryResponse?.IsFollowedByReader ?? state.followingCache?.has(authorPk))) ? "1" : "0")}">${((p?.ProfileEntryResponse?.IsFollowedByReader ?? state.followingCache?.has(authorPk)) ? "👥✓" : "👥+")}</button>` : ``}
          <div>
            <div id="${nameId}" class="name">${escapeHtml(initialName)}</div>
            <div class="muted">${escapeHtml(ts)}</div>
            ${reposted ? `<div class="repost-badge">🔁 Repost by <b id="${repostNameId}">${escapeHtml(initialReposterName)}</b></div>` : ``}
          </div>
        </div>

        <div style="margin-top:8px; font-size:14px; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(body)}</div>

        ${videos && videos.length ? videos.map(u => `<div><video class="post-video" controls playsinline preload="metadata" data-src="${escapeHtml(u)}"></video><div class="video-open-link"><a href="${escapeHtml(u)}" target="_blank" rel="noreferrer">Open video</a></div></div>` ).join("") : ""}

        ${images.length ? `<div class="media-grid">${images.map(u => `<img src="${escapeHtml(u)}" alt="" />`).join("")}</div>` : ""}

        <div class="actionbar">
          <button class="actionbtn iconbtn like-btn ${likedByReader ? "primary" : ""}" type="button" aria-label="Like">
            ${ICONS.like} <span class="pill">(${likeCount})</span>
          </button>
          <button class="actionbtn iconbtn comment-toggle" type="button" aria-label="Comments">
            ${ICONS.comment} <span class="pill">(${commentCount})</span>
          </button>
          <button class="actionbtn iconbtn repost-btn" type="button" aria-label="Repost">
            ${ICONS.repost} <span class="pill">(${repostCount})</span>
          </button>
          <button class="actionbtn iconbtn diamond-btn" data-lvl="1" type="button" aria-label="Diamond">
            ${ICONS.diamond}
          </button>
          <button class="actionbtn iconbtn diamond-btn" data-lvl="2" type="button" aria-label="Diamond x2">
            ${ICONS.diamond} <span class="mult">×2</span>
          </button>
          <button class="actionbtn iconbtn diamond-btn" data-lvl="3" type="button" aria-label="Diamond x3">
            ${ICONS.diamond} <span class="mult">×3</span>
          </button>
        </div>

        <div class="commentbox hidden">
          <div class="comment-list" style="margin-top:6px;"></div>
          <div class="row space" style="margin-top:8px;">
            <span class="muted comment-list-status"></span>
            <button class="btn secondary comment-more hidden" type="button">Load more</button>
          </div>

          <textarea class="textarea comment-text" placeholder="Write a comment..."></textarea>
          <div class="row space">
            <span class="muted comment-status"></span>
            <button class="btn comment-submit" type="button">Submit comment</button>
          </div>
        </div>
      </div>
    </div>
  `;

  

  // Init videos after HTML is in place
  try { initVideos(card); } catch {}
// Resolve usernames asynchronously (avoid showing pk prefixes)
  (async () => {
    try {
      // Original author
      if (!displayUsernameHint && displayAuthorPk) {
        const u = await resolveUsernameForPk(displayAuthorPk, "");
        const el = card.querySelector(`#${nameId}`);
        if (el) el.textContent = u ? `@${u}` : initialName;
      }

      // Reposter (badge)
      if (reposted && repostNameId && !reposterUsernameHint && authorPk) {
        const ru = await resolveUsernameForPk(authorPk, "");
        const rel = card.querySelector(`#${repostNameId}`);
        if (rel) rel.textContent = ru ? `@${ru}` : initialReposterName;
      }
    } catch {}
  })();

  // Attach handlers
  const favBtn = card.querySelector(".fav-heart-btn");
  if (favBtn) {
    favBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const isNowFav = toggleFavoritePublicKey(authorPk);
      favBtn.classList.toggle("faved", isNowFav);
      favBtn.textContent = isNowFav ? "♥" : "♡";
      try { showToast(isNowFav ? "Added to Favorites ✅" : "Removed from Favorites"); } catch {}
    });
  }

    const followBtn = card.querySelector(".follow-btn");
  if (followBtn) {
    followBtn.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!state.user) return alert("Login first.");
      const wasFollowed = followBtn.getAttribute("data-followed") === "1";
      followBtn.disabled = true;
      try {
        await createFollowTxnAndSubmit(authorPk, wasFollowed /* isUnfollow */);
        const nowFollowed = !wasFollowed;
        followBtn.setAttribute("data-followed", nowFollowed ? "1" : "0");
        followBtn.classList.toggle("followed", nowFollowed);
        followBtn.textContent = nowFollowed ? "👥✓" : "👥+";
        followBtn.title = nowFollowed ? "Unfollow" : "Follow";
        if (nowFollowed) state.followingCache.add(authorPk);
        else state.followingCache.delete(authorPk);
        try { showToast(nowFollowed ? "Now following ✅" : "Unfollowed"); } catch {}
      } catch (err) {
        console.error(err);
        alert(friendlyDerivedKeyError(err?.message || err));
      } finally {
        followBtn.disabled = false;
      }
    });
  }

const likeBtn = card.querySelector(".like-btn");
  const commentToggle = card.querySelector(".comment-toggle");
  const commentBox = card.querySelector(".commentbox");
  const commentText = card.querySelector(".comment-text");
  const commentSubmit = card.querySelector(".comment-submit");
  const commentStatus = card.querySelector(".comment-status");
  const commentListEl = card.querySelector(".comment-list");
  const commentListStatus = card.querySelector(".comment-list-status");
  const commentMoreBtn = card.querySelector(".comment-more");

  // Inline comment list state
  let currentCommentCount = commentCount;
  const commentPill = commentToggle?.querySelector?.(".pill");
  let cardCommentOffset = 0;
  let cardCommentExhausted = false;
  let cardCommentLoading = false;

  async function loadCardComments(reset = false) {
    if (!postHash) return;
    if (cardCommentLoading) return;
    if (!reset && cardCommentExhausted) return;

    cardCommentLoading = true;
    if (commentMoreBtn) commentMoreBtn.disabled = true;

    if (reset) {
      _autoReplyExpandBudget = 6;
      cardCommentOffset = 0;
      cardCommentExhausted = false;
      if (commentListEl) commentListEl.innerHTML = "";
    }

    setStatus(commentListStatus, "Loading...");
    try {
      const batch = await fetchCommentsForPost(postHash, cardCommentOffset, COMMENTS_PAGE_SIZE);

      if (Array.isArray(batch) && batch.length) {
        for (const c of batch) {
          if (commentListEl) commentListEl.appendChild(renderCommentItem(c));
        }
        cardCommentOffset += batch.length;
      } else if (reset) {
        if (commentListEl) {
          const empty = document.createElement("div");
          empty.className = "muted";
          empty.textContent = "No comments yet.";
          commentListEl.appendChild(empty);
        }
      }

      if (!batch || batch.length < COMMENTS_PAGE_SIZE) {
        cardCommentExhausted = true;
      }

      setStatus(commentListStatus, "");
    } catch (e) {
      console.error(e);
      setStatus(commentListStatus, `Error: ${e.message}`);
    } finally {
      cardCommentLoading = false;
      if (commentMoreBtn) {
        commentMoreBtn.disabled = false;
        commentMoreBtn.classList.toggle("hidden", cardCommentExhausted);
      }
    }
  }

  if (commentMoreBtn) {
    commentMoreBtn.addEventListener("click", () => loadCardComments(false));
  }

  const repostBtn = card.querySelector(".repost-btn");
  const diamondBtns = card.querySelectorAll(".diamond-btn");

  // Like toggle
  let isLiked = likedByReader;
  let currentLikeCount = likeCount;
  const likePill = likeBtn?.querySelector?.(".pill");

  likeBtn.addEventListener("click", async () => {
    if (!state.user) return alert("Login first.");
    if (!postHash) return;

    likeBtn.disabled = true;
    try {
      // Optimistic UI
      isLiked = !isLiked;
      currentLikeCount += isLiked ? 1 : -1;
      if (currentLikeCount < 0) currentLikeCount = 0;
      likeBtn.classList.toggle("primary", isLiked);
            if (likePill) likePill.textContent = `(${currentLikeCount})`;

      await createLikeTxnAndSubmit(postHash, !isLiked /* IsUnlike */);
    } catch (e) {
      // Rollback optimistic UI on error
      isLiked = !isLiked;
      currentLikeCount += isLiked ? 1 : -1;
      if (currentLikeCount < 0) currentLikeCount = 0;
      likeBtn.classList.toggle("primary", isLiked);
            if (likePill) likePill.textContent = `(${currentLikeCount})`;
      alert(friendlyDerivedKeyError(e.message));
    } finally {
      likeBtn.disabled = false;
    }
  });

  // Comment toggle
  commentToggle.addEventListener("click", () => {
    commentBox.classList.toggle("hidden");
    if (!commentBox.classList.contains("hidden")) {
      commentText.focus();
      // Load first page of existing comments when opening
      loadCardComments(true);
    }
  });

  // Submit comment
  commentSubmit.addEventListener("click", async () => {
    if (!state.user) return alert("Login first.");
    if (!postHash) return;

    const txt = commentText.value.trim();
    if (!txt) return;

    commentSubmit.disabled = true;
    setStatus(commentStatus, "Posting...");
    try {
      await submitComment(postHash, txt);
      setStatus(commentStatus, "Posted ✅");
      commentText.value = "";
      setTimeout(() => setStatus(commentStatus, ""), 1200);

      // Optimistic count update (UI)
      currentCommentCount += 1;
            if (commentPill) commentPill.textContent = `(${currentCommentCount})`;

      // Refresh inline comment list so the new comment appears
      await loadCardComments(true);

      // Also refresh Post view comments if user is on the Post page
      notifyCommentPosted(postHash);
    } catch (e) {
      console.error(e);
      setStatus(commentStatus, `Error: ${e.message}`);
      alert(friendlyDerivedKeyError(e.message));
    } finally {
      commentSubmit.disabled = false;
    }
  });

  // Repost
  repostBtn.addEventListener("click", async () => {
    if (!state.user) return alert("Login first.");
    if (!postHash) return;

    if (!confirm("Repost this post?")) return;

    repostBtn.disabled = true;
    try {
      await repost(postHash);
      alert("Reposted ✅");
    } catch (e) {
      alert(friendlyDerivedKeyError(e.message));
    } finally {
      repostBtn.disabled = false;
    }
  });

  // Diamond (prompt level)
  diamondBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!state.user) return alert("Login first.");
      if (!postHash) return;

      const lvl = Math.max(1, Math.min(5, parseInt(btn.dataset.lvl || "1", 10) || 1));

      btn.disabled = true;
      try {
        await sendDiamond(authorPk, postHash, lvl);
        showToast(`Diamond 💎 sent (level ${lvl}) ✅`);
      } catch (e) {
        alert(friendlyDerivedKeyError(e.message));
      } finally {
        btn.disabled = false;
      }
    });
  });

  return card;
}
async function loadFeedPage() {
  if (!state.user) return;
  if (state.feed.loading || state.feed.exhausted) return;

  // Favorite feed: show only posts from favorited users
  if (state.feedMode === "favorite") {
    return await loadFavoriteFeedPage();
  }

  state.feed.loading = true;
  setStatus(feedStatus, "Loading feed...");

  try {
    const body = {
      ReaderPublicKeyBase58Check: state.user.publicKey,
      NumToFetch: 20,
    };

    if (state.feedMode === "global") {
      // Global: newest posts from anyone (unfiltered)
      body.OrderBy = "newest";
    } else {
      // Following
      body.GetPostsForFollowFeed = true;
    }
    if (state.feed.lastPostHashHex) body.PostHashHex = state.feed.lastPostHashHex;

    const data = await apiPost("/api/v0/get-posts-stateless", body);
    let posts = data?.PostsFound || [];

    // Optional hashtag filter (client-side)
    if (activeHashtag) {
      const needle = activeHashtag.toLowerCase();
      posts = posts.filter(p => String(p?.Body || "").toLowerCase().includes(needle));
    }

    if (!posts.length) {
      state.feed.exhausted = true;
      setStatus(feedStatus, "No more posts.");
      return;
    }

    for (const p of posts) {
      const h = p?.PostHashHex || JSON.stringify(p).slice(0, 40);
      if (state.feed.seen.has(h)) continue;
      state.feed.seen.add(h);
      feedEl.appendChild(renderPostCard(p));
    }

    const last = posts[posts.length - 1];
    state.feed.lastPostHashHex = last?.PostHashHex || null;
    setStatus(feedStatus, "");
  } catch (e) {
    console.error(e);
    setStatus(feedStatus, `Feed error: ${e.message}`);
  } finally {
    state.feed.loading = false;
  }
}

async function loadFavoriteFeedPage() {
  if (!state.user) return;
  if (state.feed.loading || state.feed.exhausted) return;

  if (!state.feed.favCursors) state.feed.favCursors = {};
  if (!state.feed.favDone) state.feed.favDone = {};

  const favs = Array.from(state.favorites || []);
  if (!favs.length) {
    setStatus(feedStatus, "");
    feedEl.innerHTML = `<div class="card"><b>No favorites yet.</b><div class="muted" style="margin-top:6px;">Go to Following or Global feed and tap the green heart on a user to add them.</div></div>`;
    state.feed.exhausted = true;
    return;
  }

  state.feed.loading = true;
  setStatus(feedStatus, "Loading favorites...");

  try {
    const perUser = 8;
    const allPosts = [];

    const tasks = favs.slice(0, 25).map(async (pk) => {
      if (state.feed.favDone[pk]) return [];
      const body = {
        PublicKeyBase58Check: pk,
        ReaderPublicKeyBase58Check: state.user.publicKey,
        // +1 when we have a cursor because some nodes include the cursor post again
        NumToFetch: perUser + (state.feed.favCursors[pk] ? 1 : 0),
      };
      const cursor = state.feed.favCursors[pk];
      if (cursor) {
        // Some nodes use PostHashHex, others use LastPostHashHex; set both for compatibility.
        body.PostHashHex = cursor;
        body.LastPostHashHex = cursor;
      }

      const r = await fetch(`${NODE_URL}/api/v0/get-posts-for-public-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      const posts = (j?.Posts || []).filter(Boolean);

      // If the first post equals our cursor, drop it to avoid being stuck on the same page.
      if (cursor && posts.length && posts[0]?.PostHashHex === cursor) {
        posts.shift();
      }

      if (!posts.length) {
        state.feed.favDone[pk] = true;
        return [];
      }

      const last = posts[posts.length - 1];
      const lastHash = last?.PostHashHex;
      if (lastHash) state.feed.favCursors[pk] = lastHash;

      return posts;
    });

    const results = await Promise.all(tasks);
    for (const arr of results) allPosts.push(...arr);

    const fresh = [];
    for (const p of allPosts) {
      const h = p?.PostHashHex || JSON.stringify(p).slice(0, 40);
      if (state.feed.seen.has(h)) continue;
      state.feed.seen.add(h);
      fresh.push(p);
    }

    fresh.sort((a, b) => Number(b?.TimestampNanos || 0) - Number(a?.TimestampNanos || 0));

    if (!fresh.length) {
      const allDone = favs.every(pk => state.feed.favDone[pk]);
      if (allDone) state.feed.exhausted = true;
      setStatus(feedStatus, allDone ? "" : "No new posts yet.");
      return;
    }

    setStatus(feedStatus, "");
    for (const p of fresh) {
      feedEl.appendChild(renderPostCard(p));
    }
  } catch (e) {
    console.error(e);
    setStatus(feedStatus, `Favorite feed error: ${e.message}`);
  } finally {
    state.feed.loading = false;
  }
}

window.addEventListener("scroll", () => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
  if (nearBottom) loadFeedPage();
});

// ---- Images (max 5)
function updatePhotoCount() {
  photoCountEl.textContent = `${state.images.length}/5`;
}

function renderThumbs() {
  thumbsEl.innerHTML = "";
  if (!state.images.length) return;

  for (const img of state.images) {
    const div = document.createElement("div");
    div.className = "thumb";
    div.innerHTML = `
      <img src="${escapeHtml(img.url)}" alt="" />
      <button type="button" title="Remove">×</button>
    `;
    div.querySelector("button").addEventListener("click", () => {
      try { URL.revokeObjectURL(img.url); } catch {}
      state.images = state.images.filter(x => x !== img);
      updatePhotoCount();
      renderThumbs();
    });
    thumbsEl.appendChild(div);
  }
}

function addImagesFromFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  for (const f of files) {
    if (state.images.length >= 5) break;

    const okType = ["image/png","image/jpeg","image/gif","image/webp"].includes(f.type);
    if (!okType) continue;
    if (f.size > 10 * 1024 * 1024) continue; // 10MB cap

    state.images.push({ file: f, url: URL.createObjectURL(f), name: f.name, size: f.size });
  }
  updatePhotoCount();
  renderThumbs();
}

addPhotosBtn.addEventListener("click", () => { imageInput.value = ""; imageInput.click(); });
imageInput.addEventListener("change", (e) => addImagesFromFiles(e.target.files));


function updateComposerSubmitState(){
  const txt = (document.getElementById("postText")?.value || "").trim();
  const hasMedia = (state.images && state.images.length) || !!state.video;
  postBtn.disabled = !state.user || (!txt && !hasMedia);
}
document.getElementById("postText")?.addEventListener("input", updateComposerSubmitState);

function clearVideo(){
  try { if(state.video?.url) URL.revokeObjectURL(state.video.url); } catch {}
  state.video = null;
  if(videoInput) videoInput.value = "";
  renderVideoChip();
  updateComposerSubmitState();
}

function renderVideoChip(){
  if(!videoChip) return;
  if(!state.video){
    videoChip.classList.add("hidden");
    if(videoProgressEl) videoProgressEl.classList.add("hidden");
    return;
  }
  videoChip.classList.remove("hidden");
  if(videoNameEl) videoNameEl.textContent = `${state.video.name}`;
}

function setVideoFromFile(file){
  clearVideo(); // revoke old
  if(!file) return;

  // soft guard: user-friendly limit warning (ne blokira)
  if(file.size > 1024 * 1024 * 1024){
    alert("Video je jako velik (1GB+). Upload može potrajati, pogotovo na mobitelu.");
  }

  state.video = { file, url: URL.createObjectURL(file), name: file.name, size: file.size };
  renderVideoChip();
  updateComposerSubmitState();
}

addVideoBtn?.addEventListener("click", () => {
  if(!videoInput) return;
  videoInput.value = "";
  videoInput.click();
});
videoInput?.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if(f) setVideoFromFile(f);
});
removeVideoBtn?.addEventListener("click", clearVideo);



// ---- Upload + submit post
async function getJwtForUpload() {
  // This is the exact strategy used in your working app: identity.jwt() first.
  try {
    if (identity && typeof identity.jwt === "function") {
      const r = await identity.jwt();
      if (typeof r === "string") return r;
      return r?.jwt || r?.JWT || r?.derivedJwt || r?.DerivedJwt || null;
    }
  } catch {}
  return null;
}

async function uploadImage(file) {
  const jwt = await getJwtForUpload();
  if (!jwt) throw new Error("Couldn't get JWT for image upload. Try Logout + Login again.");
  const fd = new FormData();
  fd.append("UserPublicKeyBase58Check", state.user.publicKey);
  fd.append("JWT", jwt);
  fd.append("file", file, file?.name || "image.png");

  const res = await fetch(`${NODE_URL}/api/v0/upload-image`, { method: "POST", body: fd });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error || `UploadImage HTTP ${res.status}`);
  if (!j?.ImageURL) throw new Error("UploadImage did not return ImageURL.");
  return j.ImageURL;
}

async function signAndSubmit(transactionHex) {
  // Same as your working app: signTx + submitTx
  const signedHex = await identity.signTx(transactionHex);
  if (!signedHex) throw new Error("Signing did not return signedTransactionHex.");
  return identity.submitTx(signedHex);
}

function prependPostEntry(postEntry) {
  // postEntry from submitTx can vary; if we have it, render it
  if (!postEntry) return;
  const card = renderPostCard(postEntry);
  feedEl.prepend(card);
}

async function submitPostWithImages() {
  if (!state.user) return alert("Login first.");

  const bodyText = document.getElementById("postText").value.trim();
  const groupId = (postGroupSelectEl?.value || "").trim();
if (!bodyText && !state.images.length && !state.video) return alert("Upiši tekst ili dodaj sliku/video.");

addVideoBtn.disabled = true;


  postBtn.disabled = true;
  addPhotosBtn.disabled = true;
  setStatus(postStatus, "Preparing...");

  try {
    // 1) Upload images sequentially
    const imageUrls = [];
    for (let i = 0; i < state.images.length; i++) {
      setStatus(postStatus, `Uploading image ${i + 1}/${state.images.length}...`);
      const url = await uploadImage(state.images[i].file);
      imageUrls.push(url);
    }
let videoUrls = [];
if(state.video?.file){
  if(videoProgressEl){
    videoProgressEl.classList.remove("hidden");
    videoProgressEl.textContent = "Uploading video: 0%";
  }

  const v = await uploadVideo(state.video.file, (up, total) => {
    const pct = total ? Math.round((up/total)*100) : 0;
    if(videoProgressEl) videoProgressEl.textContent = `Uploading video: ${pct}%`;
  });

  videoUrls = [v.url];

  if(videoProgressEl) videoProgressEl.textContent = "Video uploaded ✅ (processing/stream ready soon)";
}


async function createTusUploadEndpoint(file){
  const headers = {
    "Upload-Length": String(file.size),
    "Upload-Metadata": JSON.stringify({ filename: file.name, filetype: file.type })
  };

  // optional: pošalji JWT ako postoji (ne smeta ako backend ignorira)
  try {
    const jwt = await getJwtForUpload();
    if(jwt) headers["Authorization"] = `Bearer ${jwt}`;
  } catch {}

  const res = await fetch(`${NODE_URL}/api/v0/upload-video`, { method: "POST", headers });
  if(!res.ok){
    const t = await res.text().catch(()=> "");
    throw new Error(t || `UploadVideo HTTP ${res.status}`);
  }
  const loc = res.headers.get("Location") || res.headers.get("location");
  if(!loc) throw new Error("UploadVideo missing Location header.");
  return loc;
}

async function pollVideoReady(videoId, { timeoutMs = 90000, intervalMs = 3000 } = {}){
  const start = Date.now();
  while(Date.now() - start < timeoutMs){
    try{
      const r = await fetch(`${NODE_URL}/api/v0/get-video-status/${encodeURIComponent(videoId)}`);
      const j = await r.json().catch(()=> ({}));
      if(r.ok && j?.ReadyToStream === true) return true;
    }catch{}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

async function uploadVideo(file, onProgress){
  const tusObj = window.tus;
  if(!tusObj || !tusObj.Upload) throw new Error("tus-js-client nije učitan (provjeri script tag u index.html).");

  const endpoint = await createTusUploadEndpoint(file);
  let streamId = null;

  await new Promise((resolve, reject) => {
    const up = new tusObj.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000],
      chunkSize: 5 * 1024 * 1024,
      metadata: { filename: file.name, filetype: file.type },

      onAfterResponse: function(req, res){
        try{
          const id =
            res.getHeader("stream-media-id") ||
            res.getHeader("Stream-Media-Id");
          if(id) streamId = id;
        }catch{}
      },

      onProgress: function(bytesUploaded, bytesTotal){
        if(typeof onProgress === "function") onProgress(bytesUploaded, bytesTotal);
      },
      onError: reject,
      onSuccess: resolve,
    });

    up.start();
  });

  if(!streamId) throw new Error("Upload je završio, ali nedostaje stream-media-id header.");

  // čekaj da bude spreman za stream (ne blokira vječno)
  await pollVideoReady(streamId);

  // HLS URL (radi s tvojim postojećim hls.js + attachVideo)
  const hlsUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
  return { videoId: streamId, url: hlsUrl };
}

    // 2) Construct transaction
    setStatus(postStatus, "Constructing post transaction...");
    const submitPayload = {
      UpdaterPublicKeyBase58Check: state.user.publicKey,
BodyObj: { Body: bodyText, ImageURLs: imageUrls, VideoURLs: videoUrls },

      MinFeeRateNanosPerKB: FEE_RATE,
    };
    if (groupId) {
      submitPayload.PostExtraData = { GroupId: groupId };
    }

    const submitPostResp = await apiPost("/api/v0/submit-post", submitPayload);

    const txHex = submitPostResp?.TransactionHex;
    if (!txHex) throw new Error("submit-post missing TransactionHex.");

    // 3) Sign + submit via SDK
    setStatus(postStatus, "Signing & broadcasting...");
    const submitTxnResp = await signAndSubmit(txHex);

    setStatus(postStatus, "Posted ✅");


    // Optional: share to Facebook via existing /mycrossposter app
    const wantsFbShare = !!(fbShareToggle && fbShareToggle.checked);
    if (wantsFbShare) {
      try {
        setStatus(postStatus, "Preparing Facebook share...");

        const createdEntry = submitTxnResp?.PostEntryResponse || submitPostResp?.PostEntryResponse || null;
        const createdHash = createdEntry?.PostHashHex || null;

        const postHashHex =
          createdHash || (await resolvePostHashByLookingUpLatest({ body: bodyText, imageURLs: imageUrls }));

        if (postHashHex) {
          const shareUrl = buildCrossposterShareUrl(postHashHex);
          await copyToClipboard(`${FB_SHARE_TEXT} ${shareUrl}`);
          openFacebookShare(shareUrl);
          setStatus(postStatus, "Posted ✅ (Facebook share opened)");
        } else {
          // Still posted, just couldn't resolve hash fast enough
          setStatus(postStatus, "Posted ✅ (Facebook share: couldn't resolve post hash)");
        }
      } catch (e) {
        console.error(e);
        // Don't fail the DeSo post if FB share fails
        setStatus(postStatus, `Posted ✅ (Facebook share failed: ${e.message})`);
      }
    }

    // reset composer
    document.getElementById("postText").value = "";
    if (fbShareToggle) fbShareToggle.checked = false;
    for (const img of state.images) { try { URL.revokeObjectURL(img.url); } catch {} }
    state.images = [];
    updatePhotoCount();
    renderThumbs();

    // optimistic render
    const created = submitTxnResp?.PostEntryResponse || submitPostResp?.PostEntryResponse;
    if (created) {
      prependPostEntry(created);
    } else {
      state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
      feedEl.innerHTML = "";
      await loadFeedPage();
    await loadFollowingList(true);
    try { profileTarget = null; setRoute('home'); } catch {}
    }

    setTimeout(() => setStatus(postStatus, ""), 1500);
  } catch (e) {
    console.error(e);
    setStatus(postStatus, `Error: ${e.message}`);
    alert(friendlyDerivedKeyError(e.message));
  } finally {
    postBtn.disabled = false;
    addPhotosBtn.disabled = false;
addVideoBtn.disabled = false;
updateComposerSubmitState();

  }
}

postBtn.addEventListener("click", submitPostWithImages);

// ---- boot

// ---- Groups (Option A: no server)
const LS_GROUPS_KEY = "desobook.groups.v1";
const LS_JOINED_GROUPS_KEY = "desobook.joinedGroups.v1";
const LS_GROUP_PINS_KEY = "desobook.groupPins.v1"; // { [groupId]: postHashHex }


function loadGroupsFromStorage() {
  try {
    const raw = localStorage.getItem(LS_GROUPS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveGroupsToStorage(groups) {
  try { localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(groups || [])); } catch {}
}
function loadJoinedGroupsFromStorage() {
  try {
    const raw = localStorage.getItem(LS_JOINED_GROUPS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}
function loadGroupPinsFromStorage() {
  try {
    const raw = localStorage.getItem(LS_GROUP_PINS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch { return {}; }
}
function saveGroupPinsToStorage(obj) {
  try { localStorage.setItem(LS_GROUP_PINS_KEY, JSON.stringify(obj || {})); } catch {}
}
function setPinnedPost(groupId, postHash) {
  const pins = loadGroupPinsFromStorage();
  if (!postHash) delete pins[groupId];
  else pins[groupId] = postHash;
  saveGroupPinsToStorage(pins);
}
function getPinnedPost(groupId) {
  const pins = loadGroupPinsFromStorage();
  return pins[groupId] || "";
}

function saveJoinedGroupsToStorage(set) {
  try { localStorage.setItem(LS_JOINED_GROUPS_KEY, JSON.stringify(Array.from(set || []))); } catch {}
}

function normalizePostHashOrUrl(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  // extract last path segment if a URL
  try {
    const u = new URL(v);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last;
  } catch {
    return v;
  }
}

function buildGroupShareLink(g) {
  // Share link uses URL hash so it works on static hosting
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set("group", g.id);
  if (g.name) params.set("name", g.name);
  if (g.desc) params.set("desc", g.desc);
  if (g.manifestPostHash) params.set("manifest", g.manifestPostHash);
  return base + "#"+ params.toString();
}

function tryImportGroupFromUrlHash() {
  try {
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    const id = (params.get("group") || "").trim();
    if (!id) return false;

    const name = (params.get("name") || id).trim();
    const desc = (params.get("desc") || "").trim();
    const manifest = (params.get("manifest") || "").trim();

    initGroupsState();
    upsertGroup({ id, name, desc, ownerPk: "", manifestPostHash: manifest, createdAt: Date.now() });
    // optionally auto-join
    joinGroup(id);
    // clear hash to avoid re-import on refresh
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return true;
  } catch { return false; }
}

function genGroupId() {
  // short id for PostExtraData filtering
  return "g_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36).slice(-4);
}

function initGroupsState() {
  state.groups = loadGroupsFromStorage();
  state.joinedGroups = loadJoinedGroupsFromStorage();
}

function getGroupById(id) {
  return (state.groups || []).find(g => g.id === id) || null;
}

function upsertGroup(g) {
  const groups = state.groups || [];
  const idx = groups.findIndex(x => x.id === g.id);
  if (idx >= 0) groups[idx] = { ...groups[idx], ...g };
  else groups.unshift(g);
  state.groups = groups;
  saveGroupsToStorage(groups);
}

function isJoinedGroup(id) {
  return state.joinedGroups && state.joinedGroups.has(id);
}

function joinGroup(id) {
  if (!state.joinedGroups) state.joinedGroups = new Set();
  state.joinedGroups.add(id);
  saveJoinedGroupsToStorage(state.joinedGroups);
  populatePostGroupSelect();
}

function leaveGroup(id) {
  if (!state.joinedGroups) state.joinedGroups = new Set();
  state.joinedGroups.delete(id);
  saveJoinedGroupsToStorage(state.joinedGroups);
  populatePostGroupSelect();
}

function populatePostGroupSelect() {
  if (!postGroupSelectEl) return;
  const current = postGroupSelectEl.value || "";
  postGroupSelectEl.innerHTML = '<option value="">Public</option>';

  const joined = Array.from(state.joinedGroups || []);
  for (const id of joined) {
    const g = getGroupById(id);
    const name = g?.name ? g.name : id;
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = name;
    postGroupSelectEl.appendChild(opt);
  }

  // preserve selection if possible
  const exists = Array.from(postGroupSelectEl.options).some(o => o.value === current);
  postGroupSelectEl.value = exists ? current : "";
}

let groupTarget = { id: null };

function renderGroupRow(g) {
  const el = document.createElement("div");
  el.className = "card";
  const joined = isJoinedGroup(g.id);

  el.innerHTML = `
    <div class="row space" style="align-items:center;">
      <div style="min-width:0;">
        <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(g.name || g.id)}</div>
        <div class="muted" style="margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(g.desc || "")}</div>
        <div class="muted" style="margin-top:4px; font-size:12px;">GroupId: ${escapeHtml(g.id)}</div>
      </div>
      <div class="row" style="gap:10px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="btn secondary open-group" type="button">Open</button>
        <button class="btn secondary share-group" type="button">Share</button>
        <button class="btn secondary joinleave" type="button">${joined ? "Leave" : "Join"}</button>
      </div>
    </div>
  `;

  el.querySelector(".open-group").addEventListener("click", () => {
    groupTarget.id = g.id;
    setRoute("group");
  });

  el.querySelector(".share-group").addEventListener("click", async () => {
    const link = buildGroupShareLink(g);
    try { await navigator.clipboard.writeText(link); showToast("Share link copied ✅"); }
    catch { alert(link); }
  });

  el.querySelector(".joinleave").addEventListener("click", () => {
    if (isJoinedGroup(g.id)) leaveGroup(g.id);
    else joinGroup(g.id);
    loadGroupsView().catch(console.error);
  });

  return el;
}

async function loadGroupsView() {
  if (!groupsListEl || !myGroupsCountEl) return;

  initGroupsState();
  populatePostGroupSelect();

  groupsListEl.innerHTML = "";
  myGroupsCountEl.textContent = `(${(state.groups || []).length})`;

  for (const g of (state.groups || [])) {
    groupsListEl.appendChild(renderGroupRow(g));
  }

  if (!state.groups.length) {
    const hint = document.createElement("div");
    hint.className = "muted";
    hint.textContent = "No groups yet. Create one or import a manifest post hash.";
    groupsListEl.appendChild(hint);
  }
}

async function createGroup() {
  if (!state.user) return alert("Login first.");
  const name = (groupNameInputEl?.value || "").trim();
  const desc = (groupDescInputEl?.value || "").trim();
  if (!name) return alert("Group name is required.");

  const id = genGroupId();
  if (groupsStatusEl) setStatus(groupsStatusEl, "Creating group...");

  try {
    // Create on-chain manifest post
    const now = Date.now();
    const body = `📌 Group: ${name}\n${desc ? desc + "\n" : ""}GroupId: ${id}`;

    const resp = await apiPost("/api/v0/submit-post", {
      UpdaterPublicKeyBase58Check: state.user.publicKey,
      BodyObj: { Body: body, ImageURLs: [], VideoURLs: [] },
      PostExtraData: {
        GroupManifest: "1",
        GroupId: id,
        GroupName: name,
        GroupDesc: desc,
        GroupOwnerPk: state.user.publicKey,
        GroupCreatedAt: String(now),
      },
      MinFeeRateNanosPerKB: FEE_RATE,
    });

    const txHex = resp?.TransactionHex;
    if (!txHex) throw new Error("submit-post missing TransactionHex.");
    const submit = await signAndSubmit(txHex);

    upsertGroup({ id, name, desc, ownerPk: state.user.publicKey, manifestPostHash: "", createdAt: now });
    joinGroup(id);

    if (groupsStatusEl) setStatus(groupsStatusEl, "Group created ✅");
    groupNameInputEl.value = "";
    groupDescInputEl.value = "";

    await loadGroupsView();
  } catch (e) {
    console.error(e);
    alert(friendlyDerivedKeyError(e?.message || e));
    if (groupsStatusEl) setStatus(groupsStatusEl, "");
  }
}

async function importGroup() {
  const raw = (importGroupInputEl?.value || "").trim();
  if (!raw) return alert("Paste a post hash or URL.");
  const postHash = normalizePostHashOrUrl(raw);
  if (!postHash) return alert("Invalid input.");

  if (groupsStatusEl) setStatus(groupsStatusEl, "Importing...");

  try {
    const data = await apiPost("/api/v0/get-single-post", {
      PostHashHex: postHash,
      ReaderPublicKeyBase58Check: state.user?.publicKey || "",
      FetchParents: false,
      CommentLimit: 0,
      CommentOffset: 0,
    });
    const post = data?.PostFound || data?.Post || data?.PostEntryResponse || null;
    if (!post) throw new Error("Post not found.");

    const extra = post?.PostExtraData || post?.PostExtraDataResponse || {};
    if (String(extra?.GroupManifest || "") !== "1") {
      throw new Error("This post is not a group manifest.");
    }
    const id = String(extra?.GroupId || "").trim();
    const name = String(extra?.GroupName || "").trim();
    const desc = String(extra?.GroupDesc || "").trim();
    const ownerPk = String(extra?.GroupOwnerPk || post?.PosterPublicKeyBase58Check || "").trim();
    const createdAt = Number(extra?.GroupCreatedAt || Date.now());

    if (!id) throw new Error("Missing GroupId in manifest.");

    upsertGroup({ id, name: name || id, desc, ownerPk, manifestPostHash: postHash, createdAt });
    if (groupsStatusEl) setStatus(groupsStatusEl, "Imported ✅");
    importGroupInputEl.value = "";

    await loadGroupsView();
  } catch (e) {
    console.error(e);
    alert(e?.message || e);
    if (groupsStatusEl) setStatus(groupsStatusEl, "");
  }
}

let groupFeedCursor = { lastPostHashHex: null, exhausted: false };

function postMatchesGroup(p, groupId) {
  const extra = p?.PostExtraData || p?.PostExtraDataResponse || {};
  if (String(extra?.GroupId || "") === groupId) return true;
  // fallback: allow hashtag style #g_<id>
  const body = String(p?.Body || "");
  return body.includes(groupId) || body.toLowerCase().includes(("#" + groupId).toLowerCase());
}

function wrapGroupPostCard(p, groupId) {
  const container = document.createElement("div");
  container.style.position = "relative";

  const card = renderPostCard(p);
  container.appendChild(card);

  // pin/unpin button
  const btn = document.createElement("button");
  btn.className = "pin-btn";
  const pinned = getPinnedPost(groupId) === (p?.PostHashHex || "");
  btn.textContent = pinned ? "Unpin" : "Pin";
  btn.style.position = "absolute";
  btn.style.top = "10px";
  btn.style.left = "12px";
  btn.style.zIndex = "30";

  btn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const h = p?.PostHashHex || "";
    if (!h) return;
    const nowPinned = getPinnedPost(groupId) === h;
    setPinnedPost(groupId, nowPinned ? "" : h);
    loadGroupView(true).catch(console.error);
  });

  container.appendChild(btn);
  return container;
}

async function loadGroupView(reset = false) {
  if (!groupFeedEl || !groupFeedStatusEl) return;
  const id = groupTarget?.id;
  if (!id) {
    setStatus(groupFeedStatusEl, "No group selected.");
    return;
  }

  initGroupsState();
  populatePostGroupSelect();

  const g = getGroupById(id);
  groupTitleEl.textContent = g?.name || id;
  groupSubtitleEl.textContent = g?.desc || "";
  groupIdLineEl.textContent = `GroupId: ${id}`;

  const joined = isJoinedGroup(id);
  groupJoinBtn.classList.toggle("hidden", joined);
  groupLeaveBtn.classList.toggle("hidden", !joined);

  if (reset) {
    groupFeedEl.innerHTML = "";
    groupFeedCursor = { lastPostHashHex: null, exhausted: false };
  }

  // Render pinned post (local)
  try {
    const pinnedHash = getPinnedPost(id);
    if (groupPinnedEl) {
      groupPinnedEl.innerHTML = "";
      if (pinnedHash) {
        groupPinnedEl.classList.remove("hidden");
        const wrap = document.createElement("div");
        wrap.className = "pinned-card";
        wrap.innerHTML = `<div class="pinned-title"><b>📌 Pinned post</b><button class="pin-btn" type="button" id="unpinBtn">Unpin</button></div>`;
        const inner = document.createElement("div");
        inner.style.marginTop = "10px";
        // We'll fetch pinned post on demand
        wrap.appendChild(inner);
        groupPinnedEl.appendChild(wrap);
        wrap.querySelector('#unpinBtn').addEventListener('click', () => { setPinnedPost(id, ""); loadGroupView(true).catch(console.error); });
        // fetch post
        apiPost('/api/v0/get-single-post', { PostHashHex: pinnedHash, ReaderPublicKeyBase58Check: state.user?.publicKey || "", FetchParents:false, CommentLimit:0, CommentOffset:0 })
          .then(d => {
            const post = d?.PostFound || d?.Post || d?.PostEntryResponse || null;
            if (post) inner.appendChild(renderPostCard(post));
            else inner.innerHTML = '<div class="muted">Pinned post not found.</div>';
          })
          .catch(() => { inner.innerHTML = '<div class="muted">Pinned post failed to load.</div>'; });
      } else {
        groupPinnedEl.classList.add("hidden");
      }
    }
  } catch {}

  
  // Include your own group posts (follow feed may not include self)
  try {
    if (reset && state.user?.publicKey) {
      const self = await apiPost("/api/v0/get-posts-for-public-key", {
        PublicKeyBase58Check: state.user.publicKey,
        ReaderPublicKeyBase58Check: state.user.publicKey,
        NumToFetch: 50,
      });
      const selfPosts = self?.Posts || self?.PostsFound || [];
      let added = 0;
      for (const p of selfPosts) {
        if (postMatchesGroup(p, id)) {
          groupFeedEl.appendChild(wrapGroupPostCard(p, id));
          added++;
          if (added >= 10) break;
        }
      }
    }
  } catch {}

  setStatus(groupFeedStatusEl, "Loading...");
  try {
    let collected = 0;
    let scannedPages = 0;

    while (collected < 10 && !groupFeedCursor.exhausted && scannedPages < 8) {
      scannedPages++;

      const body = {
        ReaderPublicKeyBase58Check: state.user?.publicKey || "",
        GetPostsForFollowFeed: true,
        NumToFetch: 25,
      };
      if (groupFeedCursor.lastPostHashHex) body.PostHashHex = groupFeedCursor.lastPostHashHex;

      const data = await apiPost("/api/v0/get-posts-stateless", body);
      const posts = data?.PostsFound || [];
      if (!posts.length) {
        groupFeedCursor.exhausted = true;
        break;
      }
      groupFeedCursor.lastPostHashHex = posts[posts.length - 1]?.PostHashHex || null;

      for (const p of posts) {
        if (postMatchesGroup(p, id)) {
          groupFeedEl.appendChild(wrapGroupPostCard(p, id));
          collected++;
        }
      }
    }

    if (!groupFeedEl.children.length) {
      setStatus(groupFeedStatusEl, "No posts found for this group (in your follow feed).");
    } else {
      setStatus(groupFeedStatusEl, "");
    }
    groupLoadMoreBtn.classList.toggle("hidden", groupFeedCursor.exhausted);
  } catch (e) {
    console.error(e);
    setStatus(groupFeedStatusEl, `Error: ${e.message}`);
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  updatePhotoCount();
  renderThumbs();

  // default route
  try { profileTarget = null; setRoute('home'); } catch {}


  // If SDK already has a session, show it.
  // If not, user can click Login.
  await sleep(0);
  const hasUser = await syncUserFromIdentity();
  if (hasUser) {
    state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
    feedEl.innerHTML = "";
    await loadFeedPage();
    await loadFollowingList(true);
    await loadRecentPosts();
    await loadTrendingHashtags();
    await loadUnreadNotificationsCount();
    try { profileTarget = null; setRoute('home'); } catch {}
  } else {
    setLoggedOutUI();
  try { profileTarget = null; setRoute('home'); } catch {}
  }


  // Groups wiring
  try { initGroupsState(); populatePostGroupSelect(); } catch {}
  try { if (groupsRefreshBtn) groupsRefreshBtn.addEventListener("click", () => loadGroupsView().catch(console.error)); } catch {}
  try { if (createGroupBtn) createGroupBtn.addEventListener("click", () => createGroup().catch(console.error)); } catch {}
  try { if (importGroupBtn) importGroupBtn.addEventListener("click", () => importGroup().catch(console.error)); } catch {}
  try { if (groupShareBtn) groupShareBtn.addEventListener("click", async () => {
    const id = groupTarget?.id || "";
    if (!id) return;
    const g = getGroupById(id) || { id };
    const link = buildGroupShareLink(g);
    try { await navigator.clipboard.writeText(link); showToast("Share link copied ✅"); }
    catch { alert(link); }
  }); } catch {}

try { if (groupCopyIdBtn) groupCopyIdBtn.addEventListener("click", async () => { const id = groupTarget?.id || ""; if (!id) return; try { await navigator.clipboard.writeText(id); showToast("Copied ✅"); } catch { alert(id); } }); } catch {}
  try { if (groupJoinBtn) groupJoinBtn.addEventListener("click", () => { const id = groupTarget?.id; if (!id) return; joinGroup(id); loadGroupView(true).catch(console.error); }); } catch {}
  try { if (groupLeaveBtn) groupLeaveBtn.addEventListener("click", () => { const id = groupTarget?.id; if (!id) return; leaveGroup(id); loadGroupView(true).catch(console.error); }); } catch {}
  try { if (groupRefreshBtn) groupRefreshBtn.addEventListener("click", () => loadGroupView(true).catch(console.error)); } catch {}
  try { if (groupLoadMoreBtn) groupLoadMoreBtn.addEventListener("click", () => loadGroupView(false).catch(console.error)); } catch {}
});



// ---- Following list (right sidebar)
// Uses: /api/v0/get-follows-stateless with GetEntriesFollowingUsername=true (current user's following)
const followingListEl = document.getElementById("followingList");
const followingStatusEl = document.getElementById("followingStatus");
const refreshFollowingBtn = document.getElementById("refreshFollowingBtn");
const followingSearchEl = document.getElementById("followingSearch");
const recentListEl = document.getElementById("recentList");
const recentStatusEl = document.getElementById("recentStatus");
const refreshRecentBtn = document.getElementById("refreshRecentBtn");
const tagsListEl = document.getElementById("tagsList");
const tagsStatusEl = document.getElementById("tagsStatus");
const refreshTagsBtn = document.getElementById("refreshTagsBtn");
const activeFilterEl = document.getElementById("activeFilter");
const filterLabelEl = document.getElementById("filterLabel");
const clearFilterBtn = document.getElementById("clearFilterBtn");

let followingState = { loading: false, lastPublicKey: null };

function shortPk(pk) { return pk ? (pk.slice(0, 8) + "…" + pk.slice(-4)) : ""; }

function renderFollowingItem(entry) {
  const pk =
    entry?.PublicKeyBase58Check ||
    entry?.FollowedPublicKeyBase58Check ||
    entry?.ProfileEntryResponse?.PublicKeyBase58Check ||
    "";
  const prof = entry?.ProfileEntryResponse || entry?.ProfileEntry || entry?.Profile || entry || {};
  const username = prof?.Username || entry?.Username || "";
  const display = username ? `@${username}` : `@${(pk || "").slice(0, 10)}`;

  const row = document.createElement("div");
  row.className = "follow-item";
  row.innerHTML = `
    <img class="avatar" src="${escapeHtml(profilePicUrl(pk))}" alt="" />
    <div class="meta">
      <div class="follow-name">${escapeHtml(display)}</div>
      <div class="follow-sub">${escapeHtml(shortPk(pk))}</div>
    </div>
    <button class="btn secondary" type="button">Open</button>
  `;

  row.querySelector("button").addEventListener("click", async () => {
    // For now open their profile on node. Later we can route inside the app.
    profileTarget = { publicKey: pk, username: username || "" };
    setRoute("profile");
});

  return row;
}


let followingSearchTimer = null;

async function searchFollowing(query) {
  const q = String(query || "").trim();
  if (!followingListEl || !followingStatusEl) return;

  if (!q) {
    // back to default list
    await loadFollowingList(false);
    return;
  }

  if (!state.user) {
    followingListEl.innerHTML = "";
    setStatus(followingStatusEl, "Login to search.");
    return;
  }

  setStatus(followingStatusEl, `Searching: "${q}"...`);
  followingListEl.innerHTML = "";

  try {
    // We do NOT fetch all 1000 follows.
    // Instead, we use /get-profiles with ReaderPublicKey so backend can respect follow graph.
    // This returns profiles matching the prefix / substring.
    const data = await apiPost("/api/v0/get-profiles", {
      PublicKeyBase58Check: state.user.publicKey,
      UsernamePrefix: q,
      NumToFetch: 50,
    });

    const profs = data?.ProfilesFound || data?.Profiles || [];
    if (!profs.length) {
      setStatus(followingStatusEl, "No results.");
      return;
    }

    // Optionally filter to only those you follow if IsFollowedByReader is provided
    const followed = profs.filter(p => p?.IsFollowedByReader === true || p?.IsFollowedByReaderBool === true);
    const list = followed.length ? followed : profs;

    list.slice(0, 50).forEach(p => {
      const pk = p?.PublicKeyBase58Check || "";
      const entry = { PublicKeyBase58Check: pk, ProfileEntryResponse: p };
      followingListEl.appendChild(renderFollowingItem(entry));
    });

    setStatus(followingStatusEl, `${list.slice(0, 50).length} results`);
  } catch (e) {
    console.error(e);
    setStatus(followingStatusEl, `Error: ${e.message}`);
  }
}

if (followingSearchEl) {
  followingSearchEl.addEventListener("input", (e) => {
    const q = e.target.value;
    clearTimeout(followingSearchTimer);
    followingSearchTimer = setTimeout(() => {
      searchFollowing(q);
    }, 300);
  });
}



function updateFilterUI() {
  if (!activeFilterEl || !filterLabelEl || !clearFilterBtn) return;
  if (!activeHashtag) {
    activeFilterEl.classList.add("hidden");
    filterLabelEl.textContent = "";
    // clear active chips
    document.querySelectorAll(".tagchip").forEach(ch => ch.classList.remove("active"));
    return;
  }
  activeFilterEl.classList.remove("hidden");
  filterLabelEl.textContent = activeHashtag;
  document.querySelectorAll(".tagchip").forEach(ch => {
    ch.classList.toggle("active", ch.dataset.tag === activeHashtag);
  });
}

function setHashtagFilter(tag) {
  activeHashtag = tag;
  updateFilterUI();

  // reload home feed from scratch
  state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
  feedEl.innerHTML = "";
  loadFeedPage().catch(console.error);
}

function clearHashtagFilter() {
  activeHashtag = null;
  updateFilterUI();

  state.feed = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
  feedEl.innerHTML = "";
  loadFeedPage().catch(console.error);
}

if (clearFilterBtn) {
  clearFilterBtn.addEventListener("click", clearHashtagFilter);
}

// ---- Recent posts (right sidebar)
// Strategy: try global curated feed; if empty, fallback to default; if still empty and logged in, fallback to follow feed.
function renderRecentItem(post) {
  const pk = post?.PosterPublicKeyBase58Check || "";
  const initialName = pk ? `@${pk.slice(0, 10)}` : "@user";
  const avatar = pk ? profilePicUrl(pk) : "";

  const body = String(post?.Body || "").trim();
  const shortBody = body.length ? body : "(no text)";
  const ts = post?.TimestampNanos ? new Date(Number(post.TimestampNanos) / 1e6).toLocaleString() : "";

  const row = document.createElement("div");
  row.className = "recent-item";
  const nameId = `recent_${Math.random().toString(16).slice(2)}`;

  row.innerHTML = `
    <img class="avatar" src="${escapeHtml(avatar)}" alt="" />
    <div class="recent-body">
      <div id="${nameId}" class="recent-title">${escapeHtml(initialName)}</div>
      <div class="recent-text">${escapeHtml(shortBody)}</div>
      <div class="recent-meta">${escapeHtml(ts)}</div>
    </div>
  `;

  (async () => {
    try {
      const u = await resolveUsernameForPk(pk, "");
      const el = row.querySelector(`#${nameId}`);
      if (el) el.textContent = u ? `@${u}` : initialName;
    } catch {}
  })();

  row.addEventListener("click", () => {
    if (!pk) return;
    profileTarget = { publicKey: pk, username: "" };
    setRoute("profile");
  });

  return row;
}

let recentLoading = false;

async function loadRecentPosts() {
  if (!recentListEl || !recentStatusEl) return;
  if (recentLoading) return;

  recentLoading = true;
  setStatus(recentStatusEl, "Loading...");
  try {
    const readerPk = state.user?.publicKey || null;

    // 1) Hot feed (most likely to be truly recent/active)
    let posts = [];
    try {
      const body = {
        ReaderPublicKeyBase58Check: readerPk,
        SeenPosts: [],
        ResponseLimit: 10,
      };
      Object.keys(body).forEach(k => (body[k] == null) && delete body[k]);
      const hot = await apiPost("/api/v0/get-hot-feed", body);
      posts = hot?.HotFeedPage || [];
    } catch (e) {
      // ignore and fallback
      console.warn("Hot feed failed:", e?.message || e);
    }

    const tryGetPostsStateless = async (body) => {
      Object.keys(body).forEach(k => (body[k] == null) && delete body[k]);
      const data = await apiPost("/api/v0/get-posts-stateless", body);
      return data?.PostsFound || [];
    };

    // 2) If hot feed is empty, try default stateless feed
    if (!posts.length) {
      posts = await tryGetPostsStateless({
        ReaderPublicKeyBase58Check: readerPk,
        NumToFetch: 10,
      });
    }

    // 3) If still empty and logged in, fallback to follow feed
    if (!posts.length && readerPk) {
      posts = await tryGetPostsStateless({
        ReaderPublicKeyBase58Check: readerPk,
        GetPostsForFollowFeed: true,
        NumToFetch: 10,
      });
      if (posts.length) setStatus(recentStatusEl, "Showing follow feed (fallback).");
    }

    recentListEl.innerHTML = "";
    const top = posts.slice(0, 3);

    if (!top.length) {
      setStatus(recentStatusEl, readerPk ? "No recent posts found." : "Login to see recent posts.");
      return;
    }

    top.forEach(p => recentListEl.appendChild(renderRecentItem(p)));
    if (recentStatusEl.textContent === "Loading...") setStatus(recentStatusEl, "");
  } catch (e) {
    console.error(e);
    setStatus(recentStatusEl, `Error: ${e.message}`);
  } finally {
    recentLoading = false;
  }
}

if (refreshRecentBtn) {
  refreshRecentBtn.addEventListener("click", () => loadRecentPosts());
}


// ---- Trending hashtags (right sidebar)
function extractHashtags(text) {
  const s = String(text || "");
  // Accept #letters #numbers #underscore, Unicode aware-ish (basic)
  const matches = s.match(/#[\w]+/g) || [];
  return matches.map(t => t.length > 1 ? t : "").filter(Boolean);
}

function renderTagChips(tags) {
  if (!tagsListEl || !tagsStatusEl) return;
  tagsListEl.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tagchip";
    btn.type = "button";
    btn.dataset.tag = tag;
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      // toggle filter
      if (activeHashtag === tag) clearHashtagFilter();
      else setHashtagFilter(tag);
      // route to home so user sees filtered feed
      setRoute("home");
    });
    tagsListEl.appendChild(btn);
  });
  updateFilterUI();
}

let tagsLoading = false;

async function loadTrendingHashtags() {
  if (!tagsListEl || !tagsStatusEl) return;
  if (tagsLoading) return;

  tagsLoading = true;
  setStatus(tagsStatusEl, "Loading...");
  try {
    const readerPk = state.user?.publicKey || null;

    // Prefer hot feed because it's current.
    const body = {
      ReaderPublicKeyBase58Check: readerPk,
      SeenPosts: [],
      ResponseLimit: 50,
    };
    Object.keys(body).forEach(k => (body[k] == null) && delete body[k]);

    let posts = [];
    try {
      const hot = await apiPost("/api/v0/get-hot-feed", body);
      posts = hot?.HotFeedPage || [];
    } catch (e) {
      console.warn("Hashtag hot feed failed:", e?.message || e);
    }

    // Fallback: follow feed (when logged in)
    if (!posts.length && readerPk) {
      const data = await apiPost("/api/v0/get-posts-stateless", {
        ReaderPublicKeyBase58Check: readerPk,
        GetPostsForFollowFeed: true,
        NumToFetch: 50,
      });
      posts = data?.PostsFound || [];
    }

    const counts = new Map();
    for (const p of posts) {
      const bodyText = p?.Body || "";
      for (const tag of extractHashtags(bodyText)) {
        const key = tag; // keep case; could normalize
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);

    if (!sorted.length) {
      setStatus(tagsStatusEl, "No hashtags found.");
      tagsListEl.innerHTML = "";
      return;
    }

    renderTagChips(sorted);
    setStatus(tagsStatusEl, "");
  } catch (e) {
    console.error(e);
    setStatus(tagsStatusEl, `Error: ${e.message}`);
  } finally {
    tagsLoading = false;
  }
}

if (refreshTagsBtn) {
  refreshTagsBtn.addEventListener("click", () => loadTrendingHashtags());
}



async function loadFollowingList(force = false) {
  if (!followingListEl || !followingStatusEl) return;
  if (!state.user) {
    followingListEl.innerHTML = "";
    setStatus(followingStatusEl, "Login to see who you follow.");
    return;
  }
  if (followingState.loading) return;
  if (!force && followingState.lastPublicKey === state.user.publicKey && followingListEl.childElementCount) return;

  followingState.loading = true;
  setStatus(followingStatusEl, "Loading...");

  const parseEntries = (data) => {
    // Official-ish shapes observed across nodes:
    // - PublicKeyToProfileEntry (map)  (BitClout/DeSo legacy docs)
    // - PublicKeyToProfileEntryResponse (map)
    // - PublicKeyToProfileEntryResponse (camel variations)
    // - Follows (array) sometimes returned when GetEntriesFollowingUsername=true
    const out = [];

    const map1 = data?.PublicKeyToProfileEntry;
    const map2 = data?.PublicKeyToProfileEntryResponse || data?.PublicKeyToProfileEntryResponses;

    if (map1 && typeof map1 === "object") {
      for (const [pk, prof] of Object.entries(map1)) {
        out.push({ PublicKeyBase58Check: pk, ProfileEntryResponse: prof });
      }
    }
    if (map2 && typeof map2 === "object") {
      for (const [pk, prof] of Object.entries(map2)) {
        out.push({ PublicKeyBase58Check: pk, ProfileEntryResponse: prof });
      }
    }
    if (Array.isArray(data?.Follows)) {
      data.Follows.forEach(f => out.push(f));
    }

    // Dedupe by public key
    const seen = new Set();
    return out.filter(e => {
      const pk = e?.PublicKeyBase58Check || e?.FollowedPublicKeyBase58Check || e?.ProfileEntryResponse?.PublicKeyBase58Check;
      if (!pk) return false;
      if (seen.has(pk)) return false;
      seen.add(pk);
      return true;
    });
  };

  try {
    // Prefer PublicKeyBase58Check. Some nodes behave better with Username too.
    const reqBase = {
      PublicKeyBase58Check: state.user.publicKey,
      Username: state.user.username || undefined,
      NumToFetch: 50,
    };

    // Attempt A: GetEntriesFollowingUsername=true (our "following" attempt)
    let data = await apiPost("/api/v0/get-follows-stateless", {
      ...reqBase,
      GetEntriesFollowingUsername: true,
    });
    let entries = parseEntries(data);


    // Update local follow cache (for follow/unfollow icon state)
    try {
      state.followingCache = new Set(entries.map(e => e?.PublicKeyBase58Check || e?.FollowedPublicKeyBase58Check || e?.ProfileEntryResponse?.PublicKeyBase58Check).filter(Boolean));
    } catch {}
    // Attempt B: if empty, try without the flag (some nodes default differently)
    if (!entries.length) {
      data = await apiPost("/api/v0/get-follows-stateless", reqBase);
      entries = parseEntries(data);
    }

    followingListEl.innerHTML = "";

    if (entries.length) {
      entries.forEach(e => followingListEl.appendChild(renderFollowingItem(e)));
      setStatus(followingStatusEl, `${entries.length} users`);
    } else {
      setStatus(followingStatusEl, "No following found.");
    }

    followingState.lastPublicKey = state.user.publicKey;
  } catch (e) {
    console.error(e);
    setStatus(followingStatusEl, `Error: ${e.message}`);
  } finally {
    followingState.loading = false;
  }
}

if (refreshFollowingBtn) {
  refreshFollowingBtn.addEventListener("click", () => loadFollowingList(true));
}

// ---- Notifications
function diamondAppPostUrl(postHashHex) {
  return postHashHex ? `https://diamondapp.com/posts/${postHashHex}` : "";
}

function getProfileFromMap(profilesByPublicKey, pk) {
  if (!profilesByPublicKey || !pk) return null;
  return profilesByPublicKey[pk] || null;
}

function getUsernameFromProfileEntry(p) {
  if (!p) return "";
  return p?.Username || p?.ProfileEntryResponse?.Username || p?.Profile?.Username || "";
}

function getPostFromMap(postsByHash, postHash) {
  if (!postsByHash || !postHash) return null;
  return postsByHash[postHash] || null;
}

function getNotifPostHash(meta) {
  const likeM = meta?.LikeTxindexMetadata;
  if (likeM?.PostHashHex) return likeM.PostHashHex;

  const btM = meta?.BasicTransferTxindexMetadata;
  const ccM = meta?.CreatorCoinTransferTxindexMetadata;
  if ((btM?.DiamondLevel || 0) > 0 && btM?.PostHashHex) return btM.PostHashHex;
  if ((ccM?.DiamondLevel || 0) > 0 && ccM?.PostHashHex) return ccM.PostHashHex;

  const submitM = meta?.SubmitPostTxindexMetadata;
  if (submitM?.ParentPostHashHex) return submitM.ParentPostHashHex;
  if (submitM?.PostHashBeingModifiedHex) return submitM.PostHashBeingModifiedHex;

  // NFT / other txns: try common fields
  const nftM = meta?.NFTBidTxindexMetadata || meta?.AcceptNFTBidTxindexMetadata || meta?.UpdateNFTTxindexMetadata || meta?.CreateNFTTxindexMetadata;
  if (nftM?.NFTPostHashHex) return nftM.NFTPostHashHex;

  return null;
}

function describeNotification(meta) {
  // Prioritize what Leo asked for: diamonds & likes (then follows, comments)
  const likeM = meta?.LikeTxindexMetadata;
  if (likeM && likeM?.IsUnlike === false) {
    return { kind: "like", text: "liked your post" };
  }

  const btM = meta?.BasicTransferTxindexMetadata;
  const ccM = meta?.CreatorCoinTransferTxindexMetadata;
  const diamondLevel = Number(btM?.DiamondLevel || ccM?.DiamondLevel || 0);
  if (diamondLevel > 0) {
    const plural = diamondLevel === 1 ? "" : "s";
    return { kind: "diamond", text: `sent you ${diamondLevel} diamond${plural} 💎` };
  }

  const followM = meta?.FollowTxindexMetadata;
  if (followM && followM?.IsUnfollow === false) {
    return { kind: "follow", text: "followed you" };
  }

  const submitM = meta?.SubmitPostTxindexMetadata;
  if (submitM && submitM?.ParentPostHashHex) {
    return { kind: "comment", text: "commented on your post" };
  }

  // Fallback
  return { kind: "other", text: "activity" };
}

function renderNotificationItem(n, ctx) {
  const meta = n?.Metadata || {};
  const idx = n?.Index;
  const actorPk = meta?.TransactorPublicKeyBase58Check || "";

  const actorProf = getProfileFromMap(ctx?.profilesByPublicKey, actorPk);
  const actorUsername = getUsernameFromProfileEntry(actorProf);
  const display = actorUsername ? `@${actorUsername}` : (actorPk ? `@${actorPk.slice(0, 10)}` : "@user");
  const avatar = actorPk ? profilePicUrl(actorPk) : "";

  const desc = describeNotification(meta);
  const postHash = getNotifPostHash(meta);
  const post = getPostFromMap(ctx?.postsByHash, postHash);
  const body = String(post?.Body || "").trim();
  const snippet = body ? (body.length > 140 ? (body.slice(0, 140) + "…") : body) : "";

  const item = document.createElement("div");
  item.className = "card";

  const postUrl = diamondAppPostUrl(postHash);

  item.innerHTML = `
    <div class="notif-item">
      <img class="notif-avatar" src="${escapeHtml(avatar)}" alt="" />
      <div class="notif-body">
        <div class="notif-title">${escapeHtml(display)} ${escapeHtml(desc.text)}</div>
        ${snippet ? `<div class="notif-text">${escapeHtml(snippet)}</div>` : ""}
        <div class="notif-meta">Index: ${escapeHtml(String(idx ?? ""))}${desc.kind ? ` • ${escapeHtml(desc.kind)}` : ""}</div>
        <div class="notif-actions">
          <button class="linkbtn notif-open-profile" type="button">Open profile</button>
          ${postHash ? `<button class="linkbtn notif-open-post" type="button">Open post</button>` : ""}
        </div>
      </div>
    </div>
  `;

  const openPostBtn = item.querySelector(".notif-open-post");
  if (openPostBtn) {
    openPostBtn.addEventListener("click", async () => {
      if (!postHash) return;
      try {
        // Mark notifications as read (best-effort)
        const idxNum = Number(idx);
        await markNotificationsAsRead(Number.isFinite(idxNum) ? idxNum : null);
      } catch {}

      openPostInApp(postHash, { backRoute: "notifications" });
    });
  }

  const openProfileBtn = item.querySelector(".notif-open-profile");
  if (openProfileBtn) {
    openProfileBtn.addEventListener("click", async () => {
      if (!actorPk) return;
      profileTarget = { publicKey: actorPk, username: actorUsername || "" };
      setRoute("profile");
    });
  }

  // Improve username display if missing in map
  if (!actorUsername && actorPk) {
    (async () => {
      try {
        const u = await resolveUsernameForPk(actorPk, "");
        const titleEl = item.querySelector(".notif-title");
        if (titleEl) titleEl.textContent = `${u ? `@${u}` : display} ${desc.text}`;
      } catch {}
    })();
  }

  return item;
}

async function loadUnreadNotificationsCount() {
  if (!state.user || !notifBadgeEl) return;
  try {
    const data = await apiPost("/api/v0/get-unread-notifications-count", {
      PublicKeyBase58Check: state.user.publicKey,
    });
    const c = Number(data?.NotificationsCount || 0);
    if (c > 0) {
      notifBadgeEl.textContent = String(c > 99 ? "99+" : c);
      notifBadgeEl.classList.remove("hidden");
    } else {
      notifBadgeEl.textContent = "0";
      notifBadgeEl.classList.add("hidden");
    }
  } catch (e) {
    // If this fails on some nodes, just hide the badge.
    notifBadgeEl.textContent = "0";
    notifBadgeEl.classList.add("hidden");
    console.warn("Unread notifications count failed:", e?.message || e);
  }
}

async function loadNotificationsPage(force = false) {
  if (!state.user) {
    if (notificationsStatusEl) setStatus(notificationsStatusEl, "Login to view notifications.");
    return;
  }
  if (!notificationsListEl || !notificationsStatusEl) return;

  if (force) {
    state.notifications = { loading: false, exhausted: false, nextIndex: -1, seen: new Set(), latestIndex: null };
    notificationsListEl.innerHTML = "";
  }

  if (state.notifications.loading || state.notifications.exhausted) return;
  state.notifications.loading = true;
  setStatus(notificationsStatusEl, "Loading...");

  try {
    const body = {
      PublicKeyBase58Check: state.user.publicKey,
      FetchStartIndex: state.notifications.nextIndex,
      NumToFetch: 25,
    };

    const data = await apiPost("/api/v0/get-notifications", body);
    const notifs = data?.Notifications || [];

    // Track newest index we've seen (needed for marking as read)
    try {
      const batchMax = Math.max(...notifs.map(n => Number(n?.Index)).filter(Number.isFinite));
      if (Number.isFinite(batchMax)) {
        const cur = Number(state.notifications.latestIndex);
        state.notifications.latestIndex = Number.isFinite(cur) ? Math.max(cur, batchMax) : batchMax;
      }
    } catch {}
    const ctx = {
      profilesByPublicKey: data?.ProfilesByPublicKey || {},
      postsByHash: data?.PostsByHash || {},
    };

    if (!notifs.length) {
      state.notifications.exhausted = true;
      setStatus(notificationsStatusEl, notificationsListEl.childElementCount ? "No more notifications." : "No notifications found.");
      return;
    }

    for (const n of notifs) {
      const k = String(n?.Index ?? JSON.stringify(n).slice(0, 60));
      if (state.notifications.seen.has(k)) continue;
      state.notifications.seen.add(k);
      notificationsListEl.appendChild(renderNotificationItem(n, ctx));
    }

    const last = notifs[notifs.length - 1];
    const lastIdx = Number(last?.Index);
    state.notifications.nextIndex = Number.isFinite(lastIdx) ? (lastIdx - 1) : -1;
    setStatus(notificationsStatusEl, "");

    // When opening the notifications page, mark everything as read (best-effort).
    if (force) {
      markNotificationsAsRead().catch(() => {});
    }

    // Refresh badge (best-effort)
    loadUnreadNotificationsCount().catch(() => {});
  } catch (e) {
    console.error(e);
    setStatus(notificationsStatusEl, `Error: ${e.message}`);
  } finally {
    state.notifications.loading = false;
  }
}

if (refreshNotificationsBtn) {
  refreshNotificationsBtn.addEventListener("click", () => loadNotificationsPage(true));
}



// ---- Notifications: mark as read
// Uses: POST /api/v0/set-notification-metadata (requires JWT)
// Fields from backend routes: PublicKeyBase58Check, LastSeenIndex, LastUnreadNotificationIndex, UnreadNotifications, JWT.
async function markNotificationsAsRead(seenIndexOverride = null) {
  if (!state.user) return;

  // Determine how far we want to mark as seen.
  const candidate = Number.isFinite(Number(seenIndexOverride)) ? Number(seenIndexOverride) : Number(state.notifications?.latestIndex);
  if (!Number.isFinite(candidate)) return;

  // Avoid spamming the endpoint.
  if (state.notifications?._marking) return;
  const lastMarked = Number(state.notifications?.lastMarkedIndex);
  if (Number.isFinite(lastMarked) && candidate <= lastMarked) return;

  state.notifications._marking = true;
  try {
    const jwt = await getJwtForUpload();
    if (!jwt) throw new Error('No JWT available (try Logout + Login).');

    // Best-effort: pull the backend's latest scanned unread index.
    let lastUnreadIdx = candidate;
    try {
      const c = await apiPost('/api/v0/get-unread-notifications-count', {
        PublicKeyBase58Check: state.user.publicKey,
      });
      const l = Number(c?.LastUnreadNotificationIndex);
      if (Number.isFinite(l)) lastUnreadIdx = Math.max(lastUnreadIdx, l);
    } catch {}

    await apiPost('/api/v0/set-notification-metadata', {
      PublicKeyBase58Check: state.user.publicKey,
      LastSeenIndex: candidate,
      LastUnreadNotificationIndex: lastUnreadIdx,
      UnreadNotifications: 0,
      JWT: jwt,
    });

    state.notifications.lastMarkedIndex = candidate;

    // Update badge UI immediately.
    if (notifBadgeEl) {
      notifBadgeEl.textContent = '0';
      notifBadgeEl.classList.add('hidden');
    }
  } catch (e) {
    console.warn('markNotificationsAsRead failed:', e?.message || e);
  } finally {
    state.notifications._marking = false;
  }
}


function extractCommentsFromSinglePostResponse(data) {
  if (!data) return [];

  // Common shapes
  const direct = data.CommentsFound || data.Comments || data.PostComments || null;
  if (Array.isArray(direct)) return direct;

  const post = data.PostFound || data.Post || data.PostEntryResponse || null;
  const nested = post && (post.CommentsFound || post.Comments || post.PostComments || post.CommentPosts);
  if (Array.isArray(nested)) return nested;

  // Fallback: walk the object tree to find a plausible array of comment post entries.
  // (DeSo response fields have changed across versions; this keeps UI resilient.)
  function looksLikePostEntry(x) {
    return !!x && typeof x === "object" && ("Body" in x) && ("PosterPublicKeyBase58Check" in x);
  }
  function findPostArray(obj, depth = 5) {
    if (!obj || depth < 0) return null;
    if (Array.isArray(obj)) {
      if (obj.length && obj.every(looksLikePostEntry)) return obj;
      return null;
    }
    if (typeof obj !== "object") return null;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const found = findPostArray(v, depth - 1);
      if (found) return found;
    }
    return null;
  }

  const found = findPostArray(post || data);
  return Array.isArray(found) ? found : [];
}


function getReplyCount(p) {
  const n = Number(p?.CommentCount ?? p?.ReplyCount ?? p?.RepliesCount ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Auto-expand a few reply threads so nested comments are visible by default (prevents "4 comments but only see 2")
let _autoReplyExpandBudget = 6;

function renderCommentItem(p, depth = 0) {
  const wrap = document.createElement("div");
  wrap.className = "card";

  // Tighter look for comments (inline style to avoid CSS changes)
  wrap.style.padding = depth > 0 ? "8px" : "10px";
  wrap.style.marginTop = depth > 0 ? "8px" : "10px";
  if (depth > 0) {
    wrap.style.background = "#fafafa";
    wrap.style.borderColor = "#e5e5e5";
  }

  const authorPk = p?.PosterPublicKeyBase58Check || "";
  const body = p?.Body || "";
  const ts = p?.TimestampNanos ? new Date(Number(p.TimestampNanos) / 1e6).toLocaleString() : "";
  const avatar = authorPk ? profilePicUrl(authorPk) : "";
  const images = Array.isArray(p?.ImageURLs) ? p.ImageURLs.slice(0, 6) : [];

  const nameId = `cname_${Math.random().toString(36).slice(2)}`;
  const initialName = authorPk ? authorPk.slice(0, 10) + "…" : "Unknown";

  const commentHash = p?.PostHashHex || "";
  const replyCount = depth === 0 ? getReplyCount(p) : 0;

  const repliesId = `replies_${Math.random().toString(36).slice(2)}`;
  const repliesStatusId = `rstat_${Math.random().toString(36).slice(2)}`;
  const repliesMoreId = `rmore_${Math.random().toString(36).slice(2)}`;
  const repliesToggleId = `rtoggle_${Math.random().toString(36).slice(2)}`;

  const replyBoxId = `rbox_${Math.random().toString(36).slice(2)}`;
  const replyTextId = `rtext_${Math.random().toString(36).slice(2)}`;
  const replyBtnId = `rbtn_${Math.random().toString(36).slice(2)}`;
  const replyStatusId = `rpost_${Math.random().toString(36).slice(2)}`;

  wrap.innerHTML = `
    <div class="post-top" style="${depth > 0 ? "gap:8px;" : ""}">
      <img class="avatar" src="${escapeHtml(avatar)}" alt="" style="width:${depth > 0 ? "28" : "32"}px; height:${depth > 0 ? "28" : "32"}px;" />
      <div style="flex:1;">
        <div class="post-header" style="align-items:flex-start;">
          <div>
            <div id="${nameId}" class="name" style="font-size:${depth > 0 ? "12" : "13"}px; cursor:pointer;">${escapeHtml(initialName)}</div>
            <div class="muted" style="font-size:11px;">${escapeHtml(ts)}</div>
          </div>
        </div>

        <div style="margin-top:6px; font-size:${depth > 0 ? "12.5" : "13"}px; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(body)}</div>

        ${images.length ? `<div class="media-grid" style="margin-top:8px;">${images
          .map((u) => `<img src="${escapeHtml(u)}" alt="" />`)
          .join("")}</div>` : ""}

        ${
          depth === 0
            ? `
          <div class="row" style="margin-top:8px; gap:10px; flex-wrap:wrap;">
            ${
              replyCount > 0
                ? `<button class="btn secondary" id="${repliesToggleId}" type="button" style="padding:6px 10px; border-radius:999px; font-size:12px;">View replies (${replyCount})</button>`
                : `<span class="muted" style="font-size:12px;"></span>`
            }
            <button class="btn secondary" type="button" data-reply-open="1" style="padding:6px 10px; border-radius:999px; font-size:12px;">Reply</button>
          </div>

          <div id="${replyBoxId}" class="hidden" style="margin-top:8px;">
            <textarea id="${replyTextId}" class="textarea" placeholder="Write a reply..." style="min-height:64px;"></textarea>
            <div class="row space" style="margin-top:6px;">
              <span class="muted" id="${replyStatusId}"></span>
              <button class="btn" id="${replyBtnId}" type="button" style="padding:8px 12px;">Submit reply</button>
            </div>
          </div>

          <div id="${repliesId}" class="hidden" style="margin-top:8px; margin-left:16px; border-left:2px solid #eee; padding-left:12px;"></div>
          <div class="row space hidden" id="${repliesStatusId}" style="margin-left:16px; padding-left:12px;">
            <span class="muted" data-rstatus="1"></span>
            <button class="btn secondary hidden" id="${repliesMoreId}" type="button" style="padding:6px 10px; border-radius:999px; font-size:12px;">Load more replies</button>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  // Resolve username + make it clickable to open profile
  (async () => {
    try {
      const u = await resolveUsernameForPk(authorPk, "");
      const el = wrap.querySelector(`#${nameId}`);
      if (!el) return;
      el.textContent = u ? `@${u}` : initialName;
    } catch {}
  })();

  const nameEl = wrap.querySelector(`#${nameId}`);
  const avatarEl = wrap.querySelector("img.avatar");
  const goProfile = () => {
    if (!authorPk) return;
    profileTarget = { publicKey: authorPk, username: "" };
    setRoute("profile");
  };
  if (nameEl) nameEl.addEventListener("click", goProfile);
  if (avatarEl) avatarEl.addEventListener("click", goProfile);

  // Replies UI (only depth 0)
  if (depth === 0) {
    const repliesEl = wrap.querySelector(`#${repliesId}`);
    const repliesStatusRow = wrap.querySelector(`#${repliesStatusId}`);
    const repliesStatusEl = repliesStatusRow?.querySelector?.('[data-rstatus="1"]');
    const repliesMoreBtn = wrap.querySelector(`#${repliesMoreId}`);
    const repliesToggleBtn = wrap.querySelector(`#${repliesToggleId}`);

    const replyOpenBtn = wrap.querySelector('[data-reply-open="1"]');
    const replyBoxEl = wrap.querySelector(`#${replyBoxId}`);
    const replyTextEl = wrap.querySelector(`#${replyTextId}`);
    const replySubmitBtn = wrap.querySelector(`#${replyBtnId}`);
    const replyPostStatusEl = wrap.querySelector(`#${replyStatusId}`);

    let rOffset = 0;
    let rExhausted = false;
    let rLoading = false;
    let rShown = false;

    async function loadReplies(reset = false) {
      if (!commentHash) return;
      if (rLoading) return;
      if (!reset && rExhausted) return;

      rLoading = true;
      if (repliesMoreBtn) repliesMoreBtn.disabled = true;

      if (reset) {
        rOffset = 0;
        rExhausted = false;
        if (repliesEl) repliesEl.innerHTML = "";
      }

      if (repliesStatusRow) repliesStatusRow.classList.remove("hidden");
      if (repliesStatusEl) setStatus(repliesStatusEl, "Loading replies...");
      try {
        const batch = await fetchCommentsForPost(commentHash, rOffset, COMMENTS_PAGE_SIZE);
        if (Array.isArray(batch) && batch.length) {
          for (const rp of batch) {
            if (repliesEl) repliesEl.appendChild(renderCommentItem(rp, depth + 1));
          }
          rOffset += batch.length;
        }

        if (!batch || batch.length < COMMENTS_PAGE_SIZE) rExhausted = true;

        if (repliesStatusEl) setStatus(repliesStatusEl, "");
        if (repliesMoreBtn) repliesMoreBtn.classList.toggle("hidden", rExhausted);
      } catch (e) {
        console.error(e);
        if (repliesStatusEl) setStatus(repliesStatusEl, `Error: ${e.message}`);
        if (repliesMoreBtn) repliesMoreBtn.classList.add("hidden");
      } finally {
        rLoading = false;
        if (repliesMoreBtn) repliesMoreBtn.disabled = false;
      }
    }

    function showReplies() {
      if (!repliesEl) return;
      rShown = true;
      repliesEl.classList.remove("hidden");
      if (repliesToggleBtn) repliesToggleBtn.textContent = `Hide replies (${replyCount})`;
      // Load on first open
      if (repliesEl.childElementCount === 0) loadReplies(true);
    }
    function hideReplies() {
      if (!repliesEl) return;
      rShown = false;
      repliesEl.classList.add("hidden");
      if (repliesStatusRow) repliesStatusRow.classList.add("hidden");
      if (repliesToggleBtn) repliesToggleBtn.textContent = `View replies (${replyCount})`;
    }

    if (repliesToggleBtn && replyCount > 0) {
      repliesToggleBtn.addEventListener("click", () => {
        if (!rShown) showReplies();
        else hideReplies();
      });
    }

    if (repliesMoreBtn) {
      repliesMoreBtn.addEventListener("click", () => loadReplies(false));
    }

    // Reply composer
    if (replyOpenBtn && replyBoxEl) {
      replyOpenBtn.addEventListener("click", () => {
        replyBoxEl.classList.toggle("hidden");
        if (!replyBoxEl.classList.contains("hidden")) {
          try { replyTextEl?.focus(); } catch {}
        }
      });
    }
    if (replySubmitBtn) {
      replySubmitBtn.addEventListener("click", async () => {
        if (!state.user) return alert("Login first.");
        if (!commentHash) return;
        const txt = String(replyTextEl?.value || "").trim();
        if (!txt) return;

        replySubmitBtn.disabled = true;
        if (replyPostStatusEl) setStatus(replyPostStatusEl, "Posting...");
        try {
          await submitComment(commentHash, txt);
          if (replyPostStatusEl) setStatus(replyPostStatusEl, "Posted ✅");
          if (replyTextEl) replyTextEl.value = "";

          // Ensure replies section is visible + refreshed
          if (replyCount > 0) {
            if (!rShown) showReplies();
            await loadReplies(true);
          } else {
            // If there were previously 0 replies, just show replies area with the new reply
            if (repliesEl) {
              repliesEl.classList.remove("hidden");
              if (repliesToggleBtn) repliesToggleBtn.textContent = `Hide replies`;
              rShown = true;
              await loadReplies(true);
            }
          }

          setTimeout(() => { try { replyPostStatusEl && setStatus(replyPostStatusEl, ""); } catch {} }, 1200);
        } catch (e) {
          console.error(e);
          if (replyPostStatusEl) setStatus(replyPostStatusEl, `Error: ${e.message}`);
          alert(friendlyDerivedKeyError(e?.message || e));
        } finally {
          replySubmitBtn.disabled = false;
        }
      });
    }

    // Auto-expand a few reply threads so the user sees nested comments immediately
    if (replyCount > 0 && _autoReplyExpandBudget > 0) {
      _autoReplyExpandBudget -= 1;
      // Show replies (non-blocking)
      try { showReplies(); } catch {}
    }
  }

  return wrap;
}

async function fetchCommentsForPost(postHashHex, offset, limit) {
  const data = await apiPost("/api/v0/get-single-post", {
    PostHashHex: postHashHex,
    FetchParents: false,
    CommentOffset: offset,
    CommentLimit: limit,
    ReaderPublicKeyBase58Check: state.user?.publicKey || "",
  });
  return extractCommentsFromSinglePostResponse(data);
}

function notifyCommentPosted(postHashHex) {
  try {
    const ui = state.postCommentsUI;
    if (ui && ui.hash === postHashHex && typeof ui.refresh === "function") {
      ui.refresh();
    }
  } catch {}
}


// ---- Post detail (open posts inside THIS app)
function openPostInApp(postHashHex, opts = {}) {
  if (!postHashHex) return;
  postTarget = {
    hash: postHashHex,
    backRoute: opts.backRoute || currentRoute || 'home',
  };
  if (postViewTitleEl) postViewTitleEl.textContent = 'Post';
  setRoute('post');
}

async function loadPostView() {
  if (!postDetailEl || !postDetailStatusEl) return;

  postDetailEl.innerHTML = '';
  state.postCommentsUI = null;

  const hash = postTarget?.hash;
  if (!hash) {
    setStatus(postDetailStatusEl, 'No post selected.');
    return;
  }

  setStatus(postDetailStatusEl, 'Loading...');

  try {
    const data = await apiPost('/api/v0/get-single-post', {
      PostHashHex: hash,
      FetchParents: false,
      CommentOffset: 0,
      CommentLimit: COMMENTS_PAGE_SIZE,
      ReaderPublicKeyBase58Check: state.user?.publicKey || '',
    });

    const post = data?.PostFound || data?.Post || data?.PostEntryResponse || null;
    if (!post) throw new Error('Post not found.');

    postDetailEl.appendChild(renderPostCard(post));

    // ---- Comments (loaded from get-single-post)
    const comments = extractCommentsFromSinglePostResponse(data);
    const totalCommentCount = Number(post?.CommentCount ?? comments.length ?? 0);

    const commentsCard = document.createElement("div");
    commentsCard.className = "card";
    commentsCard.innerHTML = `
      <div class="row space" style="align-items:center;">
        <div style="font-weight:700;">Comments <span class="muted" id="postCommentsCount">(${escapeHtml(String(totalCommentCount))})</span></div>
        <div class="muted" id="postCommentsStatus"></div>
      </div>
      <div id="postCommentsList" style="margin-top:10px;"></div>
      <div class="row" style="justify-content:center; margin-top:10px;">
        <button class="btn secondary" id="postCommentsMoreBtn" type="button">Load more</button>
      </div>
    `;
    postDetailEl.appendChild(commentsCard);

    const commentsListEl = commentsCard.querySelector("#postCommentsList");
    const commentsStatusEl = commentsCard.querySelector("#postCommentsStatus");
    const commentsMoreBtn = commentsCard.querySelector("#postCommentsMoreBtn");
    const commentsCountEl = commentsCard.querySelector("#postCommentsCount");

    let commentOffset = 0;
    let commentExhausted = false;
    let commentLoading = false;

    function renderCommentsBatch(batch, reset) {
      if (!commentsListEl) return;
      if (reset) commentsListEl.innerHTML = "";
      if (!Array.isArray(batch) || batch.length === 0) return;
      for (const c of batch) commentsListEl.appendChild(renderCommentItem(c));
    }

    async function loadMoreComments(reset = false, seedBatch = null) {
      if (!hash) return;
      if (commentLoading) return;
      if (!reset && commentExhausted) return;

      commentLoading = true;
      if (commentsMoreBtn) commentsMoreBtn.disabled = true;

      if (reset) {
        _autoReplyExpandBudget = 6;
        commentOffset = 0;
        commentExhausted = false;
      }

      setStatus(commentsStatusEl, "Loading...");
      try {
        // Use already-fetched batch on first render to avoid an extra request
        let batch = Array.isArray(seedBatch) ? seedBatch : null;
        if (!batch) {
          batch = await fetchCommentsForPost(hash, commentOffset, COMMENTS_PAGE_SIZE);
        }

        if (reset) {
          renderCommentsBatch(batch, true);
        } else {
          renderCommentsBatch(batch, false);
        }

        commentOffset += Array.isArray(batch) ? batch.length : 0;

        // Update count label best-effort
        if (commentsCountEl) {
          const labelTotal = Number.isFinite(totalCommentCount) && totalCommentCount > 0 ? totalCommentCount : commentOffset;
          commentsCountEl.textContent = `(${labelTotal})`;
        }

        // Empty state
        if (reset && commentOffset === 0) {
          if (commentsListEl) {
            const empty = document.createElement("div");
            empty.className = "muted";
            empty.textContent = "No comments yet.";
            commentsListEl.appendChild(empty);
          }
        }

        // Exhausted?
        if (!batch || batch.length < COMMENTS_PAGE_SIZE) {
          commentExhausted = true;
        }

        setStatus(commentsStatusEl, "");
      } catch (e) {
        console.error(e);
        setStatus(commentsStatusEl, `Error: ${e.message}`);
      } finally {
        commentLoading = false;
        if (commentsMoreBtn) {
          commentsMoreBtn.disabled = false;
          commentsMoreBtn.classList.toggle("hidden", commentExhausted);
        }
      }
    }

    if (commentsMoreBtn) {
      commentsMoreBtn.addEventListener("click", () => loadMoreComments(false));
    }

    // Wire refresh so that "Submit comment" can refresh the comment list while viewing this post.
    state.postCommentsUI = { hash, refresh: () => loadMoreComments(true) };

    // Render initial comments from the first response
    await loadMoreComments(true, comments);

    // Optional link (handy for debugging)
    const diamondUrl = diamondAppPostUrl(hash);
    if (diamondUrl) {
      const extra = document.createElement('div');
      extra.className = 'card';
      extra.innerHTML = `<a class="linkbtn" href="${escapeHtml(diamondUrl)}" target="_blank" rel="noopener">Open in Diamond (optional)</a>`;
      postDetailEl.appendChild(extra);
    }

    setStatus(postDetailStatusEl, '');
  } catch (e) {
    console.error(e);
    setStatus(postDetailStatusEl, `Error: ${e.message}`);
  }
}

// ---- Simple routing (Home / Profile / Notifications / Messages)
const views = {
  home: document.getElementById("homeView"),
  profile: document.getElementById("profileView"),
  notifications: document.getElementById("notificationsView"),
  post: document.getElementById("postView"),
  messages: document.getElementById("messagesView"),
  userInfo: document.getElementById("userInfoView"),
  groups: document.getElementById("groupsView"),
  group: document.getElementById("groupView"),
};
const profileHeader = document.getElementById("profileHeader");
const profilePostsEl = document.getElementById("profilePosts");
const profileStatus = document.getElementById("profileStatus");
const userInfoCard = document.getElementById("userInfoCard");
const userInfoLinks = document.getElementById("userInfoLinks");

let currentRoute = "home";
let profileTarget = null; // { publicKey, username } or null (self)

let postTarget = null; // { hash: PostHashHex, backRoute: 'home'|'notifications'|'profile' }

let profilePage = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };

function setRoute(route) {
  currentRoute = route;
  for (const [k, el] of Object.entries(views)) {
    if (!el) continue;
    el.classList.toggle("hidden", k !== route);
  }

  // Active menu button highlight
  document.querySelectorAll("#menu button[data-route]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  if (route === "profile") {
    loadProfileView().catch(console.error);
  }
  if (route === "notifications") {
    loadNotificationsPage(true).catch(console.error);
  }
  if (route === "userInfo") {
    loadUserInfoView().catch(console.error);
  }
  if (route === "post") {
    loadPostView().catch(console.error);
  }
  if (route === "groups") {
    loadGroupsView().catch(console.error);
  }
  if (route === "group") {
    loadGroupView(true).catch(console.error);
  }
}

document.querySelectorAll("#menu button[data-route]").forEach(btn => {
  btn.addEventListener("click", () => setRoute(btn.dataset.route));
});

if (postBackBtn) {
  postBackBtn.addEventListener("click", () => {
    const back = postTarget?.backRoute || "home";
    setRoute(back);
  });
}


// ---- Profile edit helpers (Update Profile)
function readBlobAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = () => reject(new Error("Failed to read image."));
      fr.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = () => reject(new Error("Failed to read file."));
      fr.readAsDataURL(file);
    } catch (e) {
      reject(e);
    }
  });
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed."));
    img.src = src;
  });
}

// Resize + center-crop to square, then encode as dataURL (webp if supported)
async function imageFileToProfilePicDataURL(file, maxDim = 256) {
  const src = await readFileAsDataURL(file);
  const img = await loadImageFromSrc(src);

  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const side = Math.max(1, Math.min(sw, sh));

  // Center-crop square
  const sx = Math.floor((sw - side) / 2);
  const sy = Math.floor((sh - side) / 2);

  const out = Math.max(64, Math.min(maxDim, side)); // avoid tiny
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

  // Prefer webp, fallback to jpeg
  try {
    const webp = canvas.toDataURL("image/webp", 0.9);
    if (webp && webp.startsWith("data:image/webp")) return webp;
  } catch {}
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function fetchProfilePicAsDataURL(pk) {
  const url = profilePicUrl(pk) + `?t=${Date.now()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Profile pic fetch failed (${res.status})`);
  const blob = await res.blob();
  return readBlobAsDataURL(blob);
}

async function updateMyProfile({ pk, newUsername, newDescription, newProfilePicDataURL, existingProfile }) {
  if (!state.user) throw new Error("Login first.");

  const prof = existingProfile || {};
  const creatorBP =
    Number(prof?.CoinEntry?.CreatorBasisPoints ??
      prof?.CoinEntryResponse?.CreatorBasisPoints ??
      prof?.CreatorBasisPoints ??
      1000);

  const body = {
    UpdaterPublicKeyBase58Check: state.user.publicKey,
    ProfilePublicKeyBase58Check: pk,
    NewUsername: String(newUsername || "").trim(),
    NewDescription: String(newDescription || ""),
    NewCreatorBasisPoints: Number.isFinite(creatorBP) ? creatorBP : 1000,
    MinFeeRateNanosPerKB: FEE_RATE,
  };

  // DeSo expects a base64/dataURL string for profile pic. If user didn't pick a new one,
  // try to preserve the current one by fetching it and converting to dataURL.
  let pic = newProfilePicDataURL;
  if (!pic) {
    try { pic = await fetchProfilePicAsDataURL(pk); } catch {}
  }
  if (pic) body.NewProfilePic = pic;

  const resp = await apiPost("/api/v0/update-profile", body);
  const txHex = resp?.TransactionHex;
  if (!txHex) throw new Error("update-profile missing TransactionHex.");
  await signAndSubmit(txHex);
}

async function loadUserInfoView() {
  if (!state.user) {
    if (userInfoCard) userInfoCard.innerHTML = `<b>User info</b><div class="muted" style="margin-top:6px;">Login to view.</div>`;
    if (userInfoLinks) userInfoLinks.innerHTML = `<b>Links</b><div class="muted" style="margin-top:6px;">—</div>`;
    return;
  }

  const viewingSelf = !profileTarget || !profileTarget.publicKey || profileTarget.publicKey === state.user.publicKey;
  const pk = viewingSelf ? state.user.publicKey : profileTarget.publicKey;

  // Fetch full profile data
  const data = await apiPost("/api/v0/get-single-profile", {
    PublicKeyBase58Check: pk,
    NoErrorOnMissing: true,
  });

  const prof = data?.Profile || data?.ProfileEntryResponse || {};
  const username = prof?.Username || (viewingSelf ? (state.user.username || "") : (profileTarget.username || ""));
  const desc = prof?.Description || "";
  const coinPrice = prof?.CoinPriceDeSoNanos != null ? (Number(prof.CoinPriceDeSoNanos) / 1e9).toFixed(3) : "";
  const followers = prof?.NumFollowers != null ? String(prof.NumFollowers) : "";
  const following = prof?.NumFollowing != null ? String(prof.NumFollowing) : "";
  const posts = prof?.NumPosts != null ? String(prof.NumPosts) : "";

  // keep a temporary avatar selection across re-renders while staying on this view
  if (!state._profileEditTmp) state._profileEditTmp = { avatarDataURL: "" };

  if (userInfoCard) {
    const canEdit = viewingSelf;

    userInfoCard.innerHTML = `
      <div class="row space" style="align-items:center;">
        <div class="row" style="align-items:center; min-width:0;">
          <img id="editAvatarImg" class="avatar" src="${escapeHtml(profilePicUrl(pk))}" alt="" />
          <div style="min-width:0;">
            <div style="font-weight:700; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              @${escapeHtml(username || pk.slice(0, 10))}
            </div>
            <div class="muted" style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(pk)}</div>
          </div>
        </div>
        <button id="backToProfileBtn" class="btn secondary" type="button" style="padding:6px 10px; border-radius:10px;">Back</button>
      </div>

      ${
        canEdit
          ? `
        <div style="margin-top:12px; border-top:1px solid var(--border, #eee); padding-top:12px;">
          <b>Edit profile</b>

          <div class="row" style="gap:10px; margin-top:10px; flex-wrap:wrap; align-items:center;">
            <div style="flex:1; min-width:220px;">
              <div class="muted" style="font-size:12px; margin-bottom:4px;">Username</div>
              <input id="editUsername" class="input" placeholder="Choose a username..." value="${escapeHtml(username || "")}" />
            </div>
            <div style="flex:0 0 auto; display:flex; gap:10px; align-items:center;">
              <input id="editAvatarInput" class="hidden" type="file" accept="image/*" />
              <button id="changeAvatarBtn" class="btn secondary" type="button" style="padding:10px 12px; border-radius:12px;">Change avatar</button>
            </div>
          </div>

          <div style="margin-top:10px;">
            <div class="muted" style="font-size:12px; margin-bottom:4px;">Bio</div>
            <textarea id="editBio" class="textarea" placeholder="Write something about yourself..." ">${escapeHtml(desc || "")}</textarea>
          </div>

          <div class="row space" style="margin-top:10px; align-items:center;">
            <span id="profileEditStatus" class="muted"></span>
            <button id="saveProfileBtn" class="btn" type="button" style="padding:10px 14px;">Save</button>
          </div>

          <div class="muted" style="font-size:12px; margin-top:8px;">
            Note: first time you use this, Identity might ask for extra permission (UPDATE_PROFILE).
          </div>
        </div>
          `
          : `
        <div style="margin-top:10px; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(desc || "(no bio)")}</div>
          `
      }

      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        ${followers ? `<span class="tag">Followers: ${escapeHtml(followers)}</span>` : ""}
        ${following ? `<span class="tag">Following: ${escapeHtml(following)}</span>` : ""}
        ${posts ? `<span class="tag">Posts: ${escapeHtml(posts)}</span>` : ""}
        ${coinPrice ? `<span class="tag">Coin: ${escapeHtml(coinPrice)} DESO</span>` : ""}
      </div>
    `;

    const backBtn = document.getElementById("backToProfileBtn");
    if (backBtn) backBtn.addEventListener("click", () => setRoute("profile"));

    if (viewingSelf) {
      const avatarImg = document.getElementById("editAvatarImg");
      if (avatarImg && state._profileEditTmp.avatarDataURL) {
        avatarImg.src = state._profileEditTmp.avatarDataURL;
      } else if (avatarImg) {
        // cache-bust so user sees their latest avatar after saving
        avatarImg.src = profilePicUrl(pk) + `?t=${Date.now()}`;
      }

      const statusEl = document.getElementById("profileEditStatus");
      const setEditStatus = (t) => { if (statusEl) statusEl.textContent = t || ""; };

      const input = document.getElementById("editAvatarInput");
      const changeBtn = document.getElementById("changeAvatarBtn");
      if (changeBtn && input) {
        changeBtn.addEventListener("click", () => {
          input.value = "";
          input.click();
        });
      }

      if (input) {
        input.addEventListener("change", async (e) => {
          const f = e.target?.files?.[0];
          if (!f) return;
          if (!String(f.type || "").startsWith("image/")) return alert("Please select an image file.");
          if (f.size > 10 * 1024 * 1024) return alert("Max 10MB for avatar.");

          setEditStatus("Preparing avatar...");
          try {
            const dataUrl = await imageFileToProfilePicDataURL(f, 256);
            state._profileEditTmp.avatarDataURL = dataUrl;
            const img = document.getElementById("editAvatarImg");
            if (img) img.src = dataUrl;
            setEditStatus("Avatar ready ✅");
          } catch (err) {
            console.error(err);
            setEditStatus("Avatar error.");
            alert(err?.message || err);
          }
        });
      }

      const saveBtn = document.getElementById("saveProfileBtn");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          const uEl = document.getElementById("editUsername");
          const bEl = document.getElementById("editBio");
          const newU = String(uEl?.value || "").trim();
          const newB = String(bEl?.value || "");

          if (!newU) return alert("Username is required.");

          saveBtn.disabled = true;
          setEditStatus("Saving...");

          try {
            await updateMyProfile({
              pk,
              newUsername: newU,
              newDescription: newB,
              newProfilePicDataURL: state._profileEditTmp.avatarDataURL || "",
              existingProfile: prof,
            });

            // Update local UI state so we don't need a full refresh
            state.user.username = newU;
            try { usernameCache.set(pk, newU); } catch {}
            const who = document.getElementById("whoami");
            if (who) who.textContent = newU ? `@${newU}` : `@${pk.slice(0, 10)}`;

            // refresh composer + profile avatar
            if (composerAvatar) composerAvatar.src = profilePicUrl(pk) + `?t=${Date.now()}`;

            showToast("Profile updated ✅");
            setEditStatus("");

            // Clear avatar temp so next time we use fetched/cached one unless changed again
            state._profileEditTmp.avatarDataURL = "";

            // Re-render the view to show updated header text and avatar (cache-busted)
            loadUserInfoView().catch(console.error);
          } catch (e) {
            console.error(e);
            alert(friendlyDerivedKeyError(e?.message || e));
            setEditStatus("");
          } finally {
            saveBtn.disabled = false;
          }
        });
      }
    }
  }

  if (userInfoLinks) {
    // If prof contains Extras or other links, show them; otherwise show default links.
    const website = prof?.Website || "";
    const featured = prof?.FeaturedImageURL || "";
    userInfoLinks.innerHTML = `
      <b>Links</b>
      <div class="muted" style="margin-top:6px;">
        ${website ? `Website: ${escapeHtml(website)}` : "Website: —"}
      </div>
      ${featured ? `<div class="muted" style="margin-top:6px;">Featured image: ${escapeHtml(featured)}</div>` : ""}
    `;
  }
}

async function loadProfileView() {
  if (!state.user) {
    profileHeader.innerHTML = `<b>Profile</b><div class="muted" style="margin-top:6px;">Login to view profiles.</div>`;
    profilePostsEl.innerHTML = "";
    setStatus(profileStatus, "");
    return;
  }

  const viewingSelf = !profileTarget || !profileTarget.publicKey || profileTarget.publicKey === state.user.publicKey;

  const pk = viewingSelf ? state.user.publicKey : profileTarget.publicKey;
  let username = viewingSelf ? (state.user.username || "") : (profileTarget.username || "");

  // If username missing (common when following map doesn't include it), fetch it
  if (!username) {
    username = await fetchUsername(pk);
    if (!viewingSelf) profileTarget.username = username;
  }

  const title = username ? `@${username}` : `@${pk.slice(0, 10)}`;
  const subtitle = escapeHtml(pk);

  profileHeader.innerHTML = `
    <div class="row space" style="align-items:center;">
      <div class="row" style="align-items:center;">
        <img class="avatar" src="${escapeHtml(profilePicUrl(pk))}" alt="" />
        <div>
          <div style="font-weight:700; font-size:16px;">${escapeHtml(title)}</div>
          <div class="muted" style="max-width:220px; overflow:hidden; text-overflow:ellipsis;">${subtitle}</div>
        </div>
      </div>
      ${viewingSelf ? `<button id="openInfoBtn" class="btn secondary" type="button" style="padding:6px 10px; border-radius:10px;">Info</button>` : `<div class="row" style="gap:8px;"><button id="openInfoBtn" class="btn secondary" type="button" style="padding:6px 10px; border-radius:10px;">Info</button><button id="backToMeBtn" class="btn secondary" type="button" style="padding:6px 10px; border-radius:10px;">My profile</button></div>`}
    </div>
  `;

  const infoBtn = document.getElementById("openInfoBtn");
  if (infoBtn) infoBtn.addEventListener("click", () => {
    setRoute("userInfo");
    loadUserInfoView().catch(console.error);
  });

  if (!viewingSelf) {
    const btn = document.getElementById("backToMeBtn");
    if (btn) btn.addEventListener("click", () => {
      profileTarget = null;
      setRoute("profile");
    });
  }

  // Load posts first page for selected profile
  profilePage = { loading: false, exhausted: false, lastPostHashHex: null, seen: new Set() };
  profilePostsEl.innerHTML = "";
  await loadProfilePostsPage();
}


async function loadProfilePostsPage() {
  if (!state.user) return;
  if (profilePage.loading || profilePage.exhausted) return;

  profilePage.loading = true;
  setStatus(profileStatus, "Loading posts...");

  try {
    const targetPk = (profileTarget && profileTarget.publicKey) ? profileTarget.publicKey : state.user.publicKey;
    const body = {
      PublicKeyBase58Check: targetPk,
      ReaderPublicKeyBase58Check: state.user.publicKey,
      NumToFetch: 20,
    };
    if (profilePage.lastPostHashHex) body.LastPostHashHex = profilePage.lastPostHashHex;

    const data = await apiPost("/api/v0/get-posts-for-public-key", body);
    const posts = data?.Posts || data?.PostsFound || [];

    if (!posts.length) {
      profilePage.exhausted = true;
      setStatus(profileStatus, "No more posts.");
      return;
    }

    for (const p of posts) {
      const h = p?.PostHashHex || JSON.stringify(p).slice(0, 40);
      if (profilePage.seen.has(h)) continue;
      profilePage.seen.add(h);
      profilePostsEl.appendChild(renderPostCard(p));
    }

    const last = posts[posts.length - 1];
    profilePage.lastPostHashHex = last?.PostHashHex || null;

    setStatus(profileStatus, "");
  } catch (e) {
    console.error(e);
    setStatus(profileStatus, `Error: ${e.message}`);
  } finally {
    profilePage.loading = false;
  }
}

// Add infinite scroll for profile too
window.addEventListener("scroll", () => {
  if (currentRoute !== "profile") return;
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
  if (nearBottom) loadProfilePostsPage();
});

// Infinite scroll for notifications
window.addEventListener("scroll", () => {
  if (currentRoute !== "notifications") return;
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
  if (nearBottom) loadNotificationsPage(false).catch(() => {});
});

