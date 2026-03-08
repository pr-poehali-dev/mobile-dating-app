import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/dcc4a778-17c7-45ec-852d-e33e9dfca067";
const EVENTS_API = "https://functions.poehali.dev/d96b64ca-2040-4622-b117-56ddc9e53d3b";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Еда и напитки": "☕", "Природа": "🌿", "Искусство": "🎨",
  "Спорт": "💪", "Игры": "🎲", "Музыка": "🎵", "Кино": "🎬",
};
const EVENT_CATEGORIES = ["Еда и напитки", "Природа", "Искусство", "Спорт", "Игры", "Музыка", "Кино"];

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Сегодня, ${timeStr}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Завтра, ${timeStr}`;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${timeStr}`;
}

const IMAGES = {
  cafe: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/7eb6cfed-5273-4431-b132-b70f6e94f58f.jpg",
  picnic: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/31a90bea-97a7-482c-bf32-30cce5733e0e.jpg",
  gallery: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/8a60a20f-4101-4930-a784-a3955187d721.jpg",
  yoga: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/c6770b84-b63f-498b-8402-3562da9864ad.jpg",
  games: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/36fe8273-cd8a-4e91-a854-23caa0d018a4.jpg",
  walk: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/3b2e907c-1ea6-481c-acce-c71694704701.jpg",
  cinema: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/53d70f00-f81b-4e9b-90d9-12aee0431ec2.jpg",
  cafeJoin: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/4ea0564e-049c-48ba-b0e4-2b2da88c0691.jpg",
};

const CATEGORIES = ["Все", "Сегодня", "Завтра", "Еда", "Спорт", "Искусство", "Игры"];

const INTERESTS = ["☕ Кофе", "🎵 Музыка", "📚 Книги", "🧘 Йога", "🎨 Искусство", "🌿 Природа", "🍕 Еда", "🎲 Игры", "🎬 Кино", "🚴 Велосипед", "✈️ Путешествия", "🐾 Животные"];

const GOAL_LABELS = {
  couple: { label: "Ищу пару", className: "goal-couple" },
  friends: { label: "Ищу друзей", className: "goal-friends" },
  company: { label: "Просто компания", className: "goal-company" },
};

type Screen = "welcome" | "feed" | "create" | "detail" | "chats" | "profile" | "requests" | "chat-detail" | "onboarding-phone" | "onboarding-profile";
type Goal = "couple" | "friends" | "company";

const MOCK_CHATS = [
  { id: 1, eventTitle: "Завтрак в любимом кафе", time: "Сегодня, 10:00", lastMsg: "Отлично, буду ждать у входа!", unread: 1, avatar: "М", name: "Маша" },
  { id: 2, eventTitle: "Пикник в Сокольниках", time: "Завтра, 14:00", lastMsg: "Можешь взять плед, у меня не хватает", unread: 0, avatar: "Д", name: "Дима" },
];

const MOCK_MESSAGES = [
  { id: 1, text: "Привет! Рада, что ты откликнулся 😊", mine: false, time: "10:30" },
  { id: 2, text: "Привет! Очень интересное событие, с удовольствием", mine: true, time: "10:32" },
  { id: 3, text: "Буду у кафе в 10 ровно", mine: false, time: "10:33" },
  { id: 4, text: "Отлично, буду ждать у входа!", mine: false, time: "10:33" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<"feed" | "chats" | "profile">("feed");
  const [activeFilter, setActiveFilter] = useState("Сегодня");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [respondMessage, setRespondMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [selectedGoal, setSelectedGoal] = useState<Goal>("friends");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [userName, setUserName] = useState("");
  const [userBirthday, setUserBirthday] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [appReady, setAppReady] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myEvents, setMyEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [participatingEvents, setParticipatingEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eventDetail, setEventDetail] = useState<any>(null);
  const [eventDetailLoading, setEventDetailLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eventResponses, setEventResponses] = useState<any[]>([]);
  const [respondLoading, setRespondLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  // Create event state
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createPlace, setCreatePlace] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createMaxPeople, setCreateMaxPeople] = useState(2);
  const [createGoal, setCreateGoal] = useState<Goal>("friends");
  const [createLoading, setCreateLoading] = useState("");

  // Check saved token on mount
  useEffect(() => {
    const saved = localStorage.getItem("povod_token");
    if (saved) {
      setAuthToken(saved);
      fetch(`${API_URL}/profile`, {
        headers: { "X-Auth-Token": saved },
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.name) {
            setUserName(data.name);
            setScreen("feed");
            setActiveTab("feed");
          } else if (data && !data.name) {
            setScreen("onboarding-profile");
          } else {
            localStorage.removeItem("povod_token");
            setAuthToken("");
            setScreen("welcome");
          }
        })
        .catch(() => {
          localStorage.removeItem("povod_token");
          setAuthToken("");
          setScreen("welcome");
        })
        .finally(() => setAppReady(true));
    } else {
      setAppReady(true);
    }
  }, []);

  const navigate = useCallback((s: Screen, tab?: "feed" | "chats" | "profile") => {
    const needsAuth: Screen[] = ["feed", "chats", "profile"];
    if (needsAuth.includes(s) && !authToken && !localStorage.getItem("povod_token")) {
      setScreen("welcome");
      return;
    }
    setScreen(s);
    if (tab) setActiveTab(tab);
  }, [authToken]);

  const handleTabPress = (tab: "feed" | "chats" | "profile") => {
    if (!authToken && !localStorage.getItem("povod_token")) {
      setScreen("welcome");
      return;
    }
    setActiveTab(tab);
    setScreen(tab === "feed" ? "feed" : tab === "chats" ? "chats" : "profile");
  };

  const handleSendCode = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (data.ok) {
        setCodeSent(true);
        if (data.debug_code) setDebugCode(String(data.debug_code));
      } else {
        setAuthError(data.error || "Не удалось отправить код");
      }
    } catch {
      setAuthError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), code }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem("povod_token", data.token);
        setAuthToken(data.token);
        setDebugCode("");
        if (data.has_profile) {
          setScreen("feed");
          setActiveTab("feed");
        } else {
          setScreen("onboarding-profile");
        }
      } else {
        setAuthError(data.error || "Неверный код");
      }
    } catch {
      setAuthError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const token = authToken || localStorage.getItem("povod_token") || "";
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify({
          name: userName,
          birthday: userBirthday,
          interests: selectedInterests,
          goal: selectedGoal,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setScreen("feed");
        setActiveTab("feed");
      } else {
        setAuthError(data.error || "Не удалось сохранить профиль");
      }
    } catch {
      setAuthError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = authToken || localStorage.getItem("povod_token") || "";
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "X-Auth-Token": token },
      });
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("povod_token");
    setAuthToken("");
    setCodeSent(false);
    setCode("");
    setPhone("");
    setDebugCode("");
    setScreen("welcome");
  };

  const getToken = () => authToken || localStorage.getItem("povod_token") || "";

  const loadFeed = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch(`${EVENTS_API}/feed`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch { /* ignore */ }
    setEventsLoading(false);
  };

  const loadEventDetail = async (id: number) => {
    setEventDetailLoading(true);
    try {
      const res = await fetch(`${EVENTS_API}/event/${id}`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.id) setEventDetail(data);
    } catch { /* ignore */ }
    setEventDetailLoading(false);
  };

  const loadMyEvents = async () => {
    try {
      const res = await fetch(`${EVENTS_API}/my`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.events) setMyEvents(data.events);
    } catch { /* ignore */ }
  };

  const loadParticipating = async () => {
    try {
      const res = await fetch(`${EVENTS_API}/participating`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.events) setParticipatingEvents(data.events);
    } catch { /* ignore */ }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.id) setUserProfile(data);
    } catch { /* ignore */ }
  };

  const loadEventResponses = async (eventId: number) => {
    try {
      const res = await fetch(`${EVENTS_API}/event/${eventId}/responses`, { headers: { "X-Auth-Token": getToken() } });
      const data = await res.json();
      if (data.responses) setEventResponses(data.responses);
    } catch { /* ignore */ }
  };

  const handleRespond = async (eventId: number) => {
    if (!respondMessage.trim()) return;
    setRespondLoading(true);
    try {
      const res = await fetch(`${EVENTS_API}/event/${eventId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
        body: JSON.stringify({ message: respondMessage }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowRespondModal(false);
        setRespondMessage("");
        if (eventDetail) loadEventDetail(eventId);
        loadFeed();
      } else {
        setAuthError(data.error || "Ошибка отклика");
      }
    } catch { setAuthError("Ошибка сети"); }
    setRespondLoading(false);
  };

  const handleCancelResponse = async (eventId: number) => {
    try {
      await fetch(`${EVENTS_API}/event/${eventId}/respond`, {
        method: "DELETE",
        headers: { "X-Auth-Token": getToken() },
      });
      if (eventDetail) loadEventDetail(eventId);
      loadFeed();
    } catch { /* ignore */ }
  };

  const handleAcceptResponse = async (responseId: number, eventId: number) => {
    try {
      await fetch(`${EVENTS_API}/response/${responseId}/accept`, {
        method: "POST",
        headers: { "X-Auth-Token": getToken() },
      });
      loadEventResponses(eventId);
      loadMyEvents();
    } catch { /* ignore */ }
  };

  const handleRejectResponse = async (responseId: number, eventId: number) => {
    try {
      await fetch(`${EVENTS_API}/response/${responseId}/reject`, {
        method: "POST",
        headers: { "X-Auth-Token": getToken() },
      });
      loadEventResponses(eventId);
    } catch { /* ignore */ }
  };

  const handleCreateEvent = async () => {
    if (!createTitle || !createCategory || !createPlace || !createDate) {
      setAuthError("Заполните все обязательные поля");
      return;
    }
    setCreateLoading("creating");
    try {
      const res = await fetch(`${EVENTS_API}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
        body: JSON.stringify({
          title: createTitle, description: createDescription,
          category: createCategory, place: createPlace,
          event_date: createDate, max_people: createMaxPeople, goal: createGoal,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCreateTitle(""); setCreateDescription(""); setCreateCategory("");
        setCreatePlace(""); setCreateDate(""); setCreateMaxPeople(2); setCreateGoal("friends");
        navigate("feed", "feed");
        loadFeed();
      } else {
        setAuthError(data.error || "Ошибка создания");
      }
    } catch { setAuthError("Ошибка сети"); }
    setCreateLoading("");
  };

  // Load data when switching screens
  useEffect(() => {
    if (screen === "feed" && getToken()) loadFeed();
    if (screen === "profile" && getToken()) { loadMyEvents(); loadParticipating(); loadProfile(); }
  }, [screen]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setMessages(prev => [...prev, { id: prev.length + 1, text: chatMessage, mine: true, time: "сейчас" }]);
      setChatMessage("");
    }
  };

  const toggleInterest = (i: string) => {
    setSelectedInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 5 ? [...prev, i] : prev
    );
  };

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>

      {/* ── WELCOME SCREEN ─────────────────────────────────── */}
      {screen === "welcome" && (
        <WelcomeScreen
          onRegister={() => { setAuthError(""); setScreen("onboarding-phone"); }}
          onLogin={() => { setAuthError(""); setScreen("onboarding-phone"); }}
        />
      )}

      {/* ── ONBOARDING: PHONE ──────────────────────────────── */}
      {screen === "onboarding-phone" && (
        <div className="app-screen animate-fade-in" style={{ background: "var(--color-ivory)" }}>
          <div className="relative flex-shrink-0" style={{ height: 280 }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(160deg, #2D5E5E 0%, #3D7A7A 50%, #E86A3D 100%)",
            }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
              <div style={{ fontSize: 64, marginBottom: 12 }}>☕</div>
              <h1 className="text-3xl font-bold text-center leading-tight">Повод</h1>
              <p className="text-sm text-center mt-2 opacity-80">Находи людей рядом через общие события</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-6 pt-8">
            <h2 className="text-2xl font-bold text-teal mb-1">Войти или создать аккаунт</h2>
            <p className="text-sm text-muted-foreground mb-6">Введите номер телефона — это быстро и безопасно</p>

            <div className="flex gap-2 mb-4">
              <div className="card-float px-4 py-3.5 flex items-center" style={{ width: 72 }}>
                <span className="text-sm font-semibold text-teal">+7</span>
              </div>
              <input
                type="tel"
                placeholder="999 000 00 00"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1 card-float px-4 py-3.5 text-sm font-medium outline-none bg-white"
                style={{ borderRadius: 20 }}
              />
            </div>

            {codeSent && (
              <div className="mb-4 animate-fade-in">
                <p className="text-xs text-muted-foreground mb-2">Введите код из SMS</p>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full card-float px-4 py-3.5 text-center text-lg font-bold tracking-widest outline-none bg-white"
                  style={{ borderRadius: 20 }}
                  maxLength={6}
                />
                {debugCode && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Код для тестирования: <span className="font-bold text-teal">{debugCode}</span>
                  </p>
                )}
              </div>
            )}

            {authError && (
              <p className="text-xs text-red-500 text-center mb-2">{authError}</p>
            )}

            {!codeSent ? (
              <button
                className="btn-primary w-full mt-2"
                disabled={authLoading || !phone.trim()}
                style={{ opacity: authLoading || !phone.trim() ? 0.5 : 1 }}
                onClick={handleSendCode}
              >
                {authLoading ? "..." : "Получить код"}
              </button>
            ) : (
              <button
                className="btn-primary w-full mt-2"
                disabled={authLoading || !code.trim()}
                style={{ opacity: authLoading || !code.trim() ? 0.5 : 1 }}
                onClick={handleVerifyCode}
              >
                {authLoading ? "..." : "Войти"}
              </button>
            )}

            <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
              Продолжая, вы соглашаетесь с{" "}
              <span className="text-teal font-medium underline">условиями использования</span>{" "}
              и{" "}
              <span className="text-teal font-medium underline">политикой конфиденциальности</span>
            </p>
          </div>
        </div>
      )}

      {/* ── ONBOARDING: PROFILE ────────────────────────────── */}
      {screen === "onboarding-profile" && (
        <div className="app-screen animate-fade-in" style={{ overflowY: "auto" }}>
          <div className="flex items-center gap-3 p-4 pt-6">
            <button onClick={() => navigate("onboarding-phone")} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
              <Icon name="ChevronLeft" size={20} className="text-teal" />
            </button>
            <h1 className="text-xl font-bold text-teal">Расскажите о себе</h1>
          </div>

          <div className="px-5 pb-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2"
                style={{ background: "linear-gradient(135deg, #2D5E5E, #E86A3D)" }}>
                {userName ? userName[0].toUpperCase() : "?"}
              </div>
              <button className="text-xs font-medium text-mandarin">Добавить фото</button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Имя</label>
                <input
                  type="text"
                  placeholder="Как тебя зовут?"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white"
                  style={{ borderRadius: 20 }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Дата рождения</label>
                <input
                  type="date"
                  value={userBirthday}
                  onChange={e => setUserBirthday(e.target.value)}
                  className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white"
                  style={{ borderRadius: 20 }}
                />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-teal mb-3 uppercase tracking-wide">Интересы — выбери до 5</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`chip ${selectedInterests.includes(i) ? "chip-active" : "chip-inactive"}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-500 text-center mb-3">{authError}</p>
            )}

            <button
              className="btn-primary w-full"
              disabled={authLoading || !userName || !userBirthday || selectedInterests.length === 0}
              style={{ opacity: (userName && userBirthday && selectedInterests.length > 0 && !authLoading) ? 1 : 0.5 }}
              onClick={handleSaveProfile}
            >
              {authLoading ? "..." : "Начать"} 🎉
            </button>
          </div>
        </div>
      )}

      {/* ── FEED ──────────────────────────────────────────── */}
      {screen === "feed" && (
        <div className="app-screen">
          <div className="flex-shrink-0 px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Москва</p>
              <h1 className="text-2xl font-bold text-teal">Повod</h1>
            </div>
            <button onClick={() => { setAuthError(""); navigate("create"); }} className="btn-primary flex items-center gap-2 py-2.5 px-4">
              <Icon name="Plus" size={16} />
              Создать
            </button>
          </div>

          <div className="flex-shrink-0 px-5 mb-3">
            <div className="flex gap-2 overflow-x-auto scroll-hidden">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setActiveFilter(c)} className={`chip flex-shrink-0 ${activeFilter === c ? "chip-active" : "chip-inactive"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 pb-4 space-y-4">
            {eventsLoading && events.length === 0 && (
              <>{[1,2,3].map(i => (
                <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ height: 280, background: "rgba(45,94,94,0.06)" }} />
              ))}</>
            )}

            {!eventsLoading && events.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🌅</div>
                <p className="font-bold text-teal text-lg">Пока нет событий</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">Станьте первым — создайте событие и найдите компанию</p>
                <button onClick={() => navigate("create")} className="btn-primary inline-flex items-center gap-2">
                  <Icon name="Plus" size={16} /> Создать событие
                </button>
              </div>
            )}

            {events.map((event, idx) => (
              <div
                key={event.id}
                className="animate-card-enter"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both", opacity: 0 }}
                onClick={() => { loadEventDetail(event.id); navigate("detail"); }}
              >
                <EventCard event={event} onRespond={() => { setEventDetail(event); setShowRespondModal(true); }} />
              </div>
            ))}
            <div style={{ height: 80 }} />
          </div>

          <TabBar active={activeTab} onPress={handleTabPress} />
        </div>
      )}

      {/* ── EVENT DETAIL ──────────────────────────────────── */}
      {screen === "detail" && (
        <div className="app-screen animate-slide-up">
          {eventDetailLoading && !eventDetail && (
            <div className="flex-1 flex items-center justify-center"><div className="text-4xl animate-pulse">☕</div></div>
          )}
          {eventDetail && (
          <>
          <div className="flex-1 overflow-y-auto scroll-hidden">
            <div className="relative" style={{ height: 300 }}>
              {eventDetail.photo_url ? (
                <img src={eventDetail.photo_url} alt={eventDetail.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
                  <span style={{ fontSize: 64, opacity: 0.3 }}>{CATEGORY_EMOJIS[eventDetail.category] || "✨"}</span>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />
              <button onClick={() => navigate("feed", "feed")} className="absolute top-5 left-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                <Icon name="ChevronLeft" size={20} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className={`goal-badge ${GOAL_LABELS[eventDetail.goal as Goal]?.className || "goal-friends"} mb-2 inline-block`} style={{ background: "rgba(255,255,255,0.9)" }}>
                  {GOAL_LABELS[eventDetail.goal as Goal]?.label || "Компания"}
                </span>
                <h1 className="text-white font-bold text-2xl leading-tight">{eventDetail.title}</h1>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="card-float p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,106,61,0.12)" }}>
                    <Icon name="Clock" size={16} className="text-mandarin" />
                  </div>
                  <div><p className="text-xs text-muted-foreground">Время</p><p className="text-sm font-semibold text-teal">{formatEventDate(eventDetail.event_date)}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
                    <Icon name="MapPin" size={16} className="text-teal" />
                  </div>
                  <div><p className="text-xs text-muted-foreground">Место</p><p className="text-sm font-semibold text-teal">{eventDetail.place}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
                    <Icon name="Users" size={16} className="text-teal" />
                  </div>
                  <div><p className="text-xs text-muted-foreground">Участники</p><p className="text-sm font-semibold text-teal">{eventDetail.joined} из {eventDetail.max_people}</p></div>
                </div>
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Организатор</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
                    {eventDetail.creator?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-teal">{eventDetail.creator?.name}{eventDetail.creator?.age ? `, ${eventDetail.creator.age}` : ""}</p>
                    <span className={`goal-badge ${GOAL_LABELS[eventDetail.goal as Goal]?.className || "goal-friends"}`}>{GOAL_LABELS[eventDetail.goal as Goal]?.label || "Компания"}</span>
                  </div>
                </div>
              </div>

              {eventDetail.description && (
                <div className="card-float p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Описание</p>
                  <p className="text-sm leading-relaxed text-teal">{eventDetail.description}</p>
                </div>
              )}

              {eventDetail.participants?.length > 0 && (
                <div className="card-float p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Уже участвуют</p>
                  <div className="flex gap-2">
                    {eventDetail.participants.map((p: { name: string; photo_url?: string }, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-white" style={{ background: "linear-gradient(135deg, #E86A3D, #c4562f)" }}>
                          {p.name?.[0] || "?"}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ height: 100 }} />
            </div>
          </div>

          <div className="flex-shrink-0 px-5 py-4" style={{ background: "var(--color-ivory)", borderTop: "1px solid rgba(45,94,94,0.08)" }}>
            {eventDetail.is_mine ? (
              <div className="rounded-2xl px-4 py-3.5 text-center text-sm font-semibold" style={{ background: "rgba(45,94,94,0.08)", color: "var(--color-teal)" }}>Это ваше событие</div>
            ) : eventDetail.my_status === "accepted" ? (
              <div className="rounded-2xl px-4 py-3.5 text-center text-sm font-semibold text-white" style={{ background: "var(--color-teal)" }}>Вы участвуете ✓</div>
            ) : eventDetail.my_status === "pending" ? (
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3.5 text-center text-sm font-semibold" style={{ background: "rgba(45,94,94,0.08)", color: "var(--color-teal)" }}>⏳ Ожидает</div>
                <button onClick={() => handleCancelResponse(eventDetail.id)} className="px-4 py-3.5 rounded-2xl text-sm font-medium text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>Отменить</button>
              </div>
            ) : (
              <button className="btn-primary w-full py-4 text-base" onClick={() => setShowRespondModal(true)}>Откликнуться ✨</button>
            )}
          </div>
          </>
          )}
        </div>
      )}

      {/* ── RESPOND MODAL ─────────────────────────────────── */}
      {showRespondModal && eventDetail && (
        <div
          className="absolute inset-0 z-50 flex items-end animate-fade-in"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowRespondModal(false)}
        >
          <div
            className="w-full rounded-t-3xl p-5 animate-slide-up"
            style={{ background: "var(--color-ivory)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(45,94,94,0.2)" }} />
            <h3 className="text-xl font-bold text-teal mb-1">Написать организатору</h3>
            <p className="text-sm text-muted-foreground mb-4">Расскажите пару слов о себе — это поможет начать разговор</p>
            <textarea
              className="w-full rounded-2xl p-4 text-sm font-medium outline-none resize-none"
              style={{ background: "white", border: "1.5px solid rgba(45,94,94,0.12)", minHeight: 100, color: "var(--color-teal)" }}
              placeholder="Привет! Я слышал о вашем событии и очень хотел бы..."
              value={respondMessage}
              onChange={e => setRespondMessage(e.target.value)}
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button className="btn-ghost flex-1" onClick={() => setShowRespondModal(false)}>Отмена</button>
              <button
                className="btn-primary flex-1"
                style={{ opacity: respondMessage.trim() ? 1 : 0.5 }}
                disabled={respondLoading}
                onClick={() => handleRespond(eventDetail.id)}
              >
                {respondLoading ? "..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE EVENT ──────────────────────────────────── */}
      {screen === "create" && (
        <div className="app-screen animate-slide-up">
          <div className="flex items-center gap-3 px-5 pt-6 pb-3 flex-shrink-0">
            <button onClick={() => navigate("feed", "feed")} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
              <Icon name="X" size={20} className="text-teal" />
            </button>
            <h1 className="text-xl font-bold text-teal">Новое событие</h1>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 pb-4 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Название события</label>
                <input type="text" placeholder="Например: Утренний кофе в кафе на Марксе" value={createTitle} onChange={e => setCreateTitle(e.target.value)} className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white" style={{ borderRadius: 20 }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Описание</label>
                <textarea placeholder="Расскажите о себе и о том, что планируете" value={createDescription} onChange={e => setCreateDescription(e.target.value)} className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none resize-none bg-white" style={{ borderRadius: 20, minHeight: 80 }} rows={3} />
              </div>
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Место</label>
                <input type="text" placeholder="Адрес или название места" value={createPlace} onChange={e => setCreatePlace(e.target.value)} className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white" style={{ borderRadius: 20 }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Дата и время</label>
                <input type="datetime-local" value={createDate} onChange={e => setCreateDate(e.target.value)} className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white" style={{ borderRadius: 20 }} />
              </div>

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCreateCategory(c)} className={`chip text-xs ${createCategory === c ? "chip-active" : "chip-inactive"}`}>
                      {CATEGORY_EMOJIS[c] || ""} {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Цель встречи</label>
                <div className="flex gap-2">
                  {(["couple", "friends", "company"] as Goal[]).map(g => (
                    <button key={g} onClick={() => setCreateGoal(g)} className="flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                      style={{ background: createGoal === g ? (g === "couple" ? "var(--color-mandarin)" : "var(--color-teal)") : "rgba(45,94,94,0.08)", color: createGoal === g ? "white" : "var(--color-teal)" }}>
                      {GOAL_LABELS[g].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Максимум участников</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 10].map(n => (
                    <button key={n} onClick={() => setCreateMaxPeople(n)} className={`w-10 h-10 rounded-xl text-sm font-bold chip ${createMaxPeople === n ? "chip-active" : "chip-inactive"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>

            {authError && <p className="text-xs text-red-500 text-center">{authError}</p>}
            <div style={{ height: 80 }} />
          </div>

          <div className="flex-shrink-0 px-5 py-4" style={{ background: "var(--color-ivory)", borderTop: "1px solid rgba(45,94,94,0.08)" }}>
            <button className="btn-primary w-full py-4 text-base" disabled={!!createLoading} onClick={handleCreateEvent}>
              {createLoading ? "Публикуем..." : "Опубликовать событие"}
            </button>
          </div>
        </div>
      )}

      {/* ── CHATS ─────────────────────────────────────────── */}
      {screen === "chats" && (
        <div className="app-screen">
          <div className="px-5 pt-6 pb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-teal">Чаты</h1>
            <p className="text-sm text-muted-foreground">Ваши активные события</p>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 space-y-3 pb-4">
            {MOCK_CHATS.map((chat, idx) => (
              <div
                key={chat.id}
                className="card-float p-4 flex items-center gap-3 cursor-pointer transition-transform animate-card-enter"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both", opacity: 0 }}
                onClick={() => { setSelectedChat(chat); navigate("chat-detail"); }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
                  {chat.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-teal text-sm">{chat.name}</p>
                    {chat.unread > 0 && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold"
                        style={{ background: "var(--color-mandarin)" }}>
                        {chat.unread}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 truncate">{chat.eventTitle}</p>
                  <p className="text-xs font-medium truncate text-teal">{chat.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>

          <TabBar active={activeTab} onPress={handleTabPress} />
        </div>
      )}

      {/* ── CHAT DETAIL ───────────────────────────────────── */}
      {screen === "chat-detail" && selectedChat && (
        <div className="app-screen animate-slide-up">
          <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0" style={{ background: "var(--color-ivory)", borderBottom: "1px solid rgba(45,94,94,0.08)" }}>
            <button onClick={() => navigate("chats", "chats")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
              <Icon name="ChevronLeft" size={20} className="text-teal" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-teal text-sm">{selectedChat.name}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedChat.eventTitle}</p>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1" style={{ background: "rgba(232,106,61,0.1)", color: "var(--color-mandarin)" }}>
              <Icon name="Map" size={14} />
              Маршрут
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 flex-shrink-0" style={{ background: "rgba(45,94,94,0.05)" }}>
            <Icon name="Clock" size={12} className="text-teal" />
            <p className="text-xs font-medium text-teal">{selectedChat.time}</p>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 py-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-xs px-4 py-3 text-sm font-medium leading-relaxed"
                  style={{
                    borderRadius: m.mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                    background: m.mine ? "var(--color-teal)" : "white",
                    color: m.mine ? "white" : "var(--color-teal)",
                    boxShadow: "0 2px 8px rgba(45,94,94,0.08)"
                  }}
                >
                  {m.text}
                  <p className="text-xs mt-1 opacity-60 text-right">{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3" style={{ background: "var(--color-ivory)", borderTop: "1px solid rgba(45,94,94,0.08)" }}>
            <input
              type="text"
              placeholder="Написать сообщение..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSendMessage()}
              className="flex-1 rounded-2xl px-4 py-3 text-sm font-medium outline-none"
              style={{ background: "white", border: "1.5px solid rgba(45,94,94,0.12)" }}
            />
            <button
              onClick={handleSendMessage}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: chatMessage.trim() ? "var(--color-mandarin)" : "rgba(45,94,94,0.15)" }}
            >
              <Icon name="Send" size={18} className={chatMessage.trim() ? "text-white" : "text-teal"} />
            </button>
          </div>
        </div>
      )}

      {/* ── PROFILE ───────────────────────────────────────── */}
      {screen === "profile" && (
        <div className="app-screen">
          <div className="flex-1 overflow-y-auto scroll-hidden pb-4">
            <div className="relative" style={{ height: 180 }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #2D5E5E 0%, #E86A3D 100%)" }} />
              <div className="absolute inset-0 flex items-end p-5">
                <div className="flex items-end gap-4 w-full">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-3xl text-white"
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "3px solid rgba(255,255,255,0.4)" }}>
                    {userProfile?.name?.[0]?.toUpperCase() || userName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-xl">{userProfile?.name || userName || "Профиль"}</h2>
                    <p className="text-white text-xs opacity-80">{userProfile?.city || "Москва"}</p>
                  </div>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <Icon name="Settings" size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="card-float p-4 grid grid-cols-3 gap-0">
                {[
                  { label: "Создал", val: myEvents.length },
                  { label: "Участвую", val: participatingEvents.length },
                  { label: "Заявки", val: myEvents.reduce((s, e) => s + (e.pending_responses || 0), 0) },
                ].map((s, i) => (
                  <div key={s.label} className="text-center" style={{ borderRight: i < 2 ? "1px solid rgba(45,94,94,0.1)" : "none" }}>
                    <p className="text-2xl font-bold text-teal">{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {(userProfile?.interests?.length > 0) && (
                <div className="card-float p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Интересы</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.map((i: string) => (<span key={i} className="chip chip-inactive text-xs">{i}</span>))}
                  </div>
                </div>
              )}

              <div className="card-float p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Мои события</p>
                  {myEvents.some(e => e.pending_responses > 0) && (
                    <button onClick={() => { navigate("requests"); }} className="text-xs font-semibold text-mandarin">Заявки →</button>
                  )}
                </div>
                {myEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Пока нет событий</p>
                ) : (
                  <div className="space-y-3">
                    {myEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-3 cursor-pointer" onClick={() => { loadEventDetail(e.id); navigate("detail"); }}>
                        {e.photo_url ? (
                          <img src={e.photo_url} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt={e.title} />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
                            <span className="text-lg">{CATEGORY_EMOJIS[e.category] || "✨"}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-teal text-sm truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{formatEventDate(e.event_date)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {e.pending_responses > 0 && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: "var(--color-mandarin)" }}>{e.pending_responses}</div>
                          )}
                          <div className="text-xs font-semibold px-2 py-1 rounded-xl" style={{ background: "rgba(45,94,94,0.08)", color: "var(--color-teal)" }}>{e.joined}/{e.max_people}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Участвую</p>
                {participatingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Откликнитесь на событие из ленты</p>
                ) : (
                  <div className="space-y-3">
                    {participatingEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-3 cursor-pointer" onClick={() => { loadEventDetail(e.id); navigate("detail"); }}>
                        {e.photo_url ? (
                          <img src={e.photo_url} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt={e.title} />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #E86A3D, #c4562f)" }}>
                            <span className="text-lg">{CATEGORY_EMOJIS[e.category] || "✨"}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-teal text-sm truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{formatEventDate(e.event_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-red-400"
                style={{ background: "rgba(239,68,68,0.08)" }}
                onClick={handleLogout}
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>

          <TabBar active={activeTab} onPress={handleTabPress} />
        </div>
      )}

      {/* ── REQUESTS ──────────────────────────────────────── */}
      {screen === "requests" && (
        <div className="app-screen animate-slide-up">
          <div className="flex items-center gap-3 px-5 pt-6 pb-4 flex-shrink-0">
            <button onClick={() => navigate("profile", "profile")} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
              <Icon name="ChevronLeft" size={20} className="text-teal" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-teal">Заявки</h1>
              <p className="text-sm text-muted-foreground">На ваши события</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 space-y-4 pb-4">
            {myEvents.filter(e => e.pending_responses > 0).length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-bold text-teal">Пока нет заявок</p>
                <p className="text-sm text-muted-foreground mt-1">Как только кто-то откликнется — вы увидите это здесь</p>
              </div>
            )}
            {myEvents.filter(e => e.pending_responses > 0).map(ev => (
              <RequestsForEvent key={ev.id} event={ev} token={getToken()} onUpdate={() => { loadMyEvents(); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const HERO_IMAGE = "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/876fd82f-c497-4b03-8bae-b8d860d83ac4.jpg";

function WelcomeScreen({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  const [step, setStep] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgLoaded(true);
    img.src = HERO_IMAGE;
  }, []);

  useEffect(() => {
    if (!imgLoaded) return;
    const timers = [
      setTimeout(() => setStep(1), 100),
      setTimeout(() => setStep(2), 400),
      setTimeout(() => setStep(3), 700),
      setTimeout(() => setStep(4), 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [imgLoaded]);

  const PHRASES = [
    "Кофе вдвоём по воскресеньям",
    "Настолки с теми, кто рядом",
    "Прогулки без повода",
    "Вечера, которые запоминаются",
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseFade, setPhraseFade] = useState(true);

  useEffect(() => {
    if (step < 3) return;
    const interval = setInterval(() => {
      setPhraseFade(false);
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % PHRASES.length);
        setPhraseFade(true);
      }, 350);
    }, 3200);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="app-screen" style={{ position: "relative", overflow: "hidden", background: "#1a1a1a" }}>
      {/* Hero photo — full screen with ken burns */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: imgLoaded ? 1 : 0,
        transition: "opacity 1.2s ease-out",
      }}>
        <img
          src={HERO_IMAGE}
          alt=""
          style={{
            position: "absolute",
            width: "115%", height: "115%",
            top: "-5%", left: "-7.5%",
            objectFit: "cover",
            animation: imgLoaded ? "kenBurns 20s ease-in-out infinite alternate" : "none",
          }}
        />
      </div>

      {/* Gradient overlays */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(0,0,0,0.3) 70%),
          linear-gradient(to bottom, 
            rgba(0,0,0,0.08) 0%, 
            rgba(0,0,0,0) 20%, 
            rgba(0,0,0,0.04) 40%,
            rgba(0,0,0,0.55) 65%, 
            rgba(0,0,0,0.88) 85%, 
            rgba(0,0,0,0.95) 100%
          )
        `,
      }} />

      {/* Warm tint overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(232,106,61,0.08) 0%, transparent 50%, rgba(45,94,94,0.06) 100%)",
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        height: "100%",
      }}>
        {/* Top spacer + brand mark */}
        <div style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          padding: "max(16px, env(safe-area-inset-top)) 28px 0",
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "translateY(0)" : "translateY(-10px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
          }}>
            Знакомства нового формата
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom content area */}
        <div style={{ padding: "0 28px" }}>
          {/* Brand name */}
          <div style={{
            opacity: step >= 2 ? 1 : 0,
            transform: step >= 2 ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            marginBottom: 8,
          }}>
            <h1 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 62,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 0.95,
              margin: 0,
            }}>
              Povod
            </h1>
          </div>

          {/* Rotating phrase */}
          <div style={{
            height: 28,
            overflow: "hidden",
            marginBottom: 24,
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.01em",
              margin: 0,
              lineHeight: "28px",
              opacity: phraseFade ? 1 : 0,
              transform: phraseFade ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.35s ease",
            }}>
              {PHRASES[phraseIdx]}
            </p>
          </div>

          {/* Accent line */}
          <div style={{
            width: 40, height: 3, borderRadius: 2,
            background: "#E86A3D",
            marginBottom: 28,
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }} />

          {/* Buttons */}
          <div style={{
            paddingBottom: "max(28px, env(safe-area-inset-bottom))",
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <button
              onClick={onRegister}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 28,
                background: "#E86A3D",
                border: "none",
                color: "white",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(232,106,61,0.5), 0 2px 8px rgba(0,0,0,0.2)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              onTouchStart={e => (e.currentTarget.style.transform = "scale(0.97)")}
              onTouchEnd={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Начать знакомиться
              <span style={{ fontSize: 18 }}>→</span>
            </button>

            <button
              onClick={onLogin}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 28,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.9)",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "0.01em",
                cursor: "pointer",
                transition: "transform 0.15s ease, background 0.15s ease",
                display: "block",
              }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
              onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              Уже есть аккаунт
            </button>

            <p style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              marginTop: 14,
              lineHeight: 1.5,
              letterSpacing: "0.02em",
            }}>
              Нажимая, вы принимаете{" "}
              <span style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline", cursor: "pointer" }}>условия</span>{" "}
              и{" "}
              <span style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline", cursor: "pointer" }}>политику</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1.5%, -2%); }
        }
      `}</style>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EventCard({ event, onRespond }: { event: any, onRespond: () => void }) {
  const goal = event.goal as Goal;
  const statusLabel = event.my_status === "pending" ? "Ожидает" : event.my_status === "accepted" ? "Участвую" : null;
  return (
    <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 6px 28px rgba(45,94,94,0.1)" }}>
      <div className="relative" style={{ height: 220 }}>
        {event.photo_url ? (
          <img src={event.photo_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>{CATEGORY_EMOJIS[event.category] || "✨"}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }} />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl text-white" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            {event.category}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
            <p className="text-white text-xs opacity-80 mt-0.5">{formatEventDate(event.event_date)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
            {event.creator?.name?.[0] || "?"}
          </div>
          <div>
            <p className="font-semibold text-teal text-xs">{event.creator?.name}{event.creator?.age ? `, ${event.creator.age}` : ""}</p>
            <p className="text-xs text-muted-foreground truncate" style={{ maxWidth: 140 }}>{event.place}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`goal-badge ${GOAL_LABELS[goal]?.className || "goal-friends"} text-xs`}>
            {GOAL_LABELS[goal]?.label || "Компания"}
          </span>
          {!event.is_mine && (
            <button
              onClick={e => { e.stopPropagation(); onRespond(); }}
              className="py-2 px-4 rounded-2xl text-xs font-bold transition-all"
              style={{
                background: statusLabel ? "rgba(45,94,94,0.15)" : "var(--color-mandarin)",
                color: statusLabel ? "var(--color-teal)" : "white",
                boxShadow: statusLabel ? "none" : "0 3px 12px rgba(232,106,61,0.35)"
              }}
            >
              {statusLabel || "Пойду"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RequestsForEvent({ event, token, onUpdate }: { event: any, token: string, onUpdate: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [responses, setResponses] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${EVENTS_API}/event/${event.id}/responses`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(data => { if (data.responses) setResponses(data.responses); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [event.id, token]);

  const handleAction = async (respId: number, action: "accept" | "reject") => {
    await fetch(`${EVENTS_API}/response/${respId}/${action}`, { method: "POST", headers: { "X-Auth-Token": token } });
    setResponses(prev => prev.filter(r => r.id !== respId));
    onUpdate();
  };

  if (!loaded) return <div className="text-center py-4 text-muted-foreground text-sm">Загрузка...</div>;
  if (responses.length === 0) return null;

  return (
    <div className="card-float p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
          <span className="text-sm">{CATEGORY_EMOJIS[event.category] || "✨"}</span>
        </div>
        <div>
          <p className="font-bold text-teal text-sm">{event.title}</p>
          <p className="text-xs text-muted-foreground">{formatEventDate(event.event_date)}</p>
        </div>
      </div>
      <div className="space-y-3">
        {responses.map(r => (
          <div key={r.id} className="rounded-2xl p-3" style={{ background: "rgba(45,94,94,0.04)" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "var(--color-mandarin)" }}>
                {r.user?.name?.[0] || "?"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-teal text-sm">{r.user?.name}{r.user?.age ? `, ${r.user.age}` : ""}</p>
                <p className="text-xs leading-relaxed mt-0.5 text-muted-foreground">{r.message}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction(r.id, "accept")} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--color-teal)" }}>✓ Принять</button>
              <button onClick={() => handleAction(r.id, "reject")} className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>✕ Отклонить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBar({ active, onPress }: { active: string, onPress: (t: "feed" | "chats" | "profile") => void }) {
  const tabs = [
    { key: "feed" as const, label: "Лента", icon: "LayoutGrid" },
    { key: "chats" as const, label: "Чаты", icon: "MessageCircle" },
    { key: "profile" as const, label: "Профиль", icon: "User" },
  ];
  return (
    <div className="tab-bar flex-shrink-0">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onPress(t.key)}
          className={`tab-item ${active === t.key ? "active" : ""}`}
        >
          <Icon
            name={t.icon}
            size={22}
            className={active === t.key ? "text-mandarin" : "text-muted-foreground"}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: active === t.key ? "var(--color-mandarin)" : "var(--color-warm-gray)" }}
          >
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}