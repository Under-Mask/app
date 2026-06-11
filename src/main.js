import "./styles.css";
import { loadBrainfitDatabase, syncBrainfitDatabase } from "./lib/db.js";
import { getAuthSession, resetPassword, signInWithEmail, signUpWithEmail, supabase } from "./lib/supabase.js";

const ONBOARDING_KEY = "brainfit-onboarding-v2-complete";
const AUTH_KEY = "brainfit-authenticated";
const AUTH_MODE_KEY = "brainfit-auth-mode";
const DEVICE_KEY = "brainfit-device-id";
const A = "/assets/onboard/";
const H = "/assets/home/";
const R = "/assets/record/";
const HP = "/assets/help/";
const M = "/assets/my/";

const emotions = [
  { id: "happy", label: "기쁨", emoji: "😊", tone: "밝은 에너지가 또렷하게 남아 있었어요." },
  { id: "calm", label: "평온", emoji: "😌", tone: "마음이 조금 안정되고 숨을 고를 수 있었어요." },
  { id: "neutral", label: "그저 그래요", emoji: "😐", tone: "마음이 크게 흔들리진 않았지만 조금 둔하게 느껴졌어요." },
  { id: "sad", label: "슬픔", emoji: "😢", tone: "마음이 무겁고 쉬어갈 시간이 필요했어요." },
  { id: "angry", label: "화남", emoji: "😤", tone: "답답함이나 억울함이 올라온 상태였어요." },
  { id: "anxious", label: "불안", emoji: "😟", tone: "앞일에 대한 걱정으로 긴장이 높아졌어요." },
  { id: "tired", label: "피곤", emoji: "😴", tone: "몸과 마음의 에너지가 많이 줄어든 것 같아요." }
];

const recordMoodChoices = [
  { id: "happy", label: "기쁨", asset: "emotion_icon_happy_yellow.png" },
  { id: "calm", label: "평온", asset: "emotion_icon_calm_blue.png" },
  { id: "neutral", label: "그저 그래요", asset: "emotion_icon_neutral_purple.png" },
  { id: "sad", label: "슬픔", asset: "emotion_icon_sad_pink.png" },
  { id: "angry", label: "화남", asset: "emotion_icon_angry_red.png" }
];

const quickTags = ["시험", "과제", "대인관계", "진로", "취업", "수면"];
const seedRecords = [
  { date: "2026-06-03", emotionId: "happy", intensity: 70, note: "발표가 생각보다 잘 끝났다.", tags: ["과제"] },
  { date: "2026-06-02", emotionId: "angry", intensity: 60, note: "팀 일정이 갑자기 바뀌었다.", tags: ["대인관계"] },
  { date: "2026-06-01", emotionId: "calm", intensity: 40, note: "산책하고 나니 머리가 정리됐다.", tags: ["수면"] },
  { date: "2026-05-31", emotionId: "sad", intensity: 80, note: "취업 준비가 막막하게 느껴졌다.", tags: ["취업"] },
  { date: "2026-05-30", emotionId: "anxious", intensity: 65, note: "시험 범위가 많아서 불안했다.", tags: ["시험"] }
];

const detailDates = [
  "2025년 5월 21일 (수)",
  "2025년 5월 20일 (화)",
  "2025년 5월 19일 (월)"
];

const timelineItems = [
  ["21:30", "좋은 하루를 마무리 중이에요! 😊", "기쁨 80%", "평온 70%", "icon_mood_happy_face.png"],
  ["15:20", "일이 잘 풀리지 않아서 스트레스 받았어요.", "화남 60%", "불안 40%", "bar_emotion_anger.png"],
  ["12:10", "점심 먹고 잠깐 산책했더니 기분이 좋아졌어요.", "평온 70%", "기쁨 50%", "bar_emotion_calm.png"],
  ["08:45", "오늘 하루가 기대돼요! ☀️", "기쁨 70%", "평온 60%", "icon_mood_happy_face.png"]
];

const featurePages = {
  chat: {
    title: "AI와 대화하기",
    subtitle: "{name}이와 지금 마음을 가볍게 나눠보세요.",
    icon: "card_feature_chat.png",
    items: ["오늘의 기분을 한 문장으로 말해보기", "AI 공감 메시지 받기", "대화 기록은 안전하게 보관돼요"],
    button: "대화 시작하기"
  },
  goal: {
    title: "오늘의 목표",
    subtitle: "마음을 위한 작은 목표를 하나씩 세워요.",
    icon: "card_feature_goal.png",
    items: ["물 한 잔 마시기", "10분 산책하기", "해야 할 일 하나만 정리하기"],
    button: "목표 저장하기"
  },
  routine: {
    title: "마음 챙김 루틴",
    subtitle: "짧게 쉬어가며 오늘의 마음을 돌봐요.",
    icon: "card_feature_routine_leaf.png",
    items: ["3번 깊게 숨쉬기", "어깨 힘 빼기", "오늘 고마웠던 일 떠올리기"],
    button: "루틴 완료하기"
  }
};

const onboardingSlides = [
  {
    title: `<span class="brand-gradient">BrainFit<br>Campus</span>`,
    subtitle: `대학생을 위한<br>AI 감정 케어 앱 <span class="heart-text">♥</span>`,
    character: "character_cloud_basic.png",
    button: "시작하기",
    login: true,
    features: []
  },
  {
    title: `당신의 감정을<br><span>이해하고, 성장할 수</span><br>있도록 도와드려요`,
    subtitle: `AI가 당신의 감정을 분석하고<br>맞춤형 케어를 제공해요 <span class="heart-text">♥</span>`,
    character: "character_cloud_basic.png",
    button: "다음",
    features: [
      ["icon_badge_calendar_heart.png", "감정 기록 & 분석", "내 감정을 기록하고 패턴을 분석해요"],
      ["icon_badge_ai_chat.png", "AI 공감 & 대화", "AI가 당신의 이야기를 들어주고 따뜻한 메시지를 전해요"],
      ["icon_badge_security_lock.png", "맞춤 케어 & 루틴", "당신에게 맞는 케어와 루틴으로 마음을 건강하게 관리해요"]
    ]
  },
  {
    title: `나만의 <span>캐릭터</span>와 함께<br>더 즐겁게 성장해요`,
    subtitle: `귀여운 메이트가 당신의 마음을 이해하고<br>매일의 성장을 응원해요 <span class="heart-text">♥</span>`,
    character: "character_cloud_umbrella.png",
    button: "다음",
    features: [
      ["icon_badge_chat_message.png", "나를 이해해주는 메이트", "당신의 감정을 공감하고 이야기를 들어줘요"],
      ["icon_badge_calendar_heart.png", "함께하는 성장 루틴", "기록하고 실천하면 메이트가 함께 응원해요"],
      ["icon_badge_heart_care.png", "작은 변화도 특별하게", "성장할 때마다 보상과 메시지로 힘을 줘요"]
    ]
  },
  {
    title: `마음이 힘들 때<br><span>언제든</span> 찾아와요`,
    subtitle: `{nameNim}의 마음 곁에서<br>24시간 따뜻하게 함께할게요 <span class="heart-text">♥</span>`,
    character: "character_cloud_basic.png",
    halo: true,
    button: "시작하기",
    features: [
      ["icon_badge_moon_stars.png", "24시간 언제나 함께", "힘든 순간, 당신의 이야기를 들어줄게요"],
      ["icon_badge_security_lock.png", "안전하고 비밀스럽게", "모든 대화는 안전하게 보호돼요"],
      ["icon_badge_heart_care.png", "지속적인 마음 케어", "매일의 감정을 기록하고 변화를 함께 지켜봐요"]
    ]
  }
];

function createLocalId(prefix = "local") {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = createLocalId("device");
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record, index) => ({
    id: record.id || `record-${Date.parse(record.date) || Date.now()}-${index}`,
    ...record
  }));
}

const saved = JSON.parse(localStorage.getItem("brainfit-records") || "null");
const savedRewards = JSON.parse(localStorage.getItem("brainfit-reward-claims") || "{}");
const savedGoals = JSON.parse(localStorage.getItem("brainfit-goals") || "{}");
const savedAiMessages = JSON.parse(localStorage.getItem("brainfit-ai-messages") || "null");
const savedNotificationsRead = localStorage.getItem("brainfit-notifications-read") === "true";
const savedMyProfile = JSON.parse(localStorage.getItem("brainfit-my-profile") || "null");
const savedMyPreferences = JSON.parse(localStorage.getItem("brainfit-my-preferences") || "null");
const forceOnboarding = new URLSearchParams(window.location.search).get("onboard") === "1";
const forceSignup = new URLSearchParams(window.location.search).get("signup") === "1";
const isLoggedIn = () => Boolean(supabase) && localStorage.getItem(AUTH_KEY) === "true" && localStorage.getItem(AUTH_MODE_KEY) === "supabase";
const shouldShowOnboarding = () => forceOnboarding || !isLoggedIn() || !localStorage.getItem(ONBOARDING_KEY);
const myAvatarOptions = [
  { id: "cloud", label: "구름이", asset: "my_character_cloud.png" },
  { id: "bear", label: "보라 곰", asset: "my_avatar_lavender_bear.png" },
  { id: "sprout", label: "새싹", asset: "my_avatar_green_sprout.png" },
  { id: "bunny", label: "토끼", asset: "my_avatar_pink_bunny.png" },
  { id: "dog", label: "시바", asset: "my_avatar_shiba_dog.png" }
];
const myThemeColors = ["#7657f4", "#ef68a5", "#5da4f4", "#86d596", "#f7c45c", "rainbow"];
const myActivityFilters = [
  ["all", "전체"],
  ["emotion", "감정 기록"],
  ["goal", "목표 & 습관"],
  ["ai", "AI 대화"],
  ["reward", "보상 & 배지"]
];

const defaultMyProfile = {
  name: "지민",
  avatar: "cloud",
  birth: "2000. 05. 21",
  age: "26",
  gender: "여성",
  region: "서울특별시",
  bio: "매일 조금씩 더 나아지고 있는 나를 응원해요! 💜"
};

const defaultMyPreferences = {
  push: true,
  encouragement: true,
  reminder: true,
  weeklyReport: true,
  reminderTime: "오후 9:00",
  theme: "light",
  fontSize: "보통",
  color: "#7657f4"
};

const state = {
  view: forceSignup ? "signup" : shouldShowOnboarding() ? "onboard" : "home",
  onboardStep: 0,
  onboardDirection: "forward",
  onboardBusy: false,
  selectedEmotion: "happy",
  intensity: 70,
  note: "",
  tags: ["시험"],
  records: normalizeRecords(Array.isArray(saved) && saved.length ? saved : seedRecords),
  last: null,
  recordMode: "entry",
  helpMode: "main",
  myMode: "main",
  myActivityFilter: "all",
  helpCenterIndex: 0,
  notificationOrigin: { view: "home", recordMode: "entry" },
  selectedRecordIndex: 0,
  editingRecordIndex: null,
  calendarDay: new Date().getDate(),
  aiMessages: Array.isArray(savedAiMessages) ? savedAiMessages : [],
  detailDateIndex: 0,
  timelineNewestFirst: true,
  commentEditing: false,
  dailyComment: localStorage.getItem("brainfit-daily-comment") || "작은 행복들이 모여서 좋은 하루가 되었어요. 내일도 기대돼요! ✨",
  rewardClaims: savedRewards,
  coins: Number(localStorage.getItem("brainfit-coins") || "0"),
  goals: savedGoals,
  notificationsRead: savedNotificationsRead,
  myProfile: { ...defaultMyProfile, ...(savedMyProfile || {}) },
  myPreferences: { ...defaultMyPreferences, ...(savedMyPreferences || {}) },
  toast: ""
};

const app = document.querySelector("#app");
const tabs = document.querySelectorAll(".tab");
const tabbar = document.querySelector(".tabbar");

function persist() {
  localStorage.setItem("brainfit-records", JSON.stringify(state.records));
  queueSupabaseSync("records");
}

function persistRewards() {
  localStorage.setItem("brainfit-reward-claims", JSON.stringify(state.rewardClaims));
  localStorage.setItem("brainfit-coins", String(state.coins));
  queueSupabaseSync("rewards");
}

function persistGoals() {
  localStorage.setItem("brainfit-goals", JSON.stringify(state.goals));
  queueSupabaseSync("goals");
}

function persistAiMessages() {
  localStorage.setItem("brainfit-ai-messages", JSON.stringify(state.aiMessages));
  queueSupabaseSync("ai_messages");
}

function persistNotifications() {
  localStorage.setItem("brainfit-notifications-read", String(state.notificationsRead));
  queueSupabaseSync("notifications");
}

function getMyAvatar() {
  return myAvatarOptions.find((item) => item.id === state.myProfile.avatar) || myAvatarOptions[0];
}

function profileName() {
  return (state.myProfile.name || defaultMyProfile.name).trim();
}

function profileNim() {
  return `${profileName()}님`;
}

function ageFromBirth(birth) {
  const match = String(birth || "").match(/(\d{4})\D*(\d{1,2})?\D*(\d{1,2})?/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2] || 1);
  const day = Number(match[3] || 1);
  if (!year || year < 1900) return "";
  const today = new Date();
  let age = today.getFullYear() - year;
  const passedBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!passedBirthday) age -= 1;
  return age > 0 && age < 120 ? String(age) : "";
}

function profileAge() {
  return String(state.myProfile.age || ageFromBirth(state.myProfile.birth) || "").trim();
}

function profileMeta() {
  return [profileAge() ? `${profileAge()}세` : "", state.myProfile.region].filter(Boolean).join(" · ");
}

function personalize(value) {
  return String(value)
    .replaceAll("{nameNim}", profileNim())
    .replaceAll("{name}", profileName())
    .replaceAll("{age}", profileAge())
    .replaceAll("지민님", profileNim())
    .replaceAll("지민이", profileName())
    .replaceAll("지민", profileName());
}

function persistMy() {
  localStorage.setItem("brainfit-my-profile", JSON.stringify(state.myProfile));
  localStorage.setItem("brainfit-my-preferences", JSON.stringify(state.myPreferences));
  queueSupabaseSync("my");
}

function buildBrainfitStatePayload(reason = "manual") {
  return {
    device_id: getDeviceId(),
    sync_reason: reason,
    profile: {
      display_name: state.myProfile.name || defaultMyProfile.name,
      campus: "BrainFit Campus",
      avatar_asset: getMyAvatar().asset,
      birth: state.myProfile.birth,
      age: profileAge(),
      gender: state.myProfile.gender,
      region: state.myProfile.region,
      bio: state.myProfile.bio
    },
    records: state.records,
    reward_claims: state.rewardClaims,
    goals: state.goals,
    ai_messages: state.aiMessages,
    coins: state.coins,
    daily_comment: state.dailyComment,
    notifications_read: state.notificationsRead,
    notification_origin: state.notificationOrigin,
    my_profile: state.myProfile,
    my_preferences: state.myPreferences,
    onboarding_completed: localStorage.getItem(ONBOARDING_KEY) === "true",
    auth_mode: localStorage.getItem(AUTH_MODE_KEY),
    updated_at: new Date().toISOString()
  };
}

function markSupabaseAuthenticated() {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(AUTH_MODE_KEY, "supabase");
  localStorage.setItem(ONBOARDING_KEY, "true");
}

function clearSupabaseAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_MODE_KEY);
}

function authErrorMessage(error, fallback) {
  const message = String(error?.message || "");
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (message.includes("Email not confirmed")) return "이메일 인증을 먼저 완료해 주세요.";
  if (message.includes("already registered")) return "이미 가입된 이메일이에요. 로그인으로 들어가 주세요.";
  if (message.includes("Password should be")) return "비밀번호는 6자 이상으로 입력해 주세요.";
  if (message.includes("Supabase")) return "Supabase 환경변수를 먼저 연결해야 실제 가입/로그인이 돼요.";
  return fallback;
}

async function completeAuthenticatedEntry(reason = "auth") {
  markSupabaseAuthenticated();
  await hydrateFromRemoteDatabase();
  queueSupabaseSync(reason);
  state.view = "home";
  render();
  app.scrollTop = 0;
}

function queueSupabaseSync(reason = "state") {
  if (!supabase || !isLoggedIn()) return;
  window.clearTimeout(queueSupabaseSync.timer);
  queueSupabaseSync.timer = window.setTimeout(async () => {
    try {
      const sync = await syncBrainfitDatabase(buildBrainfitStatePayload(reason));
      if (sync.errors?.length) {
        console.warn("Supabase DB sync failed", sync.errors);
      }
    } catch (error) {
      console.warn("Supabase sync unavailable", error);
    }
  }, 250);
}

async function hydrateFromRemoteDatabase(userId = null) {
  if (!supabase) return;
  try {
    const { data, error } = await loadBrainfitDatabase(getDeviceId(), userId);
    if (error || !data) return;
    if (Array.isArray(data.records) && data.records.length) {
      state.records = normalizeRecords(data.records);
      localStorage.setItem("brainfit-records", JSON.stringify(state.records));
    }
    if (data.reward_claims && typeof data.reward_claims === "object") {
      state.rewardClaims = data.reward_claims;
      localStorage.setItem("brainfit-reward-claims", JSON.stringify(state.rewardClaims));
    }
    if (data.goals && typeof data.goals === "object") {
      state.goals = data.goals;
      localStorage.setItem("brainfit-goals", JSON.stringify(state.goals));
    }
    if (Array.isArray(data.ai_messages)) {
      state.aiMessages = data.ai_messages;
      localStorage.setItem("brainfit-ai-messages", JSON.stringify(state.aiMessages));
    }
    state.coins = Number(data.coins || 0);
    state.dailyComment = data.daily_comment || state.dailyComment;
    if (data.my_profile && typeof data.my_profile === "object") {
      state.myProfile = { ...state.myProfile, ...data.my_profile };
    }
    if (data.my_preferences && typeof data.my_preferences === "object") {
      state.myPreferences = { ...state.myPreferences, ...data.my_preferences };
    }
    state.notificationsRead = Boolean(data.notifications_read);
    localStorage.setItem("brainfit-coins", String(state.coins));
    localStorage.setItem("brainfit-daily-comment", state.dailyComment);
    localStorage.setItem("brainfit-my-profile", JSON.stringify(state.myProfile));
    localStorage.setItem("brainfit-my-preferences", JSON.stringify(state.myPreferences));
    localStorage.setItem("brainfit-notifications-read", String(state.notificationsRead));
    render();
  } catch (error) {
    console.warn("Supabase DB hydrate skipped", error);
  }
}

function showToast(message) {
  state.toast = message;
  renderToast();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = "";
    renderToast();
  }, 1800);
}

function renderToast() {
  document.querySelector(".app-toast")?.remove();
  if (!state.toast) return;
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.textContent = state.toast;
  document.querySelector(".phone").appendChild(toast);
}

function cloud() {
  return `<div class="cloud" aria-hidden="true"><i></i><i></i><span class="face">•ᴗ•</span><span class="foot f1"></span><span class="foot f2"></span></div>`;
}

function notificationIconSrc(type = "home") {
  const stateName = state.notificationsRead ? "" : "_badge";
  if (type === "record") {
    return `${H}icon_bell_purple${stateName}.png`;
  }
  if (type === "help") {
    return `${H}icon_bell_green${stateName}.png`;
  }
  return `${H}icon_bell_gray${stateName}.png`;
}

function getEmotion(id) {
  return emotions.find((emotion) => emotion.id === id) || emotions[0];
}

function getRecordMood(id) {
  return recordMoodChoices.find((emotion) => emotion.id === id) || recordMoodChoices[0];
}

function setView(view) {
  if (view === "record" && state.view !== "record") {
    state.recordMode = "entry";
  }
  if (view === "help" && state.view !== "help") {
    state.helpMode = "main";
  }
  if (view === "my" && state.view !== "my") {
    state.myMode = "main";
  }
  state.view = view;
  render();
  app.scrollTop = 0;
}

function updateTabs() {
  const activeView = ["homeDetail", "reward", "notifications", "chat", "goal", "routine"].includes(state.view) ? "home" : state.view;
  tabs.forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
}

function completeOnboarding() {
  if (isLoggedIn()) {
    localStorage.setItem(ONBOARDING_KEY, "true");
  }
  setView("home");
}

function finishOnboardingWithMotion(button) {
  if (state.onboardBusy) return;
  state.onboardBusy = true;
  button.classList.add("is-pressing");
  setTimeout(() => {
    state.onboardBusy = false;
    setView("signup");
  }, 180);
}

function nextOnboarding(button) {
  if (state.onboardBusy) return;
  if (state.onboardStep === onboardingSlides.length - 1) {
    finishOnboardingWithMotion(button);
    return;
  }

  state.onboardBusy = true;
  button.classList.add("is-pressing");
  setTimeout(() => {
    state.onboardDirection = "forward";
    state.onboardStep += 1;
    state.onboardBusy = false;
    render();
    app.scrollTop = 0;
  }, 180);
}

function goOnboardingStep(step) {
  if (state.onboardBusy || step === state.onboardStep) return;
  state.onboardDirection = step > state.onboardStep ? "forward" : "back";
  state.onboardStep = step;
  render();
  app.scrollTop = 0;
}

function bindNav() {
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.go));
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button));
  });
  document.querySelectorAll("[data-claim]").forEach((button) => {
    button.addEventListener("click", () => claimReward(button.dataset.claim));
  });
  document.querySelectorAll("[data-locked-reward]").forEach((button) => {
    button.addEventListener("click", () => showToast(`${button.dataset.lockedReward} 보상은 아직 잠겨 있어요.`));
  });
  setupScrollReveal();
  renderToast();
}

function handleAction(action, element) {
  if (action === "notify") {
    state.notificationOrigin = {
      view: state.view === "notifications" ? state.notificationOrigin.view : state.view,
      recordMode: state.recordMode
    };
    setView("notifications");
    return;
  }
  if (action === "closeNotifications") {
    const origin = state.notificationOrigin || { view: "home", recordMode: "entry" };
    if (origin.view === "record") {
      state.recordMode = origin.recordMode || "entry";
    }
    setView(origin.view || "home");
    return;
  }
  if (action === "prevDate") {
    state.detailDateIndex = (state.detailDateIndex + detailDates.length - 1) % detailDates.length;
    homeDetail();
    showToast(`${detailDates[state.detailDateIndex]} 기록을 불러왔어요.`);
    return;
  }
  if (action === "nextDate") {
    state.detailDateIndex = (state.detailDateIndex + 1) % detailDates.length;
    homeDetail();
    showToast(`${detailDates[state.detailDateIndex]} 기록을 불러왔어요.`);
    return;
  }
  if (action === "calendar") {
    showToast("달력 선택 기능은 더미 데이터로 준비 중이에요.");
    return;
  }
  if (action === "criteria") {
    showToast("기쁨, 평온, 슬픔, 화남, 불안 비율을 AI가 종합해요.");
    return;
  }
  if (action === "toggleSort") {
    state.timelineNewestFirst = !state.timelineNewestFirst;
    homeDetail();
    showToast(state.timelineNewestFirst ? "최신순으로 정렬했어요." : "오래된순으로 정렬했어요.");
    return;
  }
  if (action === "editComment") {
    state.commentEditing = true;
    homeDetail();
    return;
  }
  if (action === "saveComment") {
    const value = document.querySelector("#commentInput")?.value.trim();
    if (value) {
      state.dailyComment = value;
      localStorage.setItem("brainfit-daily-comment", value);
      queueSupabaseSync("daily_comment");
    }
    state.commentEditing = false;
    homeDetail();
    showToast("오늘의 코멘트를 저장했어요.");
    return;
  }
  if (action === "cancelComment") {
    state.commentEditing = false;
    homeDetail();
    return;
  }
  if (action === "rewardInfo") {
    showToast("마음 동전은 캐릭터, 테마, 특별 콘텐츠에 사용할 수 있어요.");
    return;
  }
  if (action === "markNotifications") {
    state.notificationsRead = true;
    persistNotifications();
    notifications();
    showToast("알림을 모두 읽음으로 표시했어요.");
    return;
  }
  if (action === "openNotification") {
    showToast("더미 알림 상세를 확인했어요.");
    return;
  }
  if (action === "featurePrimary") {
    element.classList.add("is-pressing");
    window.setTimeout(() => {
      element.classList.remove("is-pressing");
      showToast(`${personalize(featurePages[state.view]?.title || "기능")} 더미 액션이 완료됐어요.`);
    }, 180);
    return;
  }
  if (action.startsWith("toggleGoal:")) {
    const key = action.replace("toggleGoal:", "");
    state.goals[key] = !state.goals[key];
    persistGoals();
    featurePage(state.view);
    showToast(state.goals[key] ? "체크했어요." : "체크를 해제했어요.");
  }
}

function claimReward(key) {
  if (state.rewardClaims[key]) {
    showToast("이미 받은 보상이에요.");
    return;
  }
  state.rewardClaims[key] = true;
  state.coins += key === "3" ? 10 : 0;
  persistRewards();
  reward();
  showToast("마음 동전 10개를 받았어요!");
}

function setupScrollReveal() {
  setupScrollReveal.cleanup?.();
  const units = app.querySelectorAll(".home-page > *, .detail-page > *, .reward-page > *, .record-page > *, .feature-page > *, .notification-page > *, .help-page > *, .my-page > *, .home-feature, .emotion-row, .timeline-item, .reward-row, .record-row, .help-center-card, .my-activity-row, .my-settings-row");
  units.forEach((unit, index) => {
    unit.classList.add("reveal-unit");
    unit.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 35}ms`);
  });
  const reveal = (unit) => unit.classList.add("is-visible");
  const checkVisible = () => {
    const root = app.getBoundingClientRect();
    units.forEach((unit) => {
      if (unit.classList.contains("is-visible")) return;
      const rect = unit.getBoundingClientRect();
      if (rect.top < root.bottom - 24 && rect.bottom > root.top + 8) {
        reveal(unit);
      }
    });
  };

  if (!("IntersectionObserver" in window)) {
    checkVisible();
    app.addEventListener("scroll", checkVisible, { passive: true });
    setupScrollReveal.cleanup = () => app.removeEventListener("scroll", checkVisible);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { root: app, threshold: 0.12 });

  units.forEach((unit) => observer.observe(unit));
  window.requestAnimationFrame(checkVisible);
  app.addEventListener("scroll", checkVisible, { passive: true });
  setupScrollReveal.cleanup = () => {
    observer.disconnect();
    app.removeEventListener("scroll", checkVisible);
  };
}

function stats() {
  const total = state.records.length || 1;
  return emotions
    .map((emotion) => {
      const count = state.records.filter((record) => record.emotionId === emotion.id).length;
      return { ...emotion, count, percent: Math.round((count / total) * 100) };
    })
    .filter((item) => item.count > 0);
}

function empathy(record) {
  const emotion = getEmotion(record.emotionId);
  const tagText = record.tags.length ? `${record.tags.join(", ")}와 관련된 일이 있었고, ` : "";
  const noteText = record.note.trim() || "짧게라도 감정을 기록한 것";
  return {
    title: `${emotion.label} 감정을 기록했어요`,
    body: `${tagText}${emotion.tone} "${noteText}"라고 남긴 건 지금 상태를 외면하지 않고 살펴본 행동이에요.`,
    action: "지금 할 수 있는 작은 행동: 물 한 잔을 마시고, 해야 할 일을 10분짜리 하나로 줄여보세요."
  };
}

function formatDate(date) {
  const value = new Date(date);
  return `${value.getMonth() + 1}.${value.getDate()}`;
}

function getStreak() {
  return Math.min(7, state.records.length);
}

function getSelectedRecord() {
  return state.records[state.selectedRecordIndex] || state.records[0] || null;
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatRecordDate(date) {
  const value = new Date(date);
  return `${value.getFullYear()}년 ${value.getMonth() + 1}월 ${value.getDate()}일`;
}

function scoreFromIntensity(intensity) {
  return Math.max(1, Math.min(5, Math.ceil(Number(intensity || 0) / 20)));
}

function recordSummary(records = state.records) {
  const total = records.length || 1;
  const counts = emotions.map((emotion) => ({
    ...emotion,
    count: records.filter((record) => record.emotionId === emotion.id).length
  }));
  const average = records.length
    ? records.reduce((sum, record) => sum + scoreFromIntensity(record.intensity), 0) / records.length
    : 0;
  const scores = records.map((record) => scoreFromIntensity(record.intensity));
  return {
    counts,
    total: records.length,
    average,
    high: scores.length ? Math.max(...scores) : 0,
    low: scores.length ? Math.min(...scores) : 0,
    percents: counts.map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }))
  };
}

function monthlyCalendarData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let blank = 0; blank < first.getDay(); blank += 1) {
    days.push(null);
  }
  for (let day = 1; day <= last.getDate(); day += 1) {
    const dayRecords = state.records.filter((record) => {
      const value = new Date(record.date);
      return value.getFullYear() === year && value.getMonth() === month && value.getDate() === day;
    });
    days.push({ day, records: dayRecords });
  }
  return { year, month, days };
}

function buildAiReply(record, userText = "") {
  const target = record || getSelectedRecord();
  if (!target) {
    return "아직 기록이 없어서 공감 메시지를 만들 수 없어요. 먼저 오늘의 감정을 남겨주세요.";
  }
  const emotion = getEmotion(target.emotionId);
  const note = target.note?.trim() ? ` "${target.note.trim()}"라고 적어준 부분이 특히 마음에 남아요.` : "";
  const follow = userText ? ` 방금 말한 "${userText}"도 함께 기억해둘게요.` : "";
  return `${emotion.label}이 느껴졌던 하루였군요.${note}${follow} 완벽하지 않아도 괜찮아요. 지금 마음을 알아차리고 기록한 것만으로도 이미 한 걸음 나아간 거예요.`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function onboard() {
  const slide = onboardingSlides[state.onboardStep];
  const step = state.onboardStep + 1;
  const featureCards = slide.features.map((feature, index) => `
    <article class="onboard-feature" style="--delay:${index * 70}ms">
      <img src="${A}${feature[0]}" alt="" aria-hidden="true">
      <div>
        <b>${personalize(feature[1])}</b>
        <span>${personalize(feature[2])}</span>
      </div>
    </article>
  `).join("");

  app.innerHTML = `
    <section class="onboard onboard-slide ${state.onboardDirection} ${slide.features.length ? "with-features" : "intro"}">
      <div class="onboard-progress"><b>${step}</b><span>/</span><b>4</b></div>
      <header class="onboard-copy">
        <h1>${personalize(slide.title)}</h1>
        <p>${personalize(slide.subtitle)}</p>
      </header>
      <div class="onboard-visual">
        <img class="onboard-deco heart-large" src="${A}decoration_heart_large.png" alt="" aria-hidden="true">
        <img class="onboard-deco heart-small" src="${A}decoration_heart_small.png" alt="" aria-hidden="true">
        <img class="onboard-deco sparkle sparkle-a" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="onboard-deco sparkle sparkle-b" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="onboard-deco sparkle sparkle-c" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        ${slide.halo ? `<img class="onboard-halo" src="${A}effect_halo_ring_lavender.png" alt="" aria-hidden="true">` : ""}
        <img class="onboard-shadow" src="${A}effect_ground_shadow_purple.png" alt="" aria-hidden="true">
        <img class="onboard-character-img ${slide.character.includes("umbrella") ? "umbrella" : ""}" src="${A}${slide.character}" alt="" aria-hidden="true">
      </div>
      ${featureCards ? `<div class="onboard-features">${featureCards}</div>` : ""}
      <div class="onboard-actions">
        <button class="onboard-button" id="onboardPrimary" type="button">${slide.button}</button>
        ${slide.login ? `<p class="login-line">이미 계정이 있으신가요? <button id="goLogin" type="button">로그인</button></p>` : ""}
        <div class="onboard-dots" aria-label="온보딩 진행 상태">
          ${onboardingSlides.map((_, index) => `
            <button class="${index === state.onboardStep ? "active" : ""}" type="button" data-onboard-step="${index}" aria-label="${index + 1}번째 온보딩"></button>
          `).join("")}
        </div>
      </div>
    </section>
  `;
  document.querySelector("#onboardPrimary").addEventListener("click", (event) => nextOnboarding(event.currentTarget));
  document.querySelector("#goLogin")?.addEventListener("click", () => setView("login"));
  document.querySelectorAll("[data-onboard-step]").forEach((button) => {
    button.addEventListener("click", () => goOnboardingStep(Number(button.dataset.onboardStep)));
  });
}

function login() {
  app.innerHTML = `
    <section class="login-page">
      <button class="login-back" type="button" aria-label="온보딩으로 돌아가기">‹</button>
      <div class="login-visual">
        <img class="login-sparkle s1" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="login-sparkle s2" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="login-heart" src="${A}decoration_heart_large.png" alt="" aria-hidden="true">
        <img class="login-character" src="${A}character_cloud_basic.png" alt="" aria-hidden="true">
      </div>
      <header class="login-copy">
        <p>BrainFit Campus</p>
        <h1>다시 만나서 반가워요</h1>
        <span>계정에 로그인하고 마음 기록을 이어가요.</span>
      </header>
      <form class="login-form" id="loginForm">
        <label>
          <span>이메일</span>
          <input id="loginEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <label>
          <span>비밀번호</span>
          <div class="password-field">
            <input id="loginPassword" type="password" autocomplete="current-password" placeholder="비밀번호" required>
            <button id="togglePassword" type="button" aria-label="비밀번호 보기">보기</button>
          </div>
        </label>
        <p class="login-error" id="loginError" role="alert"></p>
        <button class="onboard-button login-submit" id="loginSubmit" type="submit">로그인</button>
      </form>
      <div class="login-footer">
        <button id="resetPassword" type="button">비밀번호 찾기</button>
        <span></span>
        <button id="goSignup" type="button">회원가입</button>
      </div>
    </section>
  `;

  document.querySelector(".login-back").addEventListener("click", () => setView("onboard"));
  document.querySelector("#goSignup").addEventListener("click", () => setView("signup"));
  document.querySelector("#resetPassword").addEventListener("click", async () => {
    const email = document.querySelector("#loginEmail").value.trim();
    const error = document.querySelector("#loginError");
    if (!email) {
      error.textContent = "비밀번호 재설정 메일을 받을 이메일을 먼저 입력해 주세요.";
      return;
    }
    const { error: resetError } = await resetPassword(email);
    error.textContent = resetError
      ? authErrorMessage(resetError, "재설정 메일 발송에 실패했어요.")
      : "비밀번호 재설정 메일을 보냈어요.";
  });
  document.querySelector("#togglePassword").addEventListener("click", () => {
    const input = document.querySelector("#loginPassword");
    const button = document.querySelector("#togglePassword");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "숨김" : "보기";
  });
  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value.trim();
    const error = document.querySelector("#loginError");
    const submit = document.querySelector("#loginSubmit");

    if (!email || !password) {
      error.textContent = "이메일과 비밀번호를 입력해 주세요.";
      return;
    }

    error.textContent = "";
    submit.classList.add("is-pressing");
    submit.textContent = "로그인 중";

    if (!supabase) {
      error.textContent = "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 먼저 연결해야 로그인돼요.";
      submit.classList.remove("is-pressing");
      submit.textContent = "로그인";
      return;
    }

    const { data: signInData, error: signInError } = await signInWithEmail(email, password);
    if (signInError) {
      error.textContent = authErrorMessage(signInError, "로그인에 실패했어요. Supabase 계정 정보를 확인해 주세요.");
      submit.classList.remove("is-pressing");
      submit.textContent = "로그인";
      return;
    }

    const authName = signInData?.user?.user_metadata?.display_name;
    if (authName && !localStorage.getItem("brainfit-my-profile")) {
      state.myProfile.name = authName;
      localStorage.setItem("brainfit-my-profile", JSON.stringify(state.myProfile));
    }

    await completeAuthenticatedEntry("login");
  });
}

function signup() {
  app.innerHTML = `
    <section class="login-page signup-page">
      <button class="login-back" type="button" aria-label="온보딩으로 돌아가기">‹</button>
      <div class="login-visual">
        <img class="login-sparkle s1" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="login-sparkle s2" src="${A}decoration_sparkle_purple.png" alt="" aria-hidden="true">
        <img class="login-heart" src="${A}decoration_heart_large.png" alt="" aria-hidden="true">
        <img class="login-character" src="${A}character_cloud_basic.png" alt="" aria-hidden="true">
      </div>
      <header class="login-copy">
        <p>BrainFit Campus</p>
        <h1>계정을 만들고 시작해요</h1>
        <span>가입하면 기록, 보상, 프로필이 Supabase DB에 저장돼요.</span>
      </header>
      <form class="login-form" id="signupForm">
        <label>
          <span>닉네임</span>
          <input id="signupName" type="text" autocomplete="name" maxlength="12" value="${escapeHtml(profileName())}" required>
        </label>
        <label>
          <span>이메일</span>
          <input id="signupEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <label>
          <span>비밀번호</span>
          <div class="password-field">
            <input id="signupPassword" type="password" autocomplete="new-password" placeholder="6자 이상" minlength="6" required>
            <button id="toggleSignupPassword" type="button" aria-label="비밀번호 보기">보기</button>
          </div>
        </label>
        <label>
          <span>비밀번호 확인</span>
          <input id="signupConfirm" type="password" autocomplete="new-password" placeholder="한 번 더 입력" minlength="6" required>
        </label>
        <p class="login-error" id="signupError" role="alert"></p>
        <button class="onboard-button login-submit" id="signupSubmit" type="submit">회원가입</button>
      </form>
      <div class="login-footer">
        <button id="goLoginFromSignup" type="button">이미 계정이 있어요</button>
      </div>
    </section>
  `;

  document.querySelector(".login-back").addEventListener("click", () => setView("onboard"));
  document.querySelector("#goLoginFromSignup").addEventListener("click", () => setView("login"));
  document.querySelector("#toggleSignupPassword").addEventListener("click", () => {
    const input = document.querySelector("#signupPassword");
    const button = document.querySelector("#toggleSignupPassword");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "숨김" : "보기";
  });
  document.querySelector("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.querySelector("#signupName").value.trim();
    const email = document.querySelector("#signupEmail").value.trim();
    const password = document.querySelector("#signupPassword").value.trim();
    const confirm = document.querySelector("#signupConfirm").value.trim();
    const error = document.querySelector("#signupError");
    const submit = document.querySelector("#signupSubmit");

    if (!name || !email || !password || !confirm) {
      error.textContent = "닉네임, 이메일, 비밀번호를 모두 입력해 주세요.";
      return;
    }
    if (password.length < 6) {
      error.textContent = "비밀번호는 6자 이상으로 입력해 주세요.";
      return;
    }
    if (password !== confirm) {
      error.textContent = "비밀번호 확인이 맞지 않아요.";
      return;
    }
    if (!supabase) {
      error.textContent = "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 먼저 연결해야 회원가입돼요.";
      return;
    }

    state.myProfile.name = name;
    localStorage.setItem("brainfit-my-profile", JSON.stringify(state.myProfile));
    error.textContent = "";
    submit.classList.add("is-pressing");
    submit.textContent = "가입 중";

    const { data, error: signUpError } = await signUpWithEmail(email, password, {
      display_name: name,
      device_id: getDeviceId()
    });

    if (signUpError) {
      error.textContent = authErrorMessage(signUpError, "회원가입에 실패했어요. 이메일과 비밀번호를 확인해 주세요.");
      submit.classList.remove("is-pressing");
      submit.textContent = "회원가입";
      return;
    }

    if (data?.session) {
      await completeAuthenticatedEntry("signup");
      return;
    }

    submit.classList.remove("is-pressing");
    submit.textContent = "회원가입";
    error.textContent = "가입 메일을 보냈어요. 이메일 인증 후 로그인해 주세요.";
    window.setTimeout(() => setView("login"), 1200);
  });
}

function home() {
  const meta = profileMeta();
  app.innerHTML = `
    <section class="home-page">
      <header class="home-hero-copy">
        <div>
          <p>안녕하세요, ${profileNim()}${meta ? ` · ${meta}` : ""} <span>♥</span></p>
          <h1>오늘 하루는<br><span>어떠셨나요?</span></h1>
        </div>
        <button class="home-bell" type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("home")}" alt=""></button>
      </header>

      <section class="home-character-stage" aria-label="마음 메이트">
        <img class="home-deco home-heart-large" src="${H}decoration_heart_large.png" alt="" aria-hidden="true">
        <img class="home-deco home-heart-small" src="${H}decoration_heart_small.png" alt="" aria-hidden="true">
        <img class="home-deco home-sparkle s1" src="${H}decoration_sparkle_small.png" alt="" aria-hidden="true">
        <img class="home-deco home-sparkle s2" src="${H}decoration_sparkle_small.png" alt="" aria-hidden="true">
        <img class="home-deco home-sparkle s3" src="${H}decoration_sparkle_small.png" alt="" aria-hidden="true">
        <img class="home-cloud-main" src="${H}character_cloud_main.png" alt="" aria-hidden="true">
      </section>

      <div class="support-bubble">${profileNim()} 곁에서 오늘도<br>따뜻하게 <span>응원할게요! ♥</span></div>

      <section class="home-mood-card">
        <div class="home-card-head">
          <h2><span></span>오늘의 감정</h2>
          <button type="button" data-go="homeDetail">자세히 보기 ›</button>
        </div>
        <div class="home-mood-body">
          <div class="mood-face-block">
            <img src="${H}icon_mood_happy_face.png" alt="" aria-hidden="true">
            <strong>좋음</strong>
            <span>76%</span>
          </div>
          <div class="mood-score">
            <div class="mood-bubble">76</div>
            <div class="mood-gradient"><i></i></div>
            <div class="mood-labels"><span>매우 나쁨</span><span>나쁨</span><span>보통</span><span>좋음</span><span>매우 좋음</span></div>
          </div>
        </div>
      </section>

      <section class="home-feature-grid">
        ${[
          ["card_feature_journal.png", "감정 기록", "지금 기분을<br>기록해보세요", "record"],
          ["card_feature_chat.png", "AI 대화", "구름이와 마음을<br>나눠보세요", "chat"],
          ["card_feature_goal.png", "오늘 목표", "마음을 위한<br>목표를 세워요", "goal"],
          ["card_feature_routine_leaf.png", "마음 루틴", "오늘의 마음을<br>돌보는 시간", "routine"]
        ].map((item) => `
          <button class="home-feature home-feature-${item[3]}" type="button" data-go="${item[3]}" aria-label="${item[1]}">
            <img class="home-feature-card-img" src="${H}${item[0]}" alt="" aria-hidden="true">
            <span class="home-feature-copy">
              <b>${item[1]}</b>
              <span>${item[2]}</span>
            </span>
          </button>
        `).join("")}
      </section>

      <section class="home-reward-banner">
        <div class="reward-left">
          <img src="${H}icon_gift_purple.png" alt="" aria-hidden="true">
          <div><b>연속 기록 3일째! 👏</b><span>꾸준한 기록이 변화를 만들어요</span></div>
        </div>
        <button type="button" data-go="reward">보상 확인하기 ›</button>
      </section>
    </section>
  `;
  bindNav();
}

function homeDetail() {
  const orderedTimeline = state.timelineNewestFirst ? timelineItems : [...timelineItems].reverse();
  const commentMarkup = state.commentEditing ? `
    <div class="comment-editor">
      <textarea id="commentInput" maxlength="120">${state.dailyComment}</textarea>
      <div><button type="button" data-action="cancelComment">취소</button><button type="button" data-action="saveComment">저장</button></div>
    </div>
  ` : `<span>${state.dailyComment}</span>`;

  app.innerHTML = `
    <section class="detail-page">
      <header class="subpage-top">
        <button class="sub-icon-btn" type="button" data-go="home" aria-label="홈으로 돌아가기"><img src="${H}icon_back_arrow.png" alt=""></button>
        <h1>오늘의 감정 자세히 보기</h1>
        <button class="sub-icon-btn" type="button" data-action="calendar" aria-label="달력"><img src="${H}icon_calendar_purple.png" alt=""></button>
      </header>

      <div class="date-pill"><button type="button" data-action="prevDate">‹</button><span>${detailDates[state.detailDateIndex]}</span><button type="button" data-action="nextDate">›</button></div>

      <section class="detail-summary-card">
        <div class="detail-score-left">
          <img src="${H}icon_mood_happy_face.png" alt="" aria-hidden="true">
          <strong>좋음</strong>
          <b>76%</b>
          <span>오늘 하루도<br>수고했어요! ♥</span>
        </div>
        <div class="detail-chart">
          <h2>감정 점수 변화</h2>
          <img src="${H}chart_mood_score_line.png" alt="감정 점수 변화 차트">
          <div class="chart-legend"><i></i>현재 감정 점수</div>
        </div>
      </section>

      <section class="analysis-card">
        <div class="section-row"><h2>감정 영역 분석</h2><button type="button" data-action="criteria">기준 안내 ⓘ</button></div>
        ${[
          ["bar_emotion_joy.png", "기쁨", "즐겁고 행복한 순간이 많았어요.", "80%"],
          ["bar_emotion_calm.png", "평온", "마음이 안정되고 차분했어요.", "70%"],
          ["bar_emotion_sadness.png", "슬픔", "가끔 속상하거나 우울한 순간이 있었어요.", "30%"],
          ["bar_emotion_anger.png", "화남", "짜증나거나 화가 난 순간이 있었어요.", "20%"],
          ["bar_emotion_anxiety.png", "불안", "걱정되거나 불안한 마음이 있었어요.", "25%"]
        ].map((item) => `
          <article class="emotion-row">
            <img src="${H}${item[0]}" alt="" aria-hidden="true">
            <div><b>${item[1]}</b><span>${item[2]}</span></div>
            <strong>${item[3]}</strong>
          </article>
        `).join("")}
      </section>

      <section class="timeline-card">
        <div class="section-row"><h2>감정 기록 타임라인</h2><button type="button" data-action="toggleSort">${state.timelineNewestFirst ? "시간순" : "오래된순"}⌄</button></div>
        ${orderedTimeline.map((item) => `
          <article class="timeline-item">
            <time>${item[0]}</time>
            <span class="timeline-dot"></span>
            <div>
              <img src="${H}${item[4]}" alt="" aria-hidden="true">
              <p>${item[1]}</p>
              <small>${item[2]}</small><small>${item[3]}</small>
            </div>
          </article>
        `).join("")}
      </section>

      <section class="comment-card">
        <img src="${H}icon_lightbulb_purple.png" alt="" aria-hidden="true">
        <div><b>오늘의 한 줄 코멘트</b>${commentMarkup}</div>
        ${state.commentEditing ? "" : `<button type="button" data-action="editComment"><img src="${H}button_edit_round.png" alt="수정"></button>`}
      </section>
    </section>
  `;
  bindNav();
}

function reward() {
  const rewards = [
    { key: "3", day: "3일", title: "마음 동전 10개", body: "꾸준한 기록 습관을 응원해요!", asset: "coins_stack_purple.png", available: true },
    { key: "7", day: "7일", title: "마음 동전 30개", body: "일주일 동안 잘 해내셨어요!", asset: "badges_reward_bronze_silver_gold.png" },
    { key: "14", day: "14일", title: "마음 동전 70개", body: "2주 연속 기록! 멋져요!", asset: "badges_reward_bronze_silver_gold.png" },
    { key: "30", day: "30일", title: "마음 동전 150개", body: "한 달 연속! 대단해요!", asset: "badges_reward_bronze_silver_gold.png" },
    { key: "60", day: "60일", title: "스페셜 배지 ‘꾸준한 마음’", body: "두 달 연속 기록의 특별한 보상!", asset: "character_cloud_main.png" }
  ];

  app.innerHTML = `
    <section class="reward-page">
      <header class="subpage-top">
        <button class="sub-icon-btn" type="button" data-go="home" aria-label="홈으로 돌아가기"><img src="${H}icon_back_arrow.png" alt=""></button>
        <h1>연속 기록 보상</h1>
        <button class="sub-icon-btn" type="button" data-action="rewardInfo" aria-label="안내"><img src="${H}icon_info_purple.png" alt=""></button>
      </header>

      <section class="reward-hero">
        <img class="reward-gift" src="${H}icon_gift_purple.png" alt="" aria-hidden="true">
        <div><h2>꾸준함이 만드는 변화 <span>♥</span></h2><p>연속으로 감정을 기록하고<br>나만의 성장을 이어가세요!<br><b>보유 마음 동전 ${state.coins}개</b></p></div>
        <img class="reward-cloud" src="${H}character_cloud_holding_gift.png" alt="" aria-hidden="true">
      </section>

      <h2 class="reward-section-title">연속 기록 현황</h2>
      <section class="streak-card">
        <img src="${H}icon_flame_purple.png" alt="" aria-hidden="true">
        <div class="streak-info"><b>3일 연속</b><span>최고 연속 7일</span></div>
        <div class="week-checks">${["월", "화", "수", "목", "금", "토", "일"].map((day, index) => `<span class="${index < 3 ? "done" : ""}"><b>${day}</b><i>${index < 3 ? "✓" : ""}</i></span>`).join("")}</div>
        <p>내일도 기록하면 <b>4일 연속</b> 보상을 받을 수 있어요!</p>
      </section>

      <h2 class="reward-section-title">연속 기록 보상</h2>
      <section class="reward-list">
        ${rewards.map((item) => {
          const claimed = Boolean(state.rewardClaims[item.key]);
          return `
          <article class="reward-row ${item.available ? "available" : ""} ${claimed ? "claimed" : ""}">
            <span>${item.day}</span>
            <img src="${H}${item.asset}" alt="" aria-hidden="true">
            <div><b>${item.title}</b><small>${item.body}</small></div>
            ${item.available
              ? `<button type="button" data-claim="${item.key}">${claimed ? "받은 보상" : "보상 받기"}</button>`
              : `<button class="locked-reward-btn" type="button" data-locked-reward="${item.day}" aria-label="${item.day} 보상 잠김"><img class="reward-lock" src="${H}lock_single.png" alt=""></button>`}
          </article>
        `;
        }).join("")}
      </section>

      <h2 class="reward-section-title">보상 안내</h2>
      <button class="reward-info-card" type="button" data-action="rewardInfo">
        <img src="${H}coins_stack_purple.png" alt="" aria-hidden="true">
        <div><b>마음 동전은 이렇게 사용할 수 있어요!</b><p>나만의 캐릭터 꾸미기<br>테마 및 배경 잠금 해제<br>특별 콘텐츠 이용</p></div>
        <span>›</span>
      </button>
    </section>
  `;
  bindNav();
}

function notifications() {
  app.innerHTML = `
    <section class="notification-page">
      <header class="subpage-top">
        <button class="sub-icon-btn" type="button" data-action="closeNotifications" aria-label="이전 화면으로 돌아가기"><img src="${H}icon_back_arrow.png" alt=""></button>
        <h1>알림</h1>
        <button class="sub-icon-btn notification-read" type="button" data-action="markNotifications" aria-label="모두 읽음">✓</button>
      </header>

      <section class="notification-hero">
        <img src="${notificationIconSrc("home")}" alt="" aria-hidden="true">
        <div>
          <b>오늘도 마음 기록 시간이 왔어요</b>
          <span>더미 알림 데이터가 이 장치에 준비되어 있어요.</span>
        </div>
      </section>

      <section class="notification-list">
        ${[
          ["감정 기록 리마인드", "오늘 기분을 짧게 남기면 연속 기록이 이어져요.", "방금 전"],
          ["보상 도착", "3일 연속 기록 보상을 받을 수 있어요.", "10분 전"],
          ["AI 응원 메시지", `${profileNim()}의 좋은 흐름을 이어갈 작은 루틴을 추천했어요.`, "1시간 전"]
        ].map((item) => `
          <button class="notification-item" type="button" data-action="openNotification">
            <i></i>
            <div><b>${item[0]}</b><span>${item[1]}</span></div>
            <time>${item[2]}</time>
          </button>
        `).join("")}
      </section>
    </section>
  `;
  bindNav();
}

function featurePage(kind) {
  const page = featurePages[kind] || featurePages.chat;
  const title = personalize(page.title);
  const subtitle = personalize(page.subtitle);
  app.innerHTML = `
    <section class="feature-page">
      <header class="subpage-top">
        <button class="sub-icon-btn" type="button" data-go="home" aria-label="홈으로 돌아가기"><img src="${H}icon_back_arrow.png" alt=""></button>
        <h1>${title}</h1>
        <button class="sub-icon-btn" type="button" data-action="rewardInfo" aria-label="안내"><img src="${H}icon_info_purple.png" alt=""></button>
      </header>

      <section class="feature-hero-card">
        <img src="${H}${page.icon}" alt="" aria-hidden="true">
        <div><b>${title}</b><span>${subtitle}</span></div>
      </section>

      <section class="feature-checklist">
        ${page.items.map((item, index) => {
          const key = `${kind}-${index}`;
          const done = Boolean(state.goals[key]);
          return `
            <button class="feature-task ${done ? "done" : ""}" type="button" data-action="toggleGoal:${key}">
              <i>${done ? "✓" : ""}</i>
              <span>${personalize(item)}</span>
            </button>
          `;
        }).join("")}
      </section>

      <button class="onboard-button feature-main-action" type="button" data-action="featurePrimary">${personalize(page.button)}</button>
    </section>
  `;
  bindNav();
}

function recordTabs() {
  return [
    ["history", "히스토리"],
    ["entry", "감정 기록"],
    ["ai", "AI 채팅"],
    ["calendar", "캘린더"]
  ].map(([mode, label]) => `
    <button class="${state.recordMode === mode ? "active" : ""}" type="button" data-record-mode="${mode}">${label}</button>
  `).join("");
}

function recordModeNav() {
  return `<nav class="record-tabs record-mode-nav" aria-label="기록 화면">${recordTabs()}</nav>`;
}

function recordEntryPanel() {
  const editing = Number.isInteger(state.editingRecordIndex);
  const summary = recordSummary(state.records.slice(0, 7));
  const topCounts = recordMoodChoices.map((choice) => ({
    ...choice,
    count: state.records.filter((record) => record.emotionId === choice.id).length
  }));
  return `
    <header class="record-entry-header">
      <div>
        <h1>오늘의 감정을<br><span>${editing ? "수정해요" : "기록해요"}</span> <i>✦</i></h1>
        <p>${profileNim()}의 마음을 이해하고<br>성장하는 첫걸음이에요 <span>♥</span></p>
      </div>
      <div class="record-top-actions">
        <button type="button" data-record-mode="calendar" aria-label="캘린더"><img src="${H}icon_calendar_purple_unified.png" alt=""></button>
        <button type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("record")}" alt=""></button>
      </div>
    </header>

    ${recordModeNav()}

    <section class="record-entry-visual" aria-label="기록 캐릭터">
      <img class="record-deco record-heart-balloon" src="${R}record_decoration_heart_balloon.png" alt="" aria-hidden="true">
      <img class="record-deco record-sparkle a" src="${R}record_decoration_sparkle_purple.png" alt="" aria-hidden="true">
      <img class="record-deco record-sparkle b" src="${R}record_decoration_sparkle_purple.png" alt="" aria-hidden="true">
      <img class="record-deco record-sparkle c" src="${R}record_decoration_sparkle_purple.png" alt="" aria-hidden="true">
      <img class="record-character-pen" src="${R}record_character_cloud_notebook_pen_large.png" alt="" aria-hidden="true">
    </section>

    <section class="record-emotion-card">
      <h2>지금 기분은 어떤가요? <button type="button" data-action="criteria" aria-label="감정 선택 안내">ⓘ</button></h2>
      <div class="record-mood-picker">
        ${recordMoodChoices.map((emotion) => `
          <button class="${emotion.id === state.selectedEmotion ? "active" : ""}" type="button" data-record-emotion="${emotion.id}">
            <img src="${R}${emotion.asset}" alt="" aria-hidden="true">
            <span>${emotion.label}</span>
          </button>
        `).join("")}
      </div>
      <button class="record-primary-button" id="saveRecord" type="button">${editing ? "수정 저장하기" : "감정 기록하기"}</button>
      <button class="record-link-button" type="button" data-record-more>다른 감정 선택하기 ›</button>
      ${editing ? `<button class="record-cancel-edit" id="cancelEdit" type="button">수정 취소</button>` : ""}
    </section>

    <section class="record-weekly-card">
      <div class="head"><h2>이번 주 감정 요약</h2><button type="button" data-record-mode="history">더보기 ›</button></div>
      <div class="record-weekly-content">
        <div class="record-weekly-counts">
          ${topCounts.map((item) => `
            <div><img src="${R}${item.asset}" alt="" aria-hidden="true"><b>${item.count}회</b></div>
          `).join("")}
        </div>
        <img class="record-donut" src="${R}record_chart_weekly_donut.png" alt="이번 주 감정 비율">
      </div>
    </section>
  `;
}

function recordHistoryPanel() {
  const summary = recordSummary();
  const calendar = monthlyCalendarData();
  const recent = state.records.slice(0, 3);
  const scoreItems = [
    ["총 기록", `${summary.total}회`, "record_icon_checklist_purple.png"],
    ["평균 감정 점수", `${summary.average.toFixed(1)} / 5.0`, "emotion_icon_happy_yellow.png"],
    ["최고 점수", `${summary.high}점`, "record_chart_emotion_trend.png"],
    ["최저 점수", `${summary.low}점`, "emotion_icon_sad_pink.png"]
  ];
  return `
    <section class="record-history-calendar">
      <div class="record-history-card-head">
        <h2>${calendar.year}년 ${calendar.month + 1}월</h2>
        <div><button type="button" data-record-month="prev">‹</button><button type="button" data-record-month="next">›</button></div>
        <button type="button" data-action="criteria">감정 점수⌄</button>
      </div>
      <div class="record-calendar-days">
        ${["일", "월", "화", "수", "목", "금", "토"].map((day) => `<b>${day}</b>`).join("")}
        ${calendar.days.map((item) => item ? `
          <button class="${state.calendarDay === item.day ? "active" : ""} ${item.records.length ? `level-${Math.min(5, scoreFromIntensity(item.records[0].intensity))}` : ""}" type="button" data-calendar-day="${item.day}">
            ${item.day}
          </button>
        ` : `<span></span>`).join("")}
      </div>
      <div class="record-calendar-legend">
        <span><i></i>기록 없음</span><span><i></i>낮음</span><span><i></i>보통</span><span><i></i>좋음</span><span><i></i>매우 좋음</span>
      </div>
    </section>

    <section class="record-trend-card">
      <div class="head"><h2>감정 점수 변화 ⓘ</h2><div class="record-chart-tabs"><button class="active" type="button">주간</button><button type="button">월간</button><button type="button">연간</button></div></div>
      <img src="${R}record_chart_emotion_line.png" alt="감정 점수 변화 차트">
    </section>

    <section class="record-score-strip">
      ${scoreItems.map((item) => `
        <div><img src="${R}${item[2]}" alt="" aria-hidden="true"><span>${item[0]}</span><b>${item[1]}</b></div>
      `).join("")}
    </section>

    <section class="record-recent-card">
      <div class="head"><h2>최근 기록</h2><button type="button" data-record-mode="ai">전체 보기 ›</button></div>
      <div class="record-list">
        ${recent.map((item, index) => {
          const emotion = getEmotion(item.emotionId);
          const mood = getRecordMood(item.emotionId);
          return `
            <article class="record-row">
              <button type="button" data-record-open="${index}">
                <img class="record-row-face" src="${R}${mood.asset}" alt="" aria-hidden="true">
                <div><b>${escapeHtml(item.note || `${emotion.label} 감정 기록`)}</b><small>${formatRecordDate(item.date)} · ${emotion.label} · ${item.intensity}%</small></div>
              </button>
              <strong>${emotion.label}</strong>
              <button class="record-more-dot" type="button" data-record-edit="${index}" aria-label="기록 수정">•••</button>
            </article>
          `;
        }).join("") || `<p class="muted">아직 기록이 없어요.</p>`}
      </div>
    </section>
  `;
}

function recordAiPanel() {
  const selected = getSelectedRecord();
  const emotion = selected ? getEmotion(selected.emotionId) : null;
  const aiMessage = selected ? empathy(selected) : null;
  const firstReply = selected
    ? "힘든 하루였을 텐데,\n잘 이겨내줘서 정말 대단해요! 🌙\n스스로를 믿고 한 걸음씩 나아가는\n지민님의 모습이 너무 멋져요 💜"
    : "오늘의 감정을 기록하면 AI 마음이가 따뜻한 메시지를 전해줄게요.";
  const secondReply = selected
    ? "완벽하지 않아도 괜찮아요!\n지금 이 순간에도 충분히 잘하고 있어요.\n조금씩 나아지는 모든 과정이\n지민님을 더 빛나게 해줄 거예요 ✨"
    : buildAiReply(selected);
  return `
    <section class="record-ai-hero">
      <img src="${R}record_banner_ai_empathy.png" alt="" aria-hidden="true">
      <div>
        <h2>${profileNim()}의 마음을<br>이해해요 <span>♥</span></h2>
        <p>오늘의 감정을 바탕으로<br>AI가 전하는 공감 메시지예요</p>
      </div>
    </section>

    <section class="record-chat-stage">
      <div class="record-chat-row bot">
        <img src="${R}record_character_cloud_simple.png" alt="" aria-hidden="true">
        <article><b>AI 마음이 💜</b><p>${escapeHtml(personalize(firstReply)).replaceAll("\n", "<br>")}</p><time>오후 9:30</time></article>
      </div>
      <div class="record-chat-row user">
        <time>오후 9:32</time><article>아직 부족한 것 같아서 자꾸 속상해요...</article>
      </div>
      <div class="record-chat-row bot">
        <img src="${R}record_character_cloud_simple.png" alt="" aria-hidden="true">
        <article><b>AI 마음이 💜</b><p>${escapeHtml(personalize(secondReply)).replaceAll("\n", "<br>")}</p><time>오후 9:33</time></article>
      </div>
      ${state.aiMessages.slice(-4).map((message) => `
        <div class="record-chat-row ${message.role === "user" ? "user" : "bot"}">
          ${message.role === "user" ? `<time>방금</time><article>${escapeHtml(message.text)}</article>` : `<img src="${R}record_character_cloud_simple.png" alt="" aria-hidden="true"><article><b>AI 마음이 💜</b><p>${escapeHtml(message.text)}</p><time>방금</time></article>`}
        </div>
      `).join("")}
    </section>

    <section class="record-quote-card">
      <h2>오늘의 응원 한 마디</h2>
      <p>“작은 발걸음도, 분명 큰 변화를 만들어요”</p>
      <div><i></i><i></i><i></i><i></i></div>
    </section>

    <section class="record-action-grid">
      <button type="button" data-record-mode="entry"><img src="${R}record_icon_checklist_purple.png" alt="" aria-hidden="true"><b>기록 수정하기</b><span>오늘의 감정을<br>다시 기록해요</span></button>
      <button type="button" data-record-share><img src="${R}record_icon_chat_heart.png" alt="" aria-hidden="true"><b>공유하기</b><span>응원 메시지를<br>공유해보세요</span></button>
    </section>
  `;
}

function recordCalendarPanel() {
  const calendar = monthlyCalendarData();
  const selectedRecords = state.records.filter((record) => {
    const value = new Date(record.date);
    return value.getFullYear() === calendar.year && value.getMonth() === calendar.month && value.getDate() === state.calendarDay;
  });
  return `
    <section class="record-panel">
      <div class="head"><h2>${calendar.year}년 ${calendar.month + 1}월</h2><button class="tiny" type="button" data-record-mode="entry">오늘 기록</button></div>
      <div class="calendar-grid">
        ${["일", "월", "화", "수", "목", "금", "토"].map((day) => `<b>${day}</b>`).join("")}
        ${calendar.days.map((item) => item ? `
          <button class="${state.calendarDay === item.day ? "active" : ""} ${item.records.length ? "has-record" : ""}" type="button" data-calendar-day="${item.day}">
            <span>${item.day}</span>
            <i>${item.records.length ? getEmotion(item.records[0].emotionId).emoji : ""}</i>
          </button>
        ` : `<span></span>`).join("")}
      </div>
    </section>
    <section class="record-panel">
      <h2>${state.calendarDay}일 기록</h2>
      ${selectedRecords.map((item, index) => {
        const originalIndex = state.records.indexOf(item);
        const emotion = getEmotion(item.emotionId);
        return `<button class="calendar-record" type="button" data-record-open="${originalIndex}"><span>${emotion.emoji}</span><b>${escapeHtml(item.note || emotion.label)}</b><small>${item.intensity}%</small></button>`;
      }).join("") || `<p class="muted">이 날짜에는 기록이 없어요.</p>`}
    </section>
  `;
}

function bindRecordInteractions() {
  document.querySelectorAll("[data-record-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.recordMode = button.dataset.recordMode;
      record();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-record-emotion]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedEmotion = button.dataset.recordEmotion;
      record();
    });
  });
  document.querySelector("[data-record-more]")?.addEventListener("click", () => {
    const current = recordMoodChoices.findIndex((emotion) => emotion.id === state.selectedEmotion);
    state.selectedEmotion = recordMoodChoices[(current + 1) % recordMoodChoices.length].id;
    record();
  });
  document.querySelector("#range")?.addEventListener("input", (event) => {
    state.intensity = Number(event.target.value);
    document.querySelector("#intensityValue").textContent = `${state.intensity}%`;
  });
  document.querySelector("#note")?.addEventListener("input", (event) => {
    state.note = event.target.value;
    document.querySelector("#count").textContent = `${state.note.length}/200`;
  });
  document.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;
      state.tags = state.tags.includes(tag) ? state.tags.filter((item) => item !== tag) : [...state.tags, tag];
      button.classList.toggle("active");
    });
  });
  document.querySelector("#cancelEdit")?.addEventListener("click", () => {
    state.editingRecordIndex = null;
    state.note = "";
    state.recordMode = "history";
    record();
  });
  document.querySelector("#saveRecord")?.addEventListener("click", () => {
    const item = {
      id: Number.isInteger(state.editingRecordIndex) ? state.records[state.editingRecordIndex].id : createLocalId("record"),
      date: Number.isInteger(state.editingRecordIndex) ? state.records[state.editingRecordIndex].date : new Date().toISOString(),
      emotionId: state.selectedEmotion,
      intensity: state.intensity,
      note: state.note,
      tags: [...state.tags]
    };
    if (Number.isInteger(state.editingRecordIndex)) {
      state.records[state.editingRecordIndex] = item;
      state.selectedRecordIndex = state.editingRecordIndex;
      state.editingRecordIndex = null;
      showToast("기록을 수정했어요.");
    } else {
      state.records.unshift(item);
      state.selectedRecordIndex = 0;
      showToast("감정을 기록했어요.");
    }
    state.last = empathy(item);
    state.note = "";
    persist();
    state.recordMode = "ai";
    record();
  });
  document.querySelectorAll("[data-record-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecordIndex = Number(button.dataset.recordOpen);
      state.recordMode = "ai";
      record();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-record-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.recordEdit);
      const item = state.records[index];
      if (!item) return;
      state.editingRecordIndex = index;
      state.selectedEmotion = item.emotionId;
      state.intensity = item.intensity;
      state.note = item.note || "";
      state.tags = [...(item.tags || [])];
      state.recordMode = "entry";
      record();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-record-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.records.splice(Number(button.dataset.recordDelete), 1);
      state.selectedRecordIndex = 0;
      persist();
      record();
      showToast("기록을 삭제했어요.");
    });
  });
  document.querySelectorAll("[data-calendar-day]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarDay = Number(button.dataset.calendarDay);
      record();
    });
  });
  document.querySelectorAll("[data-record-month]").forEach((button) => {
    button.addEventListener("click", () => {
      showToast(button.dataset.recordMonth === "prev" ? "이전 달 더미 데이터를 준비 중이에요." : "다음 달 더미 데이터를 준비 중이에요.");
    });
  });
  document.querySelector("[data-record-share]")?.addEventListener("click", () => {
    showToast("공유용 메시지를 준비했어요.");
  });
  document.querySelector("#assistantSend")?.addEventListener("click", () => {
    const input = document.querySelector("#assistantInput");
    const text = input.value.trim();
    if (!text) {
      showToast("대화 내용을 입력해 주세요.");
      return;
    }
    const recordItem = getSelectedRecord();
    state.aiMessages.push({ id: createLocalId("msg"), role: "user", text, recordId: recordItem?.id, createdAt: new Date().toISOString() });
    state.aiMessages.push({ id: createLocalId("msg"), role: "assistant", text: buildAiReply(recordItem, text), recordId: recordItem?.id, createdAt: new Date().toISOString() });
    persistAiMessages();
    record();
    showToast("AI 공감 답변을 만들었어요.");
  });
}

function record() {
  const panels = {
    entry: recordEntryPanel,
    history: recordHistoryPanel,
    ai: recordAiPanel,
    calendar: recordCalendarPanel
  };
  const isEntry = state.recordMode === "entry";
  const isAi = state.recordMode === "ai";
  const top = isEntry ? "" : isAi ? `
      <header class="record-sub-header">
        <button type="button" data-record-mode="entry" aria-label="기록으로 돌아가기"><img src="${R}record_icon_back_arrow.png" alt=""></button>
        <h1>기록 - AI 공감 메시지</h1>
        <div>
          <button type="button" data-record-mode="calendar" aria-label="캘린더"><img src="${H}icon_calendar_purple_unified.png" alt=""></button>
          <button type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("record")}" alt=""></button>
        </div>
      </header>
    ` : `
      <header class="record-history-header">
        <h1>기록</h1>
        <div>
          <button type="button" data-record-mode="calendar" aria-label="캘린더"><img src="${H}icon_calendar_purple_unified.png" alt=""></button>
          <button type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("record")}" alt=""></button>
        </div>
      </header>
    `;
  app.innerHTML = `
    <section class="record-page record-${state.recordMode}">
      ${top}
      ${isEntry ? "" : recordModeNav()}
      ${panels[state.recordMode]?.() || recordEntryPanel()}
    </section>
  `;
  bindNav();
  bindRecordInteractions();
}

function result(recordItem) {
  const message = state.last || empathy(recordItem);
  const emotion = getEmotion(recordItem.emotionId);
  app.innerHTML = `
    <section class="result">
      <div class="cloud-wrap">${cloud()}</div>
      <p class="eyebrow">AI 공감 메시지</p>
      <h1>${message.title}</h1>
      <div class="result-emotion">
        <div class="badge">${emotion.emoji}</div>
        <div><b>${emotion.label}</b><br><span>강도 ${recordItem.intensity}%</span></div>
      </div>
      <p class="ai">${message.body}</p>
      <div class="action"><b>작은 행동 제안</b><span>${message.action}</span></div>
      <div class="two">
        <button class="secondary" type="button" data-go="record">다시 기록</button>
        <button class="primary" type="button" data-go="home">홈으로</button>
      </div>
    </section>
  `;
  bindNav();
}

function helpLegacy() {
  app.innerHTML = `
    <section class="care-hero">
      <div><h1>필요한 도움을<br>바로 찾아요</h1><p class="muted">상담, 휴식, 위기 지원을 한곳에 모았어요.</p></div>
      ${cloud()}
    </section>
    <section class="care-grid">
      ${[
        ["💬", "상담센터", "전문 상담사와 이야기해요"],
        ["🧘", "마음 챙김", "명상과 호흡으로 쉬어가기"],
        ["🎧", "집중 타이머", "짧은 몰입 루틴 만들기"],
        ["🌙", "수면 체크", "오늘 밤 회복을 준비해요"],
        ["📚", "시험기간 모드", "스트레스 관리 플랜"],
        ["🆘", "위기 지원", "힘들 때 도움 받기"]
      ].map((item) => `<article class="care-card"><div class="ico">${item[0]}</div><b>${item[1]}</b><span>${item[2]}</span></article>`).join("")}
    </section>
  `;
}

const helpCenters = [
  {
    name: "강남구정신건강복지센터",
    distance: "1.2km",
    address: "서울 강남구 선릉로 123, 강남구보건소 3층",
    phone: "02-123-4567",
    hours: "평일 09:00 - 18:00",
    services: ["상담서비스", "정신건강검진", "사례관리", "교육 및 프로그램", "+1"],
    rating: "4.8",
    reviews: "23"
  },
  {
    name: "서초구정신건강복지센터",
    distance: "3.6km",
    address: "서울 서초구 반포대로 58, 서초구보건소 4층",
    phone: "02-987-6543",
    hours: "평일 09:00 - 18:00",
    services: ["상담서비스", "위기지원", "가족지원", "마음건강교육"],
    rating: "4.7",
    reviews: "18"
  },
  {
    name: "송파구정신건강복지센터",
    distance: "5.8km",
    address: "서울 송파구 송파대로 201, 송파구보건지소 2층",
    phone: "02-555-7890",
    hours: "평일 09:00 - 18:00",
    services: ["상담서비스", "정신건강검진", "사례관리", "집단프로그램", "+1"],
    rating: "4.6",
    reviews: "12"
  }
];

function helpTop(title, backMode = "") {
  return `
    <header class="help-top">
      ${backMode ? `<button class="help-icon-button" type="button" data-help-mode="${backMode}" aria-label="뒤로"><img src="${HP}help_back_arrow_green.png" alt=""></button>` : `<h1>도움</h1>`}
      ${title ? `<strong>${title}</strong>` : ""}
      <button class="help-icon-button" type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("help")}" alt=""></button>
    </header>
  `;
}

function serviceTags(tags) {
  return tags.map((tag) => `<span>${tag}</span>`).join("");
}

function helpCenterCard(center, index) {
  return `
    <article class="help-center-card reveal-unit" style="--reveal-delay:${index * 70}ms">
      <button class="help-center-main" type="button" data-help-center="${index}">
        <span class="help-distance">내 위치에서 ${center.distance}</span>
        <b>${center.name}</b>
        <p>${center.address}</p>
        <div class="help-meta"><span>☎ ${center.phone}</span><span>◷ ${center.hours}</span></div>
        <small>주요 서비스</small>
        <div class="help-tags">${serviceTags(center.services)}</div>
      </button>
      <button class="help-route-button" type="button" data-help-route="${index}" aria-label="${center.name} 길찾기">
        <img src="${HP}help_location_pin_green.png" alt="">
        <span>길찾기</span>
      </button>
      <button class="help-chevron" type="button" data-help-center="${index}" aria-label="${center.name} 상세 보기">›</button>
    </article>
  `;
}

function helpMain() {
  return `
    ${helpTop("", "")}
    <section class="help-hero reveal-unit">
      <img src="${HP}귀여운_구름_캐릭터와_미니멀_디자인.png" alt="">
      <div>
        <h2>지금, 혼자가 아니에요</h2>
        <p>힘든 순간에도 도움을 요청하면 당신은 더 안전해질 수 있어요.</p>
        <button type="button" data-help-toast="괜찮지 않을 때 바로 연락할 수 있게 준비해둘게요.">괜찮지 않을 때, 여기 연락하세요</button>
      </div>
    </section>

    <section class="help-section reveal-unit" style="--reveal-delay:60ms">
      <h2>지금 바로 도움받기</h2>
      <div class="help-hotline-card">
        <button type="button" data-help-toast="1393 정신건강 상담전화를 연결할 수 있게 준비 중이에요.">
          <span>☎</span><b>24시간 전화 상담</b><strong>1393</strong><small>정신건강 상담전화</small>
        </button>
        <button type="button" data-help-toast="#1388 청소년 상담 문자를 연결할 수 있게 준비 중이에요.">
          <span>💬</span><b>24시간 문자 상담</b><strong>#1388</strong><small>청소년 상담 문자</small>
        </button>
        <button type="button" data-help-toast="위급하면 즉시 112 또는 119에 연락해야 해요.">
          <span>🚨</span><b>긴급 상황 도움</b><strong>112 / 119</strong><small>위급할 때 즉시 연락</small>
        </button>
      </div>
    </section>

    <section class="help-section reveal-unit" style="--reveal-delay:120ms">
      <h2>마음이 힘들 때, 이야기해요</h2>
      <div class="help-talk-grid">
        <button class="help-talk-card" type="button" data-help-toast="익명 채팅 상담 기능은 더미 상담 플로우로 연결될 예정이에요.">
          <b>익명 채팅 상담</b>
          <span>전문 상담사와 익명으로 대화할 수 있어요.</span>
          <i>채팅 상담 시작하기 ›</i>
        </button>
        <button class="help-talk-card" type="button" data-help-toast="전화 상담 예약 요청을 저장했어요.">
          <b>전화 상담 예약</b>
          <span>상담사와 통화 상담을 예약할 수 있어요.</span>
          <i>전화 상담 예약하기 ›</i>
        </button>
      </div>
    </section>

    <section class="help-section reveal-unit" style="--reveal-delay:180ms">
      <h2>더 많은 도움처</h2>
      <div class="help-resource-list">
        <button type="button" data-help-mode="centers"><span>💚</span><b>정신건강복지센터 찾기</b><em>내 주변 센터 위치와 프로그램을 확인해보세요.</em><i>›</i></button>
        <button type="button" data-help-toast="청소년 상담복지센터 목록 화면을 준비했어요."><span>⌂</span><b>청소년 상담복지센터</b><em>청소년을 위한 상담과 다양한 지원을 받을 수 있어요.</em><i>›</i></button>
        <button type="button" data-help-toast="자살예방 상담전화 정보를 열었어요."><span>👥</span><b>자살예방 상담전화</b><em>삶이 힘들고 지칠 때, 24시간 전문가와 상담하세요.</em><i>›</i></button>
        <button type="button" data-help-toast="마음 건강 정보를 모아볼 수 있게 준비 중이에요."><span>▤</span><b>유용한 정보</b><em>마음 건강 관리에 도움이 되는 정보를 확인해보세요.</em><i>›</i></button>
      </div>
    </section>

    <section class="help-emergency-banner reveal-unit" style="--reveal-delay:240ms">
      <span>🛡</span>
      <div><b>지금 당장 안전이 위협받고 있나요?</b><p>주저하지 말고 112 또는 119에 전화하세요.</p></div>
      <button type="button" data-help-toast="긴급 전화는 실제 위급 상황에서 바로 이용해야 해요.">긴급 전화하기</button>
    </section>
  `;
}

function helpCenterList() {
  return `
    ${helpTop("정신건강복지센터 찾기", "main")}
    <p class="help-lead">내 주변 정신건강복지센터의 위치와 연락처, 제공 서비스를 확인할 수 있어요.</p>
    <section class="help-location-bar reveal-unit">
      <img src="${HP}help_location_pin_green.png" alt="">
      <b>내 위치: 서울특별시 강남구 역삼동</b>
      <button type="button" data-help-toast="위치 변경은 더미 위치 선택으로 준비했어요.">내 위치 변경</button>
    </section>
    <section class="help-search-card reveal-unit" style="--reveal-delay:60ms">
      <label class="help-search">
        <span>⌕</span>
        <input type="search" placeholder="지역명 또는 기관명 검색">
      </label>
      <div class="help-filters">
        <button class="active" type="button" data-help-toast="전체 센터를 보여주고 있어요.">전체⌄</button>
        <button type="button" data-help-toast="서울특별시로 필터링했어요.">서울특별시⌄</button>
        <button type="button" data-help-toast="10km 이내로 필터링했어요.">10km 이내⌄</button>
        <button type="button" data-help-toast="운영중 센터만 표시했어요.">운영중⌄</button>
      </div>
    </section>
    <section class="help-center-list">
      ${helpCenters.map(helpCenterCard).join("")}
    </section>
    <section class="help-note reveal-unit">
      <span>ⓘ</span>
      <p>정신건강복지센터는 지역별로 운영시간과 제공 서비스가 다를 수 있어요. 방문 전 전화로 확인해 주세요.</p>
    </section>
  `;
}

function helpCenterDetail() {
  const center = helpCenters[state.helpCenterIndex] || helpCenters[0];
  return `
    ${helpTop("센터 상세 정보", "centers")}
    <section class="help-detail-photo reveal-unit">
      <img src="${HP}help_center_building_photo_card.png" alt="">
      <span>1 / 5</span>
    </section>
    <section class="help-detail-card reveal-unit" style="--reveal-delay:60ms">
      <span class="help-distance">내 위치에서 ${center.distance}</span>
      <h2>${center.name}</h2>
      <div class="help-rating">★ ${center.rating} <span>(${center.reviews})</span></div>
      <div class="help-meta"><span>☎ ${center.phone}</span><span>◷ ${center.hours}</span></div>
      <p>${center.address}</p>
      <button class="copy-button" type="button" data-help-toast="주소를 복사했어요.">복사</button>
      <h3>주요 서비스</h3>
      <div class="help-tags">${serviceTags(center.services)}</div>
      <h3>센터 소개</h3>
      <p class="help-paragraph">정신건강 문제로 어려움을 겪고 있는 지역주민을 위해 상담, 검사, 교육, 사례관리 등 다양한 서비스를 제공하는 정신건강 전문기관입니다.</p>
      <button class="help-more" type="button" data-help-toast="센터 소개를 더 펼쳤어요.">더보기⌄</button>
    </section>
    <section class="help-info-grid reveal-unit" style="--reveal-delay:120ms">
      <h2>이용 안내</h2>
      <div><span>◷ 운영시간</span><b>평일 09:00 - 18:00<br>점심시간 12:00 - 13:00</b></div>
      <div><span>▣ 휴무일</span><b>토요일, 일요일, 공휴일</b></div>
      <div><span>♙ 대상</span><b>강남구 주민 누구나</b></div>
      <div><span>ⓦ 이용료</span><b>무료</b></div>
    </section>
    <section class="help-review-card reveal-unit" style="--reveal-delay:180ms">
      <div class="section-row"><h2>이용자 후기 (${center.reviews})</h2><button type="button" data-help-toast="전체 후기를 준비했어요.">전체 보기 ›</button></div>
      <article><b>따뜻한 봄날</b><span>2025.04.12</span><p>상담 선생님께서 정말 친절하게 들어주셨어요. 덕분에 마음이 많이 편안해졌습니다.</p></article>
      <article><b>햇살가득</b><span>2025.03.25</span><p>검사부터 상담까지 체계적으로 도와주셔서 좋았습니다.</p></article>
    </section>
    <div class="help-sticky-actions">
      <button class="help-solid" type="button" data-help-mode="route">길찾기</button>
      <button class="help-outline" type="button" data-help-toast="${center.phone} 전화 연결을 준비했어요.">전화하기</button>
    </div>
  `;
}

function helpRoute() {
  const center = helpCenters[state.helpCenterIndex] || helpCenters[0];
  return `
    ${helpTop("길찾기", "detail")}
    <section class="help-route-search reveal-unit">
      <div><span></span><b>내 위치</b></div>
      <div><span></span><b>${center.name}</b></div>
    </section>
    <section class="help-transport reveal-unit" style="--reveal-delay:60ms">
      ${[
        ["자동차", "7분"],
        ["대중교통", "18분"],
        ["도보", "22분"],
        ["자전거", "8분"]
      ].map((item, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-help-toast="${item[0]} 경로로 변경했어요."><span>${["🚗", "🚌", "🚶", "🚲"][index]}</span><b>${item[0]}</b><em>${item[1]}</em></button>`).join("")}
    </section>
    <section class="help-map-card reveal-unit" style="--reveal-delay:120ms">
      <img src="${HP}help_map_route_panel.png" alt="지도 경로">
      <button class="map-locate" type="button" data-help-toast="현재 위치를 다시 잡았어요.">⌾</button>
    </section>
    <section class="help-route-summary reveal-unit" style="--reveal-delay:180ms">
      <h2>7분 <span>(2.1km)</span></h2>
      <p>테헤란로 이용</p>
      <small>실시간 교통상황을 반영한 빠른 경로예요.</small>
    </section>
    <section class="help-route-steps reveal-unit" style="--reveal-delay:240ms">
      <div class="section-row"><h2>상세 경로</h2><button type="button" data-help-toast="경로 목록을 접었어요.">⌄ ›</button></div>
      ${[
        ["출발", "내 위치에서 출발", "직진", "0m"],
        ["↰", "좌회전", "언주로 방향으로 좌회전", "350m"],
        ["↑", "직진", "테헤란로 방향으로 직진", "1.3km"],
        ["↱", "우회전", "선릉로 방향으로 우회전", "250m"],
        ["📍", `${center.name} 도착`, "목적지에 도착했습니다.", "150m"]
      ].map((step) => `<article><span>${step[0]}</span><div><b>${step[1]}</b><p>${step[2]}</p></div><em>${step[3]}</em></article>`).join("")}
    </section>
    <button class="help-navigation-start reveal-unit" type="button" data-help-toast="내비게이션 시작 더미 동작을 실행했어요.">➤ 내비게이션 시작</button>
    <button class="help-share-route reveal-unit" type="button" data-help-toast="경로 공유 링크를 만들었어요.">⌯ 경로 공유하기</button>
  `;
}

function bindHelpInteractions() {
  document.querySelectorAll("[data-help-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.helpMode = button.dataset.helpMode;
      help();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-help-center]").forEach((button) => {
    button.addEventListener("click", () => {
      state.helpCenterIndex = Number(button.dataset.helpCenter || 0);
      state.helpMode = "detail";
      help();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-help-route]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.helpCenterIndex = Number(button.dataset.helpRoute || 0);
      state.helpMode = "route";
      help();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-help-toast]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast(button.dataset.helpToast);
    });
  });
}

function help() {
  const screens = {
    main: helpMain,
    centers: helpCenterList,
    detail: helpCenterDetail,
    route: helpRoute
  };
  app.innerHTML = `<section class="help-page help-${state.helpMode}">${(screens[state.helpMode] || helpMain)()}</section>`;
  bindNav();
  bindHelpInteractions();
}

function mySummaryData() {
  const summary = recordSummary();
  const averagePercent = Math.round((summary.average / 5) * 100) || 68;
  return {
    total: summary.total,
    streak: getStreak(),
    averagePercent,
    focusTime: "4시간 25분",
    weekRecords: Math.max(12, state.records.slice(0, 7).length),
    moodLabel: "좋음",
    moodPercent: "76%",
    averageScore: Math.max(72, averagePercent),
    levelProgress: 68
  };
}

function myTop(title = "마이", backMode = "", right = "main") {
  return `
    <header class="my-top ${backMode ? "sub" : ""}">
      ${backMode
        ? `<button class="my-icon-button" type="button" data-my-mode="${backMode}" aria-label="뒤로가기"><img src="${H}icon_back_arrow.png" alt=""></button>`
        : `<h1>${title}</h1>`}
      ${backMode ? `<strong>${title}</strong>` : ""}
      ${right === "settings"
        ? `<button class="my-icon-button" type="button" data-my-mode="settings" aria-label="설정"><img src="${M}my_icon_settings_gear.png" alt=""></button>`
        : right === "notify"
          ? `<button class="my-icon-button" type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("home")}" alt=""></button>`
          : `<span></span>`}
      ${backMode ? "" : `<button class="my-icon-button" type="button" data-action="notify" aria-label="알림"><img src="${notificationIconSrc("home")}" alt=""></button>`}
    </header>
  `;
}

function myActivityItems() {
  return [
    { type: "emotion", icon: "my_icon_mood_smile_purple.png", title: "감정 기록을 완료했어요", meta: "오전 09:30 · 감정: 좋음 (76%)" },
    { type: "goal", icon: "my_icon_leaf_mint.png", title: "오늘의 목표 '산책 30분 하기' 달성!", meta: "오전 08:15" },
    { type: "ai", icon: "my_icon_chat_blue.png", title: "AI와 대화를 나눴어요", meta: "오전 07:45 · 주제: 불안감 해소 방법" },
    { type: "reward", icon: "my_icon_reward_star_badge.png", title: "연속 기록 보상 3일째!", meta: "오전 07:30 · 마음 동전 10개 획득" },
    { type: "emotion", icon: "emotion_icon_sad_pink.png", title: "감정 기록을 완료했어요", meta: "어제 오후 10:20 · 감정: 슬픔 (40%)", assetPath: R },
    { type: "ai", icon: "my_icon_chat_blue.png", title: "AI와 대화를 나눴어요", meta: "어제 오후 09:10 · 주제: 인간관계 고민" },
    { type: "goal", icon: "my_icon_leaf_mint.png", title: "오늘의 목표 '독서 20분 하기' 달성!", meta: "어제 오후 08:30" },
    { type: "reward", icon: "my_icon_reward_star_badge.png", title: "새로운 배지 '꾸준한 시작' 획득!", meta: "어제 오후 06:15" }
  ];
}

function myMain() {
  const avatar = getMyAvatar();
  const data = mySummaryData();
  const meta = profileMeta();
  return `
    ${myTop("마이", "", "settings")}
    <section class="my-profile-dashboard">
      <img class="my-card-bg" src="${M}my_profile_dashboard_card.png" alt="" aria-hidden="true">
      <button class="my-avatar-large" type="button" data-my-mode="profile" aria-label="프로필 관리">
        <img src="${M}${avatar.asset}" alt="" aria-hidden="true">
      </button>
      <div class="my-profile-copy">
        <h2>${escapeHtml(state.myProfile.name)}님 <span>💜</span></h2>
        <p>${meta ? `${escapeHtml(meta)} · ` : ""}마음을 성장시키는 중이에요!</p>
        <div class="my-level-row"><b>Lv. 3</b><span>마음 성장 중</span><em>다음 레벨까지 120 EXP</em></div>
      </div>
      <div class="my-dashboard-stats">
        <article><img src="${M}my_icon_streak_fire.png" alt="" aria-hidden="true"><b>${data.streak}일 연속<br>기록</b></article>
        <article><img src="${M}my_icon_calendar_lavender.png" alt="" aria-hidden="true"><span>총 기록일</span><b>${data.total + 27}일</b></article>
        <article><img src="${M}my_icon_star_purple.png" alt="" aria-hidden="true"><span>나의 별명</span><b>따뜻한 구름</b></article>
      </div>
    </section>

    <section class="my-reward-strip">
      <img src="${M}my_reward_banner_gift.png" alt="" aria-hidden="true">
      <div><b>연속 기록 3일째! 👏</b><span>꾸준한 기록이 변화를 만들어요</span></div>
      <button type="button" data-go="reward">보상 확인하기 ›</button>
    </section>

    <section class="my-section-card">
      <div class="my-section-head"><h2>나의 요약</h2><button type="button" data-my-mode="recent">더보기 ›</button></div>
      <div class="my-summary-grid">
        <article><img src="${M}my_icon_mood_smile_purple.png" alt="" aria-hidden="true"><span>오늘의 감정</span><b>${data.moodLabel}<br><em>${data.moodPercent}</em></b></article>
        <article><img src="${M}my_icon_heart_pink.png" alt="" aria-hidden="true"><span>이번 주 평균 감정</span><b>보통 이상<br><em>${data.averagePercent}%</em></b></article>
        <article><img src="${M}my_icon_leaf_mint.png" alt="" aria-hidden="true"><span>이번 주 집중 시간</span><b>${data.focusTime}</b></article>
        <article><img src="${M}my_icon_pencil_yellow.png" alt="" aria-hidden="true"><span>이번 주 기록 수</span><b>${data.weekRecords}회</b></article>
      </div>
    </section>

    <section class="my-section-card">
      <div class="my-section-head"><h2>최근 활동</h2><button type="button" data-my-mode="recent">전체 보기 ›</button></div>
      <div class="my-activity-list compact">
        ${myActivityItems().slice(0, 3).map((item) => `
          <button class="my-activity-row" type="button" data-my-toast="${item.title}">
            <img src="${item.assetPath || M}${item.icon}" alt="" aria-hidden="true">
            <div><b>${item.title}</b><span>${item.meta}</span></div>
            <i>›</i>
          </button>
        `).join("")}
      </div>
    </section>

    <section class="my-section-card my-stat-card">
      <div class="my-section-head"><h2>나의 통계</h2><button type="button" data-my-toast="통계 상세 화면은 Supabase 연결 후 확장할게요.">더보기 ›</button></div>
      <div class="my-stat-summary">
        <span><small>총 기록일</small><b>${data.total + 27}일</b></span>
        <span><small>가장 많이 느낀 감정</small><b>좋음 🙂</b></span>
        <span><small>평균 감정 점수</small><b>${data.averageScore}점</b></span>
      </div>
      <img src="${M}my_statistics_chart_card.png" alt="감정 변화 그래프">
    </section>
  `;
}

function mySettings() {
  const rows = [
    ["profile", "my_icon_mood_smile_purple.png", "프로필 관리", "닉네임, 프로필 이미지 변경", "profile"],
    ["email", "my_icon_chat_blue.png", "이메일 변경", "현재 이메일: jimin@email.com", ""],
    ["password", "my_icon_settings_gear.png", "비밀번호 변경", "보안을 위해 주기적으로 변경해요", ""],
    ["delete", "my_icon_reward_star_badge.png", "계정 삭제", "모든 데이터를 삭제하고 탈퇴합니다", ""]
  ];
  const prefs = [
    ["push", "푸시 알림", "감정 기록, 리마인드 알림을 받아요"],
    ["encouragement", "격려 메시지 알림", "따뜻한 응원 메시지를 받아요"],
    ["reminder", "리마인드 알림", `기록 시간 알림을 받아요 · ${state.myPreferences.reminderTime}`],
    ["weeklyReport", "주간 리포트 알림", "주간 감정 리포트를 받아요"]
  ];
  return `
    ${myTop("설정", "main")}
    <button class="my-settings-profile" type="button" data-my-mode="profile">
      <img src="${M}${getMyAvatar().asset}" alt="" aria-hidden="true">
      <div><b>${escapeHtml(state.myProfile.name)}님 💜</b><span>${profileMeta() || "마음을 성장시키는 중이에요!"}</span></div>
      <i>›</i>
    </button>

    <section class="my-settings-section">
      <h2>계정 설정</h2>
      <div class="my-settings-card">
        ${rows.map((item) => `
          <button class="my-settings-row" type="button" ${item[4] ? `data-my-mode="${item[4]}"` : `data-my-toast="${item[2]} 준비 중이에요."`}>
            <img src="${M}${item[1]}" alt="" aria-hidden="true">
            <div><b>${item[2]}</b><span>${item[3]}</span></div>
            <i>›</i>
          </button>
        `).join("")}
      </div>
    </section>

    <section class="my-settings-section">
      <h2>알림 설정</h2>
      <div class="my-settings-card">
        ${prefs.map((item) => `
          <button class="my-settings-row" type="button" data-my-toggle="${item[0]}">
            <img src="${H}icon_bell_purple.png" alt="" aria-hidden="true">
            <div><b>${item[1]}</b><span>${item[2]}</span></div>
            <span class="my-switch ${state.myPreferences[item[0]] ? "on" : ""}"></span>
          </button>
        `).join("")}
      </div>
    </section>

    <section class="my-settings-section">
      <h2>화면 및 사용자 설정</h2>
      <div class="my-settings-card">
        <button class="my-settings-row" type="button" data-my-toast="현재 라이트 모드예요."><img src="${M}my_icon_color_palette.png" alt="" aria-hidden="true"><div><b>테마 모드</b><span>${state.myPreferences.theme === "light" ? "라이트 모드" : "다크 모드"}</span></div><i>›</i></button>
        <button class="my-settings-row" type="button" data-my-toast="현재 글자 크기는 ${state.myPreferences.fontSize}이에요."><img src="${M}my_icon_pencil_yellow.png" alt="" aria-hidden="true"><div><b>글자 크기</b><span>${state.myPreferences.fontSize}</span></div><i>›</i></button>
        <button class="my-settings-row" type="button" data-my-mode="profile"><img src="${M}my_icon_color_palette.png" alt="" aria-hidden="true"><div><b>앱 컬러 테마</b><span>퍼플 (기본)</span></div><i>›</i></button>
      </div>
    </section>

    <section class="my-settings-section">
      <h2>기타</h2>
      <div class="my-settings-card">
        <button class="my-settings-row" type="button" id="showOnboarding"><img src="${M}my_icon_chat_blue.png" alt="" aria-hidden="true"><div><b>온보딩 다시 보기</b><span>처음 안내 화면을 다시 확인해요</span></div><i>›</i></button>
        <button class="my-settings-row" type="button" data-my-toast="BrainFit Campus 버전 1.0.0"><img src="${M}my_icon_settings_gear.png" alt="" aria-hidden="true"><div><b>앱 정보</b><span>버전 1.0.0</span></div><i>›</i></button>
      </div>
    </section>
  `;
}

function myRecent() {
  const visibleItems = myActivityItems().filter((item) => state.myActivityFilter === "all" || item.type === state.myActivityFilter);
  const countByType = (type) => myActivityItems().filter((item) => item.type === type).length;
  return `
    ${myTop("최근 활동", "main")}
    <nav class="my-filter-tabs" aria-label="최근 활동 필터">
      ${myActivityFilters.map((item) => `<button class="${state.myActivityFilter === item[0] ? "active" : ""}" type="button" data-my-filter="${item[0]}">${item[1]}</button>`).join("")}
    </nav>
    <section class="my-activity-summary">
      <article><img src="${M}my_icon_pencil_yellow.png" alt="" aria-hidden="true"><span>감정 기록</span><b>${state.records.length}회</b></article>
      <article><img src="${M}my_icon_goal_target_green.png" alt="" aria-hidden="true"><span>목표 달성</span><b>${countByType("goal") + 12}회</b></article>
      <article><img src="${M}my_icon_chat_blue.png" alt="" aria-hidden="true"><span>AI 대화</span><b>${Math.max(12, state.aiMessages.length)}회</b></article>
      <article><img src="${M}my_icon_reward_star_badge.png" alt="" aria-hidden="true"><span>보상 획득</span><b>${Object.keys(state.rewardClaims).length + 8}회</b></article>
    </section>
    <section class="my-activity-group">
      <h2>오늘 · 6월 9일 (화)</h2>
      ${visibleItems.slice(0, 4).map((item) => `
        <button class="my-activity-row" type="button" data-my-toast="${item.title}">
          <img src="${item.assetPath || M}${item.icon}" alt="" aria-hidden="true">
          <div><b>${item.title}</b><span>${item.meta}</span></div>
          <i>›</i>
        </button>
      `).join("")}
    </section>
    <section class="my-activity-group">
      <h2>어제 · 6월 8일 (월)</h2>
      ${visibleItems.slice(4).map((item) => `
        <button class="my-activity-row" type="button" data-my-toast="${item.title}">
          <img src="${item.assetPath || M}${item.icon}" alt="" aria-hidden="true">
          <div><b>${item.title}</b><span>${item.meta}</span></div>
          <i>›</i>
        </button>
      `).join("") || `<p class="muted">선택한 필터의 활동이 아직 없어요.</p>`}
    </section>
  `;
}

function myProfileEdit() {
  const avatar = getMyAvatar();
  const currentAge = profileAge();
  return `
    ${myTop("프로필 관리", "main")}
    <section class="my-profile-editor">
      <div class="my-profile-editor-head">
        <img src="${M}${avatar.asset}" alt="" aria-hidden="true">
        <div><h2>${escapeHtml(state.myProfile.name)}님 💜</h2><p>${profileMeta() || "마음을 성장시키는 중이에요!"}</p></div>
      </div>
      <label><span>닉네임</span><input id="myName" value="${escapeHtml(state.myProfile.name)}" maxlength="12"></label>
      <label><span>생년월일</span><input id="myBirth" value="${escapeHtml(state.myProfile.birth)}"></label>
      <label><span>나이</span><input id="myAge" inputmode="numeric" value="${escapeHtml(currentAge)}" maxlength="3"></label>
      <div class="my-gender-row">
        <span>성별</span>
        ${["여성", "남성", "비공개"].map((item) => `<button class="${state.myProfile.gender === item ? "active" : ""}" type="button" data-my-gender="${item}">${item}</button>`).join("")}
      </div>
      <label><span>거주 지역</span><input id="myRegion" value="${escapeHtml(state.myProfile.region)}"></label>
      <label><span>한 줄 소개</span><textarea id="myBio" maxlength="80">${escapeHtml(state.myProfile.bio)}</textarea></label>
    </section>

    <section class="my-profile-palette">
      <h2>프로필 이미지</h2>
      <div class="my-avatar-options">
        ${myAvatarOptions.map((item) => `<button class="${state.myProfile.avatar === item.id ? "active" : ""}" type="button" data-my-avatar="${item.id}" aria-label="${item.label}"><img src="${M}${item.asset}" alt=""></button>`).join("")}
      </div>
    </section>

    <section class="my-profile-palette">
      <h2>테마 색상</h2>
      <div class="my-color-options">
        ${myThemeColors.map((color) => `<button class="${state.myPreferences.color === color ? "active" : ""} ${color === "rainbow" ? "rainbow" : ""}" style="${color === "rainbow" ? "" : `--swatch:${color}`}" type="button" data-my-color="${color}" aria-label="${color}"></button>`).join("")}
      </div>
      <div class="my-theme-preview">
        <span><img src="${M}${avatar.asset}" alt="" aria-hidden="true">안녕하세요! 오늘은 어떠셨나요? 💜</span>
        <b>좋은 하루였어요! 🙂</b>
      </div>
    </section>

    <button class="my-save-button" id="saveMyProfile" type="button">저장하기</button>
  `;
}

function bindMyInteractions() {
  document.querySelectorAll("[data-my-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.myMode = button.dataset.myMode;
      my();
      app.scrollTop = 0;
    });
  });
  document.querySelectorAll("[data-my-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.myActivityFilter = button.dataset.myFilter;
      my();
    });
  });
  document.querySelectorAll("[data-my-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.myToggle;
      state.myPreferences[key] = !state.myPreferences[key];
      persistMy();
      my();
      showToast(state.myPreferences[key] ? "알림을 켰어요." : "알림을 껐어요.");
    });
  });
  document.querySelectorAll("[data-my-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      state.myProfile.avatar = button.dataset.myAvatar;
      persistMy();
      my();
    });
  });
  document.querySelectorAll("[data-my-gender]").forEach((button) => {
    button.addEventListener("click", () => {
      state.myProfile.gender = button.dataset.myGender;
      persistMy();
      my();
    });
  });
  document.querySelectorAll("[data-my-color]").forEach((button) => {
    button.addEventListener("click", () => {
      state.myPreferences.color = button.dataset.myColor;
      persistMy();
      my();
    });
  });
  document.querySelectorAll("[data-my-toast]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.myToast));
  });
  document.querySelector("#showOnboarding")?.addEventListener("click", () => {
    state.onboardStep = 0;
    state.onboardDirection = "forward";
    setView("onboard");
  });
  document.querySelector("#saveMyProfile")?.addEventListener("click", () => {
    state.myProfile = {
      ...state.myProfile,
      name: document.querySelector("#myName")?.value.trim() || defaultMyProfile.name,
      birth: document.querySelector("#myBirth")?.value.trim() || state.myProfile.birth,
      age: document.querySelector("#myAge")?.value.trim() || ageFromBirth(document.querySelector("#myBirth")?.value.trim()) || state.myProfile.age,
      region: document.querySelector("#myRegion")?.value.trim() || state.myProfile.region,
      bio: document.querySelector("#myBio")?.value.trim() || state.myProfile.bio
    };
    persistMy();
    state.myMode = "main";
    my();
    showToast("프로필을 저장했어요.");
  });
}

function my() {
  const screens = {
    main: myMain,
    settings: mySettings,
    recent: myRecent,
    profile: myProfileEdit
  };
  app.innerHTML = `<section class="my-page my-${state.myMode}">${(screens[state.myMode] || myMain)()}</section>`;
  bindNav();
  bindMyInteractions();
}

async function bootAuthSession() {
  if (!supabase) {
    clearSupabaseAuthentication();
    render();
    return;
  }

  const { data, error } = await getAuthSession();
  const session = error ? null : data?.session;
  if (session?.user) {
    markSupabaseAuthenticated();
    if (state.view === "onboard" || state.view === "login" || state.view === "signup") {
      state.view = forceOnboarding ? "onboard" : "home";
    }
    await hydrateFromRemoteDatabase(session.user.id);
    queueSupabaseSync("session_restore");
    render();
  } else {
    clearSupabaseAuthentication();
    if (!["onboard", "login", "signup"].includes(state.view)) {
      state.view = forceSignup ? "signup" : "onboard";
    }
    render();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      markSupabaseAuthenticated();
      if (event === "SIGNED_IN") {
        queueSupabaseSync("auth_state_change");
      }
      return;
    }
    if (event === "SIGNED_OUT") {
      clearSupabaseAuthentication();
      state.view = "onboard";
      render();
    }
  });
}

function render() {
  const featureViews = ["chat", "goal", "routine"];
  const hiddenTabs = ["onboard", "login", "signup", "homeDetail", "notifications", ...featureViews];
  app.classList.remove("screen");
  void app.offsetWidth;
  app.classList.add("screen");
  tabbar.hidden = hiddenTabs.includes(state.view) || (state.view === "my" && state.myMode === "profile");
  app.classList.toggle("is-onboard", state.view === "onboard");
  app.classList.toggle("is-login", state.view === "login");
  app.classList.toggle("is-signup", state.view === "signup");
  app.classList.toggle("is-home", state.view === "home");
  app.classList.toggle("is-detail", state.view === "homeDetail");
  app.classList.toggle("is-reward", state.view === "reward");
  app.classList.toggle("is-record", state.view === "record");
  app.classList.toggle("is-help", state.view === "help");
  app.classList.toggle("is-my", state.view === "my");
  app.classList.toggle("is-notification", state.view === "notifications");
  app.classList.toggle("is-feature", featureViews.includes(state.view));
  updateTabs();
  if (state.view === "onboard") onboard();
  if (state.view === "login") login();
  if (state.view === "signup") signup();
  if (state.view === "home") home();
  if (state.view === "homeDetail") homeDetail();
  if (state.view === "reward") reward();
  if (state.view === "notifications") notifications();
  if (featureViews.includes(state.view)) featurePage(state.view);
  if (state.view === "record") record();
  if (state.view === "help") help();
  if (state.view === "my") my();
  renderToast();
}

tabs.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "record") {
      state.recordMode = "entry";
    }
    if (button.dataset.view === "my") {
      state.myMode = "main";
    }
    setView(button.dataset.view);
  });
});

bootAuthSession();
