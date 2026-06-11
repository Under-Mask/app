import { supabase } from "./supabase.js";

const rewardTitles = {
  "3": ["마음 동전 10개", 10],
  "7": ["마음 동전 30개", 30],
  "14": ["마음 동전 70개", 70],
  "30": ["마음 동전 150개", 150],
  "60": ["스페셜 배지 꾸준한 마음", 0]
};

const defaultNotifications = [
  ["emotion-reminder", "감정 기록 리마인드", "오늘 기분을 짧게 남기면 연속 기록이 이어져요.", "record"],
  ["reward-ready", "보상 도착", "3일 연속 기록 보상을 받을 수 있어요.", "reward"],
  ["ai-support", "AI 응원 메시지", "지민님의 좋은 흐름을 이어갈 작은 루틴을 추천했어요.", "ai"]
];

function now() {
  return new Date().toISOString();
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

function appProfile(snapshot, userId) {
  return {
    device_id: snapshot.device_id,
    user_id: userId,
    display_name: snapshot.profile?.display_name || "지민",
    campus: snapshot.profile?.campus || null,
    avatar_asset: snapshot.profile?.avatar_asset || null,
    birth: snapshot.profile?.birth || null,
    age: Number(snapshot.profile?.age) || null,
    gender: snapshot.profile?.gender || null,
    region: snapshot.profile?.region || null,
    bio: snapshot.profile?.bio || null,
    updated_at: snapshot.updated_at || now()
  };
}

function appSettings(snapshot, userId) {
  return {
    device_id: snapshot.device_id,
    user_id: userId,
    coins: snapshot.coins || 0,
    daily_comment: snapshot.daily_comment || "",
    onboarding_completed: Boolean(snapshot.onboarding_completed),
    notifications_read: Boolean(snapshot.notifications_read),
    notification_origin: snapshot.notification_origin || {},
    my_preferences: snapshot.my_preferences || {},
    auth_mode: snapshot.auth_mode || null,
    updated_at: snapshot.updated_at || now()
  };
}

function emotionRecords(snapshot, userId) {
  return (snapshot.records || []).map((record) => compact({
    id: record.id,
    user_id: userId,
    device_id: snapshot.device_id,
    recorded_at: record.date,
    emotion_id: record.emotionId,
    intensity: record.intensity,
    note: record.note || "",
    tags: record.tags || [],
    source: "app",
    updated_at: snapshot.updated_at || now()
  }));
}

function userGoals(snapshot, userId) {
  return Object.entries(snapshot.goals || {}).map(([key, done]) => compact({
    id: `${snapshot.device_id}-goal-${key}`,
    user_id: userId,
    device_id: snapshot.device_id,
    task_key: key,
    title: key,
    is_done: Boolean(done),
    completed_at: done ? snapshot.updated_at || now() : null,
    updated_at: snapshot.updated_at || now()
  }));
}

function rewardClaims(snapshot, userId) {
  return Object.entries(snapshot.reward_claims || {}).map(([key, claimed]) => {
    const [title, coins] = rewardTitles[key] || [`${key}일 보상`, 0];
    return compact({
      id: `${snapshot.device_id}-reward-${key}`,
      user_id: userId,
      device_id: snapshot.device_id,
      reward_key: key,
      reward_title: title,
      claimed: Boolean(claimed),
      coins_awarded: claimed ? coins : 0,
      claimed_at: claimed ? snapshot.updated_at || now() : null,
      updated_at: snapshot.updated_at || now()
    });
  });
}

function aiConversations(snapshot, userId) {
  if (!(snapshot.ai_messages || []).length) return [];
  const recordId = snapshot.records?.[0]?.id || null;
  return [compact({
    id: `${snapshot.device_id}-ai-default`,
    user_id: userId,
    device_id: snapshot.device_id,
    record_id: recordId,
    title: "AI 공감 대화",
    updated_at: snapshot.updated_at || now()
  })];
}

function aiMessages(snapshot, userId) {
  const conversationId = `${snapshot.device_id}-ai-default`;
  const recordId = snapshot.records?.[0]?.id || null;
  return (snapshot.ai_messages || []).map((message, index) => compact({
    id: message.id || `${snapshot.device_id}-ai-${message.createdAt || index}-${index}`,
    conversation_id: conversationId,
    user_id: userId,
    device_id: snapshot.device_id,
    record_id: message.recordId || recordId,
    role: message.role === "assistant" ? "assistant" : "user",
    message: message.text || "",
    created_at: message.createdAt || snapshot.updated_at || now()
  }));
}

function notificationState(snapshot, userId) {
  return {
    device_id: snapshot.device_id,
    user_id: userId,
    read_all: Boolean(snapshot.notifications_read),
    last_read_at: snapshot.notifications_read ? snapshot.updated_at || now() : null,
    updated_at: snapshot.updated_at || now()
  };
}

function notificationEvents(snapshot, userId) {
  const displayName = snapshot.profile?.display_name || snapshot.my_profile?.name || "지민";
  return defaultNotifications.map(([id, title, body, category], index) => compact({
    id: `${snapshot.device_id}-notification-${id}`,
    user_id: userId,
    device_id: snapshot.device_id,
    category,
    title,
    body: String(body).replaceAll("지민님", `${displayName}님`).replaceAll("지민", displayName),
    is_read: Boolean(snapshot.notifications_read),
    created_at: new Date(Date.now() - index * 10 * 60 * 1000).toISOString(),
    updated_at: snapshot.updated_at || now()
  }));
}

function appState(snapshot, userId) {
  return {
    device_id: snapshot.device_id,
    user_id: userId,
    sync_reason: snapshot.sync_reason,
    records: snapshot.records || [],
    reward_claims: snapshot.reward_claims || {},
    goals: snapshot.goals || {},
    ai_messages: snapshot.ai_messages || [],
    coins: snapshot.coins || 0,
    daily_comment: snapshot.daily_comment || "",
    notifications_read: Boolean(snapshot.notifications_read),
    my_profile: snapshot.my_profile || {},
    my_preferences: snapshot.my_preferences || {},
    updated_at: snapshot.updated_at || now()
  };
}

async function upsertRows(table, rows, options = {}) {
  if (!supabase || !rows || (Array.isArray(rows) && !rows.length)) {
    return { table, skipped: true, error: null };
  }
  const payload = Array.isArray(rows) ? rows : [rows];
  const query = supabase.from(table).upsert(payload, options);
  const { error } = await query;
  return { table, count: payload.length, error };
}

export async function syncBrainfitDatabase(snapshot) {
  if (!supabase) return { skipped: true, results: [] };
  const userId = await currentUserId();
  const fullSnapshot = {
    ...snapshot,
    updated_at: snapshot.updated_at || now()
  };

  const profile = appProfile(fullSnapshot, userId);
  const results = [];
  results.push(await upsertRows("app_profiles", profile, { onConflict: "device_id" }));
  results.push(await upsertRows("app_settings", appSettings(fullSnapshot, userId), { onConflict: "device_id" }));
  results.push(await upsertRows("emotion_records", emotionRecords(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("user_goals", userGoals(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("reward_claims", rewardClaims(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("ai_conversations", aiConversations(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("ai_messages", aiMessages(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("notification_state", notificationState(fullSnapshot, userId), { onConflict: "device_id" }));
  results.push(await upsertRows("notification_events", notificationEvents(fullSnapshot, userId), { onConflict: "id" }));
  results.push(await upsertRows("brainfit_app_state", appState(fullSnapshot, userId), { onConflict: "device_id" }));

  return {
    skipped: false,
    results,
    errors: results.filter((result) => result.error)
  };
}

export async function loadBrainfitDatabase(deviceId, userId = null) {
  if (!supabase || !deviceId) return { data: null, error: null, skipped: true };
  let query = supabase
    .from("brainfit_app_state")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);

  query = userId ? query.eq("user_id", userId) : query.eq("device_id", deviceId);

  const { data, error } = await query.maybeSingle();
  return { data, error, skipped: false };
}
