import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

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

const EVENTS = [
  {
    id: 1,
    image: IMAGES.cafe,
    title: "Завтрак в любимом кафе",
    category: "Еда и напитки",
    categoryIcon: "Coffee",
    creator: { name: "Маша", age: 26, avatar: "М" },
    time: "Сегодня, 10:00",
    place: "Кафе «Утро», Пушкина 12",
    distance: "0.8 км",
    maxPeople: 2,
    joined: 0,
    goal: "couple" as const,
    description: "Ищу кого-то, с кем можно неспешно позавтракать, поговорить о чём угодно и выпить хороший кофе. Без суеты и спешки. Просто хорошее утро.",
    participants: [],
  },
  {
    id: 2,
    image: IMAGES.picnic,
    title: "Пикник в Сокольниках",
    category: "Природа",
    categoryIcon: "Trees",
    creator: { name: "Дима", age: 29, avatar: "Д" },
    time: "Завтра, 14:00",
    place: "Парк Сокольники, главная аллея",
    distance: "2.3 км",
    maxPeople: 4,
    joined: 2,
    goal: "friends" as const,
    description: "Беру плед, бутерброды и хорошее настроение. Буду рад компании! Можно брать друзей, собак и гитары.",
    participants: [{ name: "Аня", avatar: "А" }, { name: "Сеня", avatar: "С" }],
  },
  {
    id: 3,
    image: IMAGES.gallery,
    title: "Вернисаж в галерее Зотов",
    category: "Искусство",
    categoryIcon: "Palette",
    creator: { name: "Оля", age: 31, avatar: "О" },
    time: "Пятница, 19:00",
    place: "Галерея Зотов, Ходынская 2",
    distance: "3.1 км",
    maxPeople: 2,
    joined: 1,
    goal: "couple" as const,
    description: "Открытие новой выставки современного искусства. Хочу пойти вместе с кем-то, кому интересно обсудить работы. После — бокал вина в баре рядом.",
    participants: [],
  },
  {
    id: 4,
    image: IMAGES.yoga,
    title: "Утренняя йога на набережной",
    category: "Спорт",
    categoryIcon: "Heart",
    creator: { name: "Катя", age: 24, avatar: "К" },
    time: "Воскресенье, 08:30",
    place: "Набережная Тараса Шевченко",
    distance: "1.5 км",
    maxPeople: 6,
    joined: 3,
    goal: "company" as const,
    description: "Практикую хатха-йогу 3 года. Собираю небольшую группу для утренней практики. Уровень — начинающий и средний. Коврик желателен.",
    participants: [{ name: "Лена", avatar: "Л" }, { name: "Юля", avatar: "Ю" }, { name: "Паша", avatar: "П" }],
  },
  {
    id: 5,
    image: IMAGES.games,
    title: "Настолки дома",
    category: "Игры",
    categoryIcon: "Gamepad2",
    creator: { name: "Артём", age: 27, avatar: "А" },
    time: "Суббота, 17:00",
    place: "Жилой комплекс «Авеню», Сущёвский вал",
    distance: "4.2 км",
    maxPeople: 5,
    joined: 2,
    goal: "friends" as const,
    description: "Есть Wingspan, Catan, Dixit, Codenames. Буду рад новым игрокам! Сделаю пиццу. Опыт в настолках не обязателен.",
    participants: [{ name: "Рома", avatar: "Р" }, { name: "Ника", avatar: "Н" }],
  },
];

const CATEGORIES = ["Сегодня", "Завтра", "Рядом", "Еда", "Спорт", "Искусство", "Игры"];

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
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null);
  const [selectedChat, setSelectedChat] = useState<typeof MOCK_CHATS[0] | null>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [respondMessage, setRespondMessage] = useState("");
  const [respondedEvents, setRespondedEvents] = useState<Set<number>>(new Set());
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [selectedGoal, setSelectedGoal] = useState<Goal>("friends");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [userName, setUserName] = useState("");
  const [userBirthday, setUserBirthday] = useState("");

  const navigate = (s: Screen, tab?: "feed" | "chats" | "profile") => {
    setScreen(s);
    if (tab) setActiveTab(tab);
  };

  const handleTabPress = (tab: "feed" | "chats" | "profile") => {
    setActiveTab(tab);
    setScreen(tab === "feed" ? "feed" : tab === "chats" ? "chats" : "profile");
  };

  const handleRespond = (eventId: number) => {
    if (respondMessage.trim()) {
      setRespondedEvents(prev => new Set([...prev, eventId]));
      setShowRespondModal(false);
      setRespondMessage("");
    }
  };

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
          onRegister={() => navigate("onboarding-profile")}
          onLogin={() => navigate("onboarding-phone")}
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
              </div>
            )}

            {!codeSent ? (
              <button className="btn-primary w-full mt-2" onClick={() => setCodeSent(true)}>
                Получить код
              </button>
            ) : (
              <button
                className="btn-primary w-full mt-2"
                onClick={() => navigate("onboarding-profile")}
              >
                Войти
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

            <button
              className="btn-primary w-full"
              style={{ opacity: userName && userBirthday && selectedInterests.length > 0 ? 1 : 0.5 }}
              onClick={() => navigate("feed", "feed")}
            >
              Начать 🎉
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
              <h1 className="text-2xl font-bold text-teal">Повод</h1>
            </div>
            <button
              onClick={() => navigate("create")}
              className="btn-primary flex items-center gap-2 py-2.5 px-4"
            >
              <Icon name="Plus" size={16} />
              Создать
            </button>
          </div>

          <div className="flex-shrink-0 px-5 mb-3">
            <div className="flex gap-2 overflow-x-auto scroll-hidden">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveFilter(c)}
                  className={`chip flex-shrink-0 ${activeFilter === c ? "chip-active" : "chip-inactive"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-hidden px-5 pb-4 space-y-4">
            {EVENTS.map((event, idx) => (
              <div
                key={event.id}
                className="animate-card-enter"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both", opacity: 0 }}
                onClick={() => { setSelectedEvent(event); navigate("detail"); }}
              >
                <EventCard
                  event={event}
                  responded={respondedEvents.has(event.id)}
                  onRespond={() => { setSelectedEvent(event); setShowRespondModal(true); }}
                />
              </div>
            ))}
            <div style={{ height: 80 }} />
          </div>

          <TabBar active={activeTab} onPress={handleTabPress} />
        </div>
      )}

      {/* ── EVENT DETAIL ──────────────────────────────────── */}
      {screen === "detail" && selectedEvent && (
        <div className="app-screen animate-slide-up">
          <div className="flex-1 overflow-y-auto scroll-hidden">
            <div className="relative" style={{ height: 300 }}>
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)"
              }} />
              <button
                onClick={() => navigate("feed", "feed")}
                className="absolute top-5 left-5 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
              >
                <Icon name="ChevronLeft" size={20} className="text-white" />
              </button>
              <button
                className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
              >
                <Icon name="Share2" size={18} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className={`goal-badge ${GOAL_LABELS[selectedEvent.goal].className} mb-2 inline-block`}
                  style={{ background: "rgba(255,255,255,0.9)" }}>
                  {GOAL_LABELS[selectedEvent.goal].label}
                </span>
                <h1 className="text-white font-bold text-2xl leading-tight">{selectedEvent.title}</h1>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="card-float p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,106,61,0.12)" }}>
                    <Icon name="Clock" size={16} className="text-mandarin" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Время</p>
                    <p className="text-sm font-semibold text-teal">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
                    <Icon name="MapPin" size={16} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Место</p>
                    <p className="text-sm font-semibold text-teal">{selectedEvent.place}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,94,94,0.08)" }}>
                    <Icon name="Users" size={16} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Участники</p>
                    <p className="text-sm font-semibold text-teal">{selectedEvent.joined} из {selectedEvent.maxPeople}</p>
                  </div>
                </div>
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Организатор</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg"
                    style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
                    {selectedEvent.creator.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-teal">{selectedEvent.creator.name}, {selectedEvent.creator.age}</p>
                    <span className={`goal-badge ${GOAL_LABELS[selectedEvent.goal].className}`}>
                      {GOAL_LABELS[selectedEvent.goal].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Описание</p>
                <p className="text-sm leading-relaxed text-teal">{selectedEvent.description}</p>
              </div>

              {selectedEvent.participants.length > 0 && (
                <div className="card-float p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Уже участвуют</p>
                  <div className="flex gap-2">
                    {selectedEvent.participants.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-white"
                          style={{ background: "linear-gradient(135deg, #E86A3D, #c4562f)" }}>
                          {p.avatar}
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
            {respondedEvents.has(selectedEvent.id) ? (
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3.5 text-center text-sm font-semibold" style={{ background: "rgba(45,94,94,0.08)", color: "var(--color-teal)" }}>
                  ⏳ Ожидает подтверждения
                </div>
                <button className="px-4 py-3.5 rounded-2xl text-sm font-medium text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
                  Отменить
                </button>
              </div>
            ) : (
              <button
                className="btn-primary w-full py-4 text-base"
                onClick={() => setShowRespondModal(true)}
              >
                Откликнуться ✨
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── RESPOND MODAL ─────────────────────────────────── */}
      {showRespondModal && selectedEvent && (
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
                onClick={() => handleRespond(selectedEvent.id)}
              >
                Отправить
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
            <div
              className="rounded-3xl overflow-hidden flex items-center justify-center cursor-pointer"
              style={{ height: 180, background: "rgba(45,94,94,0.06)", border: "2px dashed rgba(45,94,94,0.2)" }}
            >
              <div className="text-center">
                <Icon name="ImagePlus" size={32} className="text-teal mx-auto mb-2" />
                <p className="text-sm font-medium text-teal">Добавить фото обложки</p>
                <p className="text-xs text-muted-foreground mt-0.5">Это первое, что увидят люди</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Название события", placeholder: "Например: Утренний кофе в кафе на Марксе", type: "text" },
                { label: "Описание", placeholder: "Расскажите о себе и о том, что планируете", type: "textarea" },
                { label: "Место", placeholder: "Адрес или название места", type: "text" },
                { label: "Дата и время", placeholder: "Когда встречаемся?", type: "datetime-local" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      placeholder={f.placeholder}
                      className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none resize-none bg-white"
                      style={{ borderRadius: 20, minHeight: 80 }}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full card-float px-4 py-3.5 text-sm font-medium outline-none bg-white"
                      style={{ borderRadius: 20 }}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {["Еда и напитки", "Природа", "Искусство", "Спорт", "Игры", "Музыка", "Кино"].map(c => (
                    <button key={c} className="chip chip-inactive text-xs">{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Цель встречи</label>
                <div className="flex gap-2">
                  {(["couple", "friends", "company"] as Goal[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGoal(g)}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                      style={{
                        background: selectedGoal === g
                          ? g === "couple" ? "var(--color-mandarin)" : "var(--color-teal)"
                          : "rgba(45,94,94,0.08)",
                        color: selectedGoal === g ? "white" : "var(--color-teal)"
                      }}
                    >
                      {GOAL_LABELS[g].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal mb-1.5 block uppercase tracking-wide">Максимум участников</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 10].map(n => (
                    <button key={n} className="w-10 h-10 rounded-xl text-sm font-bold chip chip-inactive">{n}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 80 }} />
          </div>

          <div className="flex-shrink-0 px-5 py-4" style={{ background: "var(--color-ivory)", borderTop: "1px solid rgba(45,94,94,0.08)" }}>
            <button className="btn-primary w-full py-4 text-base" onClick={() => navigate("feed", "feed")}>
              Опубликовать событие
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
                    А
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-xl">Алексей, 27</h2>
                    <p className="text-white text-xs opacity-80">Москва · На Поводе с марта 2026</p>
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
                  { label: "Создал", val: 2 },
                  { label: "Участвовал", val: 5 },
                  { label: "Откликов", val: 12 },
                ].map((s, i) => (
                  <div key={s.label} className="text-center" style={{ borderRight: i < 2 ? "1px solid rgba(45,94,94,0.1)" : "none" }}>
                    <p className="text-2xl font-bold text-teal">{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Интересы</p>
                <div className="flex flex-wrap gap-2">
                  {["☕ Кофе", "🎵 Музыка", "📚 Книги", "🌿 Природа"].map(i => (
                    <span key={i} className="chip chip-inactive text-xs">{i}</span>
                  ))}
                </div>
              </div>

              <div className="card-float p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Мои события</p>
                  <button onClick={() => navigate("requests")} className="text-xs font-semibold text-mandarin">Заявки →</button>
                </div>
                <div className="space-y-3">
                  {EVENTS.slice(0, 2).map(e => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => { setSelectedEvent(e); navigate("detail"); }}
                    >
                      <img src={e.image} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt={e.title} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-teal text-sm truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.time}</p>
                      </div>
                      <div className="text-xs font-semibold px-2 py-1 rounded-xl" style={{ background: "rgba(45,94,94,0.08)", color: "var(--color-teal)" }}>
                        {e.joined}/{e.maxPeople}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-float p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Участвую</p>
                <div className="space-y-3">
                  {EVENTS.slice(2, 4).map(e => (
                    <div key={e.id} className="flex items-center gap-3">
                      <img src={e.image} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt={e.title} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-teal text-sm truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-3.5 rounded-2xl text-sm font-semibold text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
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
            <div className="card-float p-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={IMAGES.cafe} className="w-12 h-12 rounded-2xl object-cover" alt="Event" />
                <div>
                  <p className="font-bold text-teal text-sm">Завтрак в любимом кафе</p>
                  <p className="text-xs text-muted-foreground">Сегодня, 10:00</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Вика", age: 24, avatar: "В", msg: "Привет! Очень хочу познакомиться, обожаю уютные завтраки ☕", color: "#E86A3D" },
                  { name: "Ира", age: 28, avatar: "И", msg: "Была бы рада составить компанию. Люблю долгие разговоры за кофе", color: "#2D5E5E" },
                ].map((a, i) => (
                  <div key={i} className="rounded-2xl p-3" style={{ background: "rgba(45,94,94,0.04)" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0"
                        style={{ background: a.color }}>
                        {a.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-teal text-sm">{a.name}, {a.age}</p>
                        <p className="text-xs leading-relaxed mt-0.5 text-muted-foreground">{a.msg}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--color-teal)" }}>
                        ✓ Принять
                      </button>
                      <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
                        ✕ Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const WELCOME_SLIDES = [
  { img: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/36fe8273-cd8a-4e91-a854-23caa0d018a4.jpg", label: "Настолки с новыми людьми" },
  { img: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/3b2e907c-1ea6-481c-acce-c71694704701.jpg", label: "Прогулки в парке" },
  { img: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/53d70f00-f81b-4e9b-90d9-12aee0431ec2.jpg", label: "Кино в хорошей компании" },
  { img: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/4ea0564e-049c-48ba-b0e4-2b2da88c0691.jpg", label: "Случайные встречи за кофе" },
  { img: "https://cdn.poehali.dev/projects/7943bd27-d167-499f-a07b-65cc9421d49b/files/31a90bea-97a7-482c-bf32-30cce5733e0e.jpg", label: "Пикники в солнечный день" },
];

function WelcomeScreen({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const [imgFade, setImgFade] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setImgFade(false);
      setTimeout(() => {
        setSlide(s => (s + 1) % WELCOME_SLIDES.length);
        setImgFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-screen" style={{ position: "relative", overflow: "hidden" }}>
      {/* Slideshow background */}
      <div style={{ position: "absolute", inset: 0 }}>
        {WELCOME_SLIDES.map((s, i) => (
          <img
            key={s.img}
            src={s.img}
            alt=""
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: i === slide ? (imgFade ? 1 : 0) : 0,
              transition: "opacity 0.7s ease-in-out",
              filter: "brightness(0.75) saturate(1.1)",
            }}
          />
        ))}
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.82) 100%)",
        }} />
        {/* Noise texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.5,
          pointerEvents: "none",
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        height: "100%", padding: "0 28px",
      }}>
        {/* Top: logo area */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}>
          {/* Logo mark */}
          <div style={{
            width: 72, height: 72,
            borderRadius: 24,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34,
            marginBottom: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            ☕
          </div>

          {/* App name */}
          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
            lineHeight: 1,
            textShadow: "0 2px 16px rgba(0,0,0,0.3)",
            marginBottom: 12,
          }}>
            Повод
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 16,
            fontWeight: 400,
            color: "rgba(255,255,255,0.82)",
            letterSpacing: "0.04em",
            textAlign: "center",
            lineHeight: 1.5,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.7s ease-out 0.15s, transform 0.7s ease-out 0.15s",
          }}>
            Знакомства через живые дела
          </p>

          {/* Slide label pill */}
          <div style={{
            marginTop: 32,
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100,
            padding: "6px 16px",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease-out 0.3s",
          }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 500, letterSpacing: "0.02em" }}>
              {WELCOME_SLIDES[slide].label}
            </p>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 6,
          marginBottom: 32,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease-out 0.4s",
        }}>
          {WELCOME_SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === slide ? "white" : "rgba(255,255,255,0.4)",
                transition: "all 0.35s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Bottom buttons */}
        <div style={{
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease-out 0.25s, transform 0.7s ease-out 0.25s",
        }}>
          {/* Register button */}
          <button
            onClick={onRegister}
            style={{
              width: "100%",
              height: 58,
              borderRadius: 32,
              background: "#E86A3D",
              border: "none",
              color: "white",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.01em",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(232,106,61,0.45), 0 1px 3px rgba(0,0,0,0.15)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              marginBottom: 12,
              display: "block",
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onTouchEnd={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            Зарегистрироваться
          </button>

          {/* Login button */}
          <button
            onClick={onLogin}
            style={{
              width: "100%",
              height: 58,
              borderRadius: 32,
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.7)",
              color: "white",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 18,
              fontWeight: 400,
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition: "transform 0.15s ease, background 0.15s ease",
              display: "block",
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "transparent"; }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "transparent"; }}
          >
            Войти
          </button>

          <p style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            marginTop: 16,
            lineHeight: 1.5,
          }}>
            Продолжая, вы соглашаетесь с{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>условиями использования</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, responded, onRespond }: {
  event: typeof EVENTS[0],
  responded: boolean,
  onRespond: () => void,
}) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 6px 28px rgba(45,94,94,0.1)" }}>
      <div className="relative" style={{ height: 220 }}>
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)"
        }} />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl text-white"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            {event.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl text-white flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            <Icon name="MapPin" size={10} />
            {event.distance}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
            <p className="text-white text-xs opacity-80 mt-0.5">{event.time}</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #2D5E5E, #3D7A7A)" }}>
            {event.creator.avatar}
          </div>
          <div>
            <p className="font-semibold text-teal text-xs">{event.creator.name}, {event.creator.age}</p>
            <p className="text-xs text-muted-foreground">{event.place}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`goal-badge ${GOAL_LABELS[event.goal].className} text-xs`}>
            {GOAL_LABELS[event.goal].label}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRespond(); }}
            className="py-2 px-4 rounded-2xl text-xs font-bold transition-all"
            style={{
              background: responded ? "rgba(45,94,94,0.15)" : "var(--color-mandarin)",
              color: responded ? "var(--color-teal)" : "white",
              boxShadow: responded ? "none" : "0 3px 12px rgba(232,106,61,0.35)"
            }}
          >
            {responded ? "Ожидает" : "Пойду"}
          </button>
        </div>
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