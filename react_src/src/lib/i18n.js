// MYSTRA — 3 til: o'zbek (asosiy), rus, ingliz.
// Ishlash tartibi: interfeys o'zbekcha yoziladi; tanlangan til rus yoki ingliz bo'lsa,
// sahifadagi matnlar lug'at (DICT) va andozalar (PATTERNS) bo'yicha avtomatik almashtiriladi.

export const LANGS = [
  { id: 'uz', label: "O'zbek", short: 'UZ' },
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'en', label: 'English', short: 'EN' },
];

const KEY = 'mys_lang';

export function getLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'uz' || v === 'ru' || v === 'en') return v;
  } catch { /* ignore */ }
  return 'uz';
}

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
  window.location.reload();
}

// Apostroflarning barcha turlarini bitta ko'rinishga keltiramiz
const norm = s => s.replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, ' ').trim();

// uz: [ru, en]
const RAW = {
  // ── Menyu va umumiy
  'Bosh sahifa': ['Главная', 'Home'],
  'Tekshirish': ['Проверка', 'Review'],
  "So'rovlar": ['Заявки', 'Requests'],
  "O'quvchilar": ['Ученики', 'Students'],
  "To'lovlar": ['Оплаты', 'Payments'],
  'Hisobotlar': ['Отчёты', 'Reports'],
  'Hisobot': ['Отчёт', 'Report'],
  'Uy vazifa': ['Домашние задания', 'Homework'],
  'Davomat': ['Посещаемость', 'Attendance'],
  'AI takliflar': ['AI-предложения', 'AI suggestions'],
  'Yuborish': ['Отправка', 'Send'],
  'AI vazifa': ['AI-задание', 'AI task'],
  'Ota-onalar': ['Родители', 'Parents'],
  'Sozlamalar': ['Настройки', 'Settings'],
  'Vazifalar': ['Задания', 'Tasks'],
  'Natijalar': ['Результаты', 'Results'],
  'Arxiv': ['Архив', 'Archive'],
  "To'lov": ['Оплата', 'Payment'],
  'Sertifikat': ['Сертификат', 'Certificate'],
  'Sertifikatlar': ['Сертификаты', 'Certificates'],
  'Admin': ['Админ', 'Admin'],
  'Chiqish': ['Выйти', 'Log out'],
  'Ustoz': ['Учитель', 'Teacher'],
  'Administrator': ['Администратор', 'Administrator'],
  "O'quvchi": ['Ученик', 'Student'],
  'Asosiy menyu': ['Главное меню', 'Main menu'],
  'Yangilash': ['Обновить', 'Refresh'],
  'Saqlash': ['Сохранить', 'Save'],
  'Bekor': ['Отмена', 'Cancel'],
  'Yopish': ['Закрыть', 'Close'],
  "Ko'rish": ['Смотреть', 'View'],
  'Ochish': ['Открыть', 'Open'],
  'Qayta': ['Вернуть', 'Return'],
  'Qayta urinish': ['Повторить', 'Try again'],
  'Qayta yuklash': ['Перезагрузить', 'Reload'],
  'Yuklanmoqda...': ['Загрузка...', 'Loading...'],
  "Ma'lumotlar yuklanmoqda...": ['Загрузка данных...', 'Loading data...'],
  "Ma'lumotlarni yuklab bo'lmadi": ['Не удалось загрузить данные', 'Could not load data'],
  "Ma'lumotlarni yuklab bo'lmadi.": ['Не удалось загрузить данные.', 'Could not load data.'],
  "Ma'lumotlarni yuklashda xatolik": ['Ошибка загрузки данных', 'Error loading data'],
  "Ma'lumotlarni yuklashda xatolik yuz berdi.": ['При загрузке данных произошла ошибка.', 'An error occurred while loading data.'],
  "Server bilan bog'lanishda xatolik yuz berdi.": ['Ошибка связи с сервером.', 'Server connection error.'],
  'Tarmoq xatosi': ['Ошибка сети', 'Network error'],
  'Amalni bajarib bo\'lmadi.': ['Не удалось выполнить действие.', 'Action failed.'],
  'Amalni bajarishda xatolik': ['Ошибка при выполнении действия', 'Error performing action'],
  'Aniq ishonchingiz komilmi? Bu qaytarilmaydi.': ['Вы уверены? Это нельзя отменить.', 'Are you sure? This cannot be undone.'],
  'Guruh': ['Группа', 'Group'],
  'Guruhlar': ['Группы', 'Groups'],
  'Daraja': ['Уровень', 'Level'],
  'Ism': ['Имя', 'Name'],
  'Ism Familya': ['Имя и фамилия', 'Full name'],
  'Telefon': ['Телефон', 'Phone'],
  'Login': ['Логин', 'Username'],
  'Parol': ['Пароль', 'Password'],
  'Izoh': ['Комментарий', 'Note'],
  'Usul': ['Способ', 'Method'],
  'Qarz': ['Долг', 'Debt'],
  'Tushgan': ['Поступило', 'Received'],
  'Harakatlar': ['Действия', 'Actions'],
  'Progress': ['Прогресс', 'Progress'],
  'Reyting': ['Рейтинг', 'Rating'],
  'REYTING BALLI': ['БАЛЛ РЕЙТИНГА', 'RATING SCORE'],
  'Tema': ['Тема', 'Theme'],
  'Zaxira nusxa': ['Резервная копия', 'Backup'],
  'Telegram': ['Telegram', 'Telegram'],
  'Vazifa': ['Задание', 'Task'],
  'Bajarildi': ['Выполнено', 'Done'],
  'Bajarilmadi': ['Не выполнено', 'Not done'],
  'Yozuv': ['Запись', 'Record'],
  'Oldindan ko\'rish': ['Предпросмотр', 'Preview'],
  'Kamaytirish': ['Уменьшить', 'Decrease'],
  'Oshirish': ['Увеличить', 'Increase'],

  "ta to'lagan": ['оплатили', 'paid'],
  'ta qarzdor': ['должников', 'in debt'],
  "Ilovani o'rnatish": ['Установить приложение', 'Install app'],
  "iPhone: Safari'da «Ulashish» tugmasini bosing → «Bosh ekranga qo'shish».": ['iPhone: в Safari нажмите «Поделиться» → «На экран „Домой“».', 'iPhone: in Safari tap Share → “Add to Home Screen”.'],
  'Grammatika': ['Грамматика', 'Grammar'], 'Zamon': ['Время', 'Tense'], 'Artikl': ['Артикль', 'Article'], 'Predlog': ['Предлог', 'Preposition'],
  "Lug'at": ['Лексика', 'Vocabulary'], 'Imlo': ['Орфография', 'Spelling'], 'Tinish belgisi': ['Пунктуация', 'Punctuation'], 'Uslub': ['Стиль', 'Style'],
  'Vazifaga javob': ['Ответ на задание', 'Task response'], 'Izchillik': ['Связность', 'Coherence'],
  // ── Ota-onalar
  'Ota-ona kabineti': ['Кабинет родителя', 'Parent portal'],
  'Hafta': ['Неделя', 'Week'], 'Olmos': ['Алмаз', 'Diamond'], 'Oltin': ['Золото', 'Gold'], 'Kumush': ['Серебро', 'Silver'], 'Bronza': ['Бронза', 'Bronze'], 'Oy': ['Месяц', 'Month'],
  "Guruhdagi o'rni": ['Место в группе', 'Rank in group'],
  'Natijalar': ['Результаты', 'Results'],
  "Bu davrda natija yo'q": ['За этот период результатов нет', 'No results for this period'],
  'Davomat belgilanmagan': ['Посещаемость не отмечена', 'No attendance marked'],
  'Keldi': ['Был', 'Present'], 'Kelmadi': ['Не был', 'Absent'],
  "To'langan": ['Оплачено', 'Paid'], 'Qisman': ['Частично', 'Partial'], "To'lanmagan": ['Не оплачено', 'Unpaid'],
  'Havola ishlamayapti': ['Ссылка не работает', 'This link does not work'],
  "Bu sahifa faqat siz uchun. Havolani boshqalarga yubormang.": ['Эта страница только для вас. Не пересылайте ссылку другим.', 'This page is just for you. Please do not share the link.'],
  'Ota-ona havolalari': ['Ссылки для родителей', 'Parent links'],
  "Ota-ona havolani ochadi va farzandining natijasi, davomati va to'lovini ko'radi. Telegram orqali ulansa, xabarlar avtomatik keladi.": ['Родитель открывает ссылку и видит результаты, посещаемость и оплату ребёнка. Если подключить Telegram, уведомления приходят автоматически.', 'Parents open the link to see their child’s results, attendance and payments. With Telegram connected, updates arrive automatically.'],
  'Telegram botni ulash': ['Подключить Telegram-бота', 'Connect Telegram bot'],
  'Ulanmoqda…': ['Подключение…', 'Connecting…'],
  "Bot ulash uchun avval «Sozlamalar»da Telegram bot tokenini kiriting (@BotFather dan olinadi).": ['Чтобы подключить бота, сначала введите токен в «Настройках» (его выдаёт @BotFather).', 'To connect the bot, first enter its token in Settings (get it from @BotFather).'],
  "O'quvchini qidirish…": ['Поиск ученика…', 'Search student…'],
  'Havolani nusxalash': ['Копировать ссылку', 'Copy link'],
  'Telegram havola': ['Ссылка Telegram', 'Telegram link'],
  'Telegram ulanmagan': ['Telegram не подключён', 'Telegram not connected'],
  "Havola noto'g'ri yoki eskirgan": ['Ссылка неверна или устарела', 'The link is invalid or expired'],
  "Ota-ona hisoboti": ['Отчёт для родителей', 'Parent report'],
  // ── Yutuqlar
  'Yutuqlar': ['Достижения', 'Achievements'], 'Mening yutuqlarim': ['Мои достижения', 'My achievements'],
  'Daraja': ['Уровень', 'Level'], 'Haftalik liga': ['Лига недели', 'Weekly league'], 'XP shu hafta': ['XP за неделю', 'XP this week'],
  'Nishonlar': ['Значки', 'Badges'], 'Olindi': ['Получен', 'Earned'],
  'Birinchi qadam': ['Первый шаг', 'First step'], 'Birinchi vazifani topshir': ['Сдай первое задание', 'Submit your first task'],
  'Mukammal': ['Идеально', 'Perfect'], 'Bir kunda 100% natija ol': ['Получи 100% за день', 'Score 100% in a day'],
  'Uchqun': ['Искра', 'Spark'], '3 kun ketma-ket vazifa bajar': ['Выполняй задания 3 дня подряд', 'Do tasks 3 days in a row'],
  'Olov': ['Огонь', 'On fire'], '7 kun ketma-ket vazifa bajar': ['Выполняй задания 7 дней подряд', 'Do tasks 7 days in a row'],
  'Afsona': ['Легенда', 'Legend'], '30 kun ketma-ket vazifa bajar': ['Выполняй задания 30 дней подряд', 'Do tasks 30 days in a row'],
  'Tirishqoq': ['Старательный', 'Hard worker'], "100 XP to'pla": ['Набери 100 XP', 'Earn 100 XP'],
  'Bilimdon': ['Знаток', 'Scholar'], "500 XP to'pla": ['Набери 500 XP', 'Earn 500 XP'],
  'Birinchi sertifikat': ['Первый сертификат', 'First certificate'], '95%+ natija bilan sertifikat ol': ['Получи сертификат за 95%+', 'Earn a certificate with 95%+'],
  'Kolleksioner': ['Коллекционер', 'Collector'], "5 ta sertifikat to'pla": ['Собери 5 сертификатов', 'Collect 5 certificates'],
  "Qo'shimcha kuch": ['Сверхсила', 'Extra power'], '5 ta extra work bajar': ['Выполни 5 extra work', 'Complete 5 extra works'],
  'Intizomli': ['Дисциплина', 'Disciplined'], "Bu oy birorta ham darsni qoldirma (kamida 4 dars)": ['Не пропусти ни одного урока за месяц (минимум 4)', 'Miss no lessons this month (at least 4)'],
  // ── Kirish
  'Xush kelibsiz!': ['Добро пожаловать!', 'Welcome!'],
  'Kirish': ['Войти', 'Sign in'],
  "Ro'yxatdan o'tish": ['Регистрация', 'Sign up'],
  'Parolni tasdiqlang': ['Повторите пароль', 'Confirm password'],
  "So'rov yuborish": ['Отправить заявку', 'Send request'],
  "So'rov yuborildi": ['Заявка отправлена', 'Request sent'],
  "Ro'yxatdan o'tish so'rovingiz serverga yuborildi.": ['Ваша заявка на регистрацию отправлена.', 'Your sign-up request has been sent.'],
  'Ustoz tasdiqlagach, login va parolingiz bilan': ['После подтверждения учителем войдите', 'Once the teacher approves it, sign in'],
  'tizimga kirishingiz mumkin.': ['со своим логином и паролем.', 'with your username and password.'],
  '← Orqaga': ['← Назад', '← Back'],
  'Kutilmoqda...': ['Подождите...', 'Please wait...'],
  'Yuborilmoqda...': ['Отправка...', 'Sending...'],
  'Guruhni tanlang': ['Выберите группу', 'Choose a group'],
  'Guruhlar yuklanmoqda...': ['Загрузка групп...', 'Loading groups...'],
  'Guruhlar mavjud emas': ['Групп пока нет', 'No groups yet'],
  "O'qish o'yinga,": ['Учёба становится игрой,', 'Learning becomes a game,'],
  "o'quv markazi": ['учебный центр —', 'your learning centre'],
  'tizimga aylanadi': ['системой', 'becomes a system'],
  'AI uy vazifalarini tekshiradi, ustoz bir bosishda tasdiqlaydi': ['AI проверяет домашние задания, учитель подтверждает в один клик', 'AI checks homework, the teacher approves in one click'],
  'Kunlik reja, XP, reyting va sertifikatlar': ['План на день, XP, рейтинг и сертификаты', 'Daily plan, XP, ranking and certificates'],
  "To'lov, davomat va hisobotlar bitta joyda": ['Оплата, посещаемость и отчёты в одном месте', 'Payments, attendance and reports in one place'],
  "Login yoki parol noto'g'ri.": ['Неверный логин или пароль.', 'Wrong username or password.'],
  'Login va parolni kiriting.': ['Введите логин и пароль.', 'Enter username and password.'],
  'Kirishda xatolik yuz berdi.': ['Ошибка входа.', 'Sign-in error.'],
  "Hamma maydonni to'ldiring.": ['Заполните все поля.', 'Fill in all fields.'],
  "Telefon raqam noto'g'ri.": ['Неверный номер телефона.', 'Invalid phone number.'],
  "Parol kamida 4 belgi bo'lsin.": ['Пароль — минимум 4 символа.', 'Password must be at least 4 characters.'],
  "Parol kamida 4 belgidan iborat bo'lishi kerak.": ['Пароль должен содержать минимум 4 символа.', 'Password must be at least 4 characters.'],
  'Parollar bir xil emas.': ['Пароли не совпадают.', 'Passwords do not match.'],
  'Bu login band.': ['Этот логин занят.', 'This username is taken.'],
  "Ro'yxatdan o'tishda xatolik yuz berdi.": ['Ошибка регистрации.', 'Sign-up failed.'],
  "So'rovingiz hali tasdiqlanmagan.": ['Ваша заявка ещё не подтверждена.', 'Your request has not been approved yet.'],
  "So'rovingiz rad etilgan.": ['Ваша заявка отклонена.', 'Your request was rejected.'],
  "Ko'p urinish. 10 daqiqadan keyin qayta urining.": ['Слишком много попыток. Попробуйте через 10 минут.', 'Too many attempts. Try again in 10 minutes.'],
  'Kirish kerak': ['Нужно войти', 'Sign-in required'],
  "Ruxsat yo'q": ['Нет доступа', 'Access denied'],
  'Topilmadi': ['Не найдено', 'Not found'],
  'Server xatosi': ['Ошибка сервера', 'Server error'],
  'Joriy parol': ['Текущий пароль', 'Current password'],
  'Yangi parol': ['Новый пароль', 'New password'],
  'Yangi parolni tasdiqlang': ['Повторите новый пароль', 'Confirm new password'],
  'Yangi parollar bir xil emas.': ['Новые пароли не совпадают.', 'New passwords do not match.'],
  "Joriy parol noto'g'ri.": ['Текущий пароль неверный.', 'Current password is wrong.'],

  // ── Bosh sahifa (ustoz)
  'Xayrli tong': ['Доброе утро', 'Good morning'],
  'Xayrli kun': ['Добрый день', 'Good afternoon'],
  'Xayrli kech': ['Добрый вечер', 'Good evening'],
  'Yangi vazifa': ['Новое задание', 'New task'],
  "Asosiy ko'rsatkichlar": ['Основные показатели', 'Key metrics'],
  "Faol o'quvchilar": ['Активные ученики', 'Active students'],
  'Tekshirish kutmoqda': ['Ждут проверки', 'Awaiting review'],
  "O'rtacha natija": ['Средний результат', 'Average score'],
  'Shu oy tushum': ['Доход за месяц', 'Revenue this month'],
  'Hammasi faol': ['Все активны', 'All active'],
  "Hali o'quvchi yo'q": ['Учеников пока нет', 'No students yet'],
  "AI dastlabki baho qo'ydi": ['AI поставил предварительную оценку', 'AI gave a preliminary score'],
  "Navbat bo'sh": ['Очередь пуста', 'Queue is empty'],
  "Hali natija yo'q": ['Результатов пока нет', 'No results yet'],
  "Guruhlar bo'yicha o'quvchilar": ['Ученики по группам', 'Students by group'],
  'Guruhlar →': ['Группы →', 'Groups →'],
  "Hali guruh yo'q.": ['Групп пока нет.', 'No groups yet.'],
  'Birinchi guruhni yarating': ['Создайте первую группу', 'Create the first group'],
  "Bugun nimaga e'tibor berish kerak": ['На что обратить внимание сегодня', 'What needs attention today'],
  "Hammasi joyida: navbat bo'sh, to'lovlar va obunalar tartibda.": ['Всё в порядке: очередь пуста, оплаты и подписки в норме.', 'All good: the queue is empty, payments and subscriptions are in order.'],
  "Tekshirishga o'tish": ['Перейти к проверке', 'Go to review'],
  "So'rovlarni ko'rish": ['Смотреть заявки', 'View requests'],
  "To'lovlarga o'tish": ['К оплатам', 'Go to payments'],
  "O'quvchilarni ko'rish": ['Смотреть учеников', 'View students'],
  'Qarzdorlar': ['Должники', 'Debtors'],
  'Hisobotni ochish': ['Открыть отчёт', 'Open report'],
  'Tekshirish navbati': ['Очередь проверки', 'Review queue'],
  'Hammasini ochish →': ['Открыть всё →', 'Open all →'],
  "Navbat bo'sh — barcha ishlar tekshirilgan.": ['Очередь пуста — все работы проверены.', 'Queue is empty — all work has been reviewed.'],
  'AI ball': ['Балл AI', 'AI score'],
  "Shu oy to'lovlari": ['Оплаты за месяц', 'Payments this month'],
  "To'lovlarni boshqarish": ['Управлять оплатами', 'Manage payments'],
  'Reyting TOP-5': ['Топ-5 рейтинга', 'Top 5 ranking'],
  'Diqqat': ['Внимание', 'Attention'],
  "Yangi so'rov": ['Новая заявка', 'New request'],
  'Obuna': ['Подписка', 'Subscription'],
  'Muvaffaqiyat': ['Успех', 'Success'],

  // ── Tekshirish sahifasi
  'Tekshirish markazi': ['Центр проверки', 'Review centre'],
  "O'quvchilarning yangi ishlari": ['Новые работы учеников', "Students' new work"],
  "AI har bir ishga dastlabki baho qo'yadi — siz tekshirib, bir bosishda tasdiqlaysiz.": ['AI ставит предварительную оценку каждой работе — вы проверяете и подтверждаете в один клик.', 'AI gives every piece of work a preliminary score — you check it and approve in one click.'],
  "Qisqa ko'rsatkichlar": ['Краткие показатели', 'Quick stats'],
  'kunlik ish kutmoqda': ['дневных работ ждут', 'daily submissions waiting'],
  'extra work kutmoqda': ['extra work ждут', 'extra work waiting'],
  'obunasi tugayapti': ['подписок заканчивается', 'subscriptions ending'],
  'ishni AI baholadi': ['работ оценил AI', 'scored by AI'],
  "Bo'limlar": ['Разделы', 'Sections'],
  'Kunlik vazifalar': ['Дневные задания', 'Daily tasks'],
  'Extra work': ['Extra work', 'Extra work'],
  'Obunalar': ['Подписки', 'Subscriptions'],
  'AI izohi.': ['Комментарий AI.', 'AI note.'],
  'Qayta topshirish': ['На пересдачу', 'Send back'],
  'Tasdiqlash': ['Подтвердить', 'Approve'],
  'Saqlanmoqda…': ['Сохранение…', 'Saving…'],
  'Saqlanmoqda...': ['Сохранение...', 'Saving...'],
  'Tasdiqlansa, sertifikat avtomatik beriladi': ['После подтверждения сертификат выдаётся автоматически', 'Once approved, a certificate is issued automatically'],
  'Hammasi tekshirilgan': ['Всё проверено', 'All reviewed'],
  "O'quvchilar kunlik vazifalarni yakunlaganda ular shu yerda paydo bo'ladi. AI ularga darhol dastlabki baho qo'yadi.": ['Когда ученики завершат дневные задания, они появятся здесь. AI сразу поставит предварительную оценку.', 'When students finish their daily tasks they appear here. AI scores them right away.'],
  "Extra work yo'q": ['Extra work нет', 'No extra work'],
  "O'quvchilar qo'shimcha vazifa yuborganda shu yerda ko'rasiz. Ular uchun alohida XP beriladi.": ['Когда ученики пришлют дополнительные задания, вы увидите их здесь. За них даётся отдельный XP.', 'When students send extra work you will see it here. It earns extra XP.'],
  "O'quvchilar qo'shilgach, ularning obuna muddati shu yerda ko'rinadi va bir bosishda uzaytiriladi.": ['Когда появятся ученики, здесь будет срок их подписки — продлить можно в один клик.', 'Once students are added, their subscription period shows here and can be extended in one click.'],
  'Yakuniy baho:': ['Итоговая оценка:', 'Final score:'],
  'Tugagan': ['Закончилась', 'Expired'],
  '+30 kun uzaytirish': ['Продлить на 30 дней', 'Extend 30 days'],
  'Uzaytirilmoqda…': ['Продление…', 'Extending…'],
  "O'quvchining ovozli javobi": ['Голосовой ответ ученика', "Student's voice answer"],
  'Fayl yuklanmoqda...': ['Загрузка файла...', 'Loading file...'],
  'Ochish / yuklab olish': ['Открыть / скачать', 'Open / download'],
  'Yuborilgan fayl': ['Отправленный файл', 'Attached file'],
  "Ustoz bahosi, foiz": ['Оценка учителя, %', "Teacher's score, %"],
  'Kunlik vazifalar tasdiqlandi ✓': ['Дневные задания подтверждены ✓', 'Daily tasks approved ✓'],
  'Vazifalar qayta topshirish uchun qaytarildi': ['Задания возвращены на пересдачу', 'Tasks sent back for resubmission'],
  'Vazifa tasdiqlandi ✓': ['Задание подтверждено ✓', 'Task approved ✓'],
  'Vazifa qayta topshirish uchun qaytarildi': ['Задание возвращено на пересдачу', 'Task sent back for resubmission'],

  // ── O'quvchi
  'Bugungi holat': ['Сегодня', 'Today'],
  'Bugungi reja': ['План на сегодня', "Today's plan"],
  "Bugun vazifa yo'q": ['Сегодня заданий нет', 'No tasks today'],
  'Hammasi bajarildi!': ['Всё выполнено!', 'All done!'],
  'Ketma-ketlik': ['Серия', 'Streak'],
  'Ketma-ket kunlar': ['Дней подряд', 'Days in a row'],
  'Bugun': ['Сегодня', 'Today'],
  'Kunlik natija': ['Результат дня', "Today's score"],
  'Natija ✓ tasdiqlandi': ['Результат ✓ подтверждён', 'Score ✓ approved'],
  'Ustozga yuborildi, tekshirilmoqda...': ['Отправлено учителю, проверяется...', 'Sent to the teacher, being reviewed...'],
  'Yakunlash va ustozga yuborish': ['Завершить и отправить учителю', 'Finish and send to teacher'],
  'Obuna muddati tugagan.': ['Срок подписки истёк.', 'Subscription expired.'],
  "Natijalarni ko'rishingiz mumkin, lekin vazifa topshira olmaysiz.": ['Вы можете смотреть результаты, но не можете сдавать задания.', 'You can view results but cannot submit tasks.'],
  'Sizga hali vazifa berilmagan.': ['Вам ещё не дали заданий.', 'No tasks have been assigned yet.'],
  'Vazifalar yuklanmoqda...': ['Загрузка заданий...', 'Loading tasks...'],
  'Javobingiz...': ['Ваш ответ...', 'Your answer...'],
  'Audio javob': ['Аудио-ответ', 'Audio answer'],
  'Ovozli javob': ['Голосовой ответ', 'Voice answer'],
  'Mikrofon ruxsati kerak.': ['Нужен доступ к микрофону.', 'Microphone permission is required.'],
  'Avval javob kiriting.': ['Сначала введите ответ.', 'Enter an answer first.'],
  'Avval kamida bitta vazifani bajaring.': ['Сначала выполните хотя бы одно задание.', 'Complete at least one task first.'],
  "Eng ko'pi bilan 3 ta fayl yuklash mumkin.": ['Можно загрузить не более 3 файлов.', 'You can upload up to 3 files.'],
  "Bu kun uchun kunlik vazifa yo'q.": ['На этот день заданий нет.', 'No daily tasks for this day.'],
  'Kunlik vazifalar ustozga yuborildi.': ['Дневные задания отправлены учителю.', 'Daily tasks sent to the teacher.'],
  "Kunlik vazifalarni yuborib bo'lmadi.": ['Не удалось отправить дневные задания.', 'Could not send daily tasks.'],
  'Vazifa muvaffaqiyatli yuborildi.': ['Задание успешно отправлено.', 'Task sent successfully.'],
  "Vazifani yuborib bo'lmadi.": ['Не удалось отправить задание.', 'Could not send the task.'],
  'Natijalarim': ['Мои результаты', 'My results'],
  'Natijalar yuklanmoqda...': ['Загрузка результатов...', 'Loading results...'],
  'Natijalarni yuklashda xatolik.': ['Ошибка загрузки результатов.', 'Error loading results.'],
  'Oylik arxiv': ['Архив по месяцам', 'Monthly archive'],
  'Arxiv yuklanmoqda...': ['Загрузка архива...', 'Loading archive...'],
  'Arxivni yuklashda xatolik': ['Ошибка загрузки архива', 'Error loading archive'],
  "Hali arxiv yo'q": ['Архива пока нет', 'No archive yet'],
  "Bu oyda yozuvlar yo'q.": ['В этом месяце записей нет.', 'No records this month.'],
  'Sertifikatlar yuklanmoqda...': ['Загрузка сертификатов...', 'Loading certificates...'],
  'Sertifikatlarni yuklashda xatolik': ['Ошибка загрузки сертификатов', 'Error loading certificates'],
  "Sertifikat yo'q — 95%+ natija kerak 🏆": ['Сертификатов нет — нужен результат 95%+ 🏆', 'No certificates — you need 95%+ 🏆'],
  'Faylni yuklab olish': ['Скачать файл', 'Download file'],
  "To'lov ma'lumotlari yuklanmoqda...": ['Загрузка данных об оплате...', 'Loading payment info...'],
  "To'lov ma'lumotlarini yuklashda xatolik.": ['Ошибка загрузки данных об оплате.', 'Error loading payment info.'],
  "To'lov ma'lumotlari topilmadi.": ['Данные об оплате не найдены.', 'Payment info not found.'],
  "Shu oy to'lovi qilingan ✓": ['Оплата за этот месяц внесена ✓', 'This month is paid ✓'],
  "Hozircha to'lovlar tarixi mavjud emas.": ['Истории оплат пока нет.', 'No payment history yet.'],
  "Muddati tugagan: vazifa topshirib bo'lmaydi": ['Срок истёк: сдавать задания нельзя', 'Expired: tasks cannot be submitted'],
  "to'lov talab qilinmaydi": ['оплата не требуется', 'no payment required'],
  'Narx belgilanmagan': ['Цена не задана', 'No price set'],
  'Ustoz narxni belgilaydi.': ['Цену устанавливает учитель.', 'The teacher sets the price.'],
  'MYSTRA · To\'lov cheki': ['MYSTRA · Чек об оплате', 'MYSTRA · Payment receipt'],

  // ── Ustoz: boshqa sahifalar
  "O'quvchilar guruhga qo'shilishni so'ramoqda": ['Ученики просят добавить их в группу', 'Students are asking to join a group'],
  "Hozircha yangi so'rovlar yo'q.": ['Новых заявок пока нет.', 'No new requests yet.'],
  "So'rovlarni yuklab bo'lmadi.": ['Не удалось загрузить заявки.', 'Could not load requests.'],
  'Rad etilmoqda...': ['Отклонение...', 'Rejecting...'],
  'Yangi guruh': ['Новая группа', 'New group'],
  'Guruh nomi:': ['Название группы:', 'Group name:'],
  'Guruh nomini kiriting.': ['Введите название группы.', 'Enter a group name.'],
  "Hali guruhlar yaratilmagan.": ['Группы ещё не созданы.', 'No groups have been created yet.'],
  "Guruhlar yo'q": ['Групп нет', 'No groups'],
  'Guruhlar topilmadi.': ['Группы не найдены.', 'No groups found.'],
  "Guruhlarni yuklab bo'lmadi.": ['Не удалось загрузить группы.', 'Could not load groups.'],
  "Guruhlarni yuklab bo'lmadi. Server ishlayotganini tekshiring.": ['Не удалось загрузить группы. Проверьте, что сервер работает.', 'Could not load groups. Check that the server is running.'],
  'Guruhlarni yuklashda xatolik': ['Ошибка загрузки групп', 'Error loading groups'],
  'Guruhni bosing — ichiga kirasiz': ['Нажмите на группу, чтобы открыть её', 'Click a group to open it'],
  "Bu guruhda o'quvchilar yo'q.": ['В этой группе нет учеников.', 'This group has no students.'],
  'Bunday guruh topilmadi.': ['Такая группа не найдена.', 'Group not found.'],
  'Guruh belgilanmagan': ['Группа не указана', 'No group'],
  'Guruh tanlanmagan': ['Группа не выбрана', 'No group selected'],
  'Avval guruhni tanlang.': ['Сначала выберите группу.', 'Choose a group first.'],
  'Avval kamida bitta guruh yarating.': ['Сначала создайте хотя бы одну группу.', 'Create at least one group first.'],
  'Vazifa uchun guruh tanlang.': ['Выберите группу для задания.', 'Choose a group for the task.'],
  'Kunlar belgilanmagan': ['Дни не указаны', 'No days set'],
  "Hozircha o'quvchilar mavjud emas.": ['Учеников пока нет.', 'No students yet.'],
  "O'quvchi muvaffaqiyatli yaratildi.": ['Ученик успешно создан.', 'Student created.'],
  'Ism, login va kamida 4 belgili parol kiriting.': ['Введите имя, логин и пароль не короче 4 символов.', 'Enter a name, username and a password of at least 4 characters.'],
  "HAMMA o'quvchilarni o'chirish?": ['Удалить ВСЕХ учеников?', 'Delete ALL students?'],
  'Vazifa nomi': ['Название задания', 'Task title'],
  'Vazifa nomini kiriting.': ['Введите название задания.', 'Enter a task title.'],
  'Vazifani saqlashda xatolik': ['Ошибка сохранения задания', 'Error saving task'],
  "Vazifa berish — guruh bo'yicha": ['Выдача заданий — по группам', 'Assign tasks — by group'],
  'Butun darajaga': ['Всему уровню', 'Whole level'],
  "Bu guruh uchun vazifalar ro'yxati bo'sh.": ['Для этой группы заданий нет.', 'No tasks for this group.'],
  "Guruh/O'quvchi sahifasida vazifalar qo'shing.": ['Добавьте задания на странице учеников.', 'Add tasks on the Students page.'],
  'Vazifani butun darajaga yuborishingiz mumkin.': ['Можно отправить задание всему уровню.', 'You can send the task to the whole level.'],
  'Bu daraja uchun alohida guruhlar topilmadi.': ['Для этого уровня групп нет.', 'No groups for this level.'],
  "Bu daraja uchun guruh yo'q. Yuqoridagi + Yangi guruh kartani bosing!": ['Для этого уровня нет групп. Нажмите «+ Новая группа» выше!', 'No group for this level. Click “+ New group” above!'],
  'Dars tekshiruvi': ['Проверка урока', 'Lesson check'],
  'Vazifalarni belgilang va natijani saqlang': ['Отметьте задания и сохраните результат', 'Mark tasks and save the result'],
  "O'quvchi javoblari yuklanmoqda...": ['Загрузка ответов учеников...', 'Loading student answers...'],
  "O'quvchi javoblarini yuklashda xatolik.": ['Ошибка загрузки ответов учеников.', 'Error loading student answers.'],
  "Hozircha yuborilgan online javoblar yo'q.": ['Онлайн-ответов пока нет.', 'No online answers yet.'],
  "Hozircha qo'shimcha vazifalar yo'q.": ['Дополнительных заданий пока нет.', 'No extra tasks yet.'],
  "Qo'shimcha vazifa": ['Дополнительное задание', 'Extra task'],
  'Topshirilgan ishlar': ['Сданные работы', 'Submitted work'],
  "Topshirilgan ish va so'rovlar": ['Сданные работы и заявки', 'Submitted work and requests'],
  "Guruh va sanani tanlab, o'quvchilarni belgilang": ['Выберите группу и дату, отметьте учеников', 'Choose a group and date, then mark students'],
  'Davomat saqlandi': ['Посещаемость сохранена', 'Attendance saved'],
  'Davomatni saqlashda xatolik': ['Ошибка сохранения посещаемости', 'Error saving attendance'],
  'Davomatni yuklashda xatolik': ['Ошибка загрузки посещаемости', 'Error loading attendance'],
  "Kurs narxlari va oylik to'lovlar": ['Цены курсов и ежемесячные оплаты', 'Course prices and monthly payments'],
  'Narxlarni saqlash': ['Сохранить цены', 'Save prices'],
  'Kurs narxlari saqlandi.': ['Цены курсов сохранены.', 'Course prices saved.'],
  "Narxlarni saqlab bo'lmadi": ['Не удалось сохранить цены', 'Could not save prices'],
  "To'lovlar yuklanmoqda...": ['Загрузка оплат...', 'Loading payments...'],
  "To'lovlarni yuklashda xatolik": ['Ошибка загрузки оплат', 'Error loading payments'],
  "To'lov muvaffaqiyatli saqlandi.": ['Оплата сохранена.', 'Payment saved.'],
  "To'lovni saqlab bo'lmadi": ['Не удалось сохранить оплату', 'Could not save payment'],
  "To'langan summa": ['Оплаченная сумма', 'Amount paid'],
  'Chegirma %': ['Скидка %', 'Discount %'],
  'Oxirgi 6 oy': ['Последние 6 месяцев', 'Last 6 months'],
  'Hisobot yuklanmoqda...': ['Загрузка отчёта...', 'Loading report...'],
  'Hisobotlarni yuklashda xatolik yuz berdi.': ['Ошибка загрузки отчётов.', 'Error loading reports.'],
  "Bu oy uchun hisobot topilmadi.": ['Отчёт за этот месяц не найден.', 'No report for this month.'],
  "Bu oy uchun hisobot ma'lumotlari topilmadi.": ['Данных для отчёта за этот месяц нет.', 'No report data for this month.'],
  'Grafik uchun kamida 2 natija kerak': ['Для графика нужно минимум 2 результата', 'At least 2 results are needed for a chart'],
  'Har oy alohida saqlanadi — hisobot va progress': ['Каждый месяц хранится отдельно — отчёт и прогресс', 'Each month is stored separately — report and progress'],
  'Ota-ona hisoboti': ['Отчёт для родителей', 'Parent report'],
  'Oylik natijani nusxalang yoki Telegram orqali yuboring': ['Скопируйте месячный результат или отправьте в Telegram', 'Copy the monthly result or send it via Telegram'],
  "Hisobotni nusxalab bo'lmadi. Brauzer ruxsatlarini tekshiring.": ['Не удалось скопировать отчёт. Проверьте разрешения браузера.', 'Could not copy the report. Check browser permissions.'],
  'Clipboard mavjud emas': ['Буфер обмена недоступен', 'Clipboard not available'],
  "Tanlangan o'quvchida sertifikat yo'q.": ['У выбранного ученика нет сертификатов.', 'The selected student has no certificates.'],
  'Telegram orqali yuborildi ✓': ['Отправлено в Telegram ✓', 'Sent via Telegram ✓'],
  'Telegram orqali yuborishda xatolik yuz berdi.': ['Ошибка отправки в Telegram.', 'Error sending via Telegram.'],
  'Telegram sozlanmagan': ['Telegram не настроен', 'Telegram not configured'],
  "Telegram bot sozlanmagan. Sozlamalar bo'limini tekshiring.": ['Telegram-бот не настроен. Проверьте раздел «Настройки».', 'Telegram bot is not configured. Check Settings.'],
  'Telegram xabarni yubora olmadi. Bot sozlamalarini tekshiring.': ['Telegram не смог отправить сообщение. Проверьте настройки бота.', 'Telegram could not send the message. Check the bot settings.'],
  'Natijalarni Telegramga yuborish': ['Отправить результаты в Telegram', 'Send results to Telegram'],
  'Tekshirilgan vazifalar natijalarini guruh chatiga yuboring': ['Отправьте результаты проверенных заданий в чат группы', 'Send reviewed results to the group chat'],
  'Natijalar muvaffaqiyatli yuborildi ✓': ['Результаты отправлены ✓', 'Results sent ✓'],
  'Yangi vazifa e\'loni': ['Объявление о новом задании', 'New task announcement'],
  'AI vazifa yaratish': ['Создать задание с AI', 'Create a task with AI'],
  'AI vazifa yaratishda xatolik': ['Ошибка создания задания AI', 'Error creating AI task'],
  "AI vazifa yaratmadi. Qayta urinib ko'ring.": ['AI не создал задание. Попробуйте ещё раз.', 'AI did not create a task. Please try again.'],
  'Vazifa mavzusini kiriting.': ['Введите тему задания.', 'Enter a task topic.'],
  "Masalan: Present Perfect bo'yicha 20 ta test tuz": ['Например: составь 20 тестов по Present Perfect', 'For example: make 20 tests on Present Perfect'],
  "Hozircha takliflar yo'q": ['Предложений пока нет', 'No suggestions yet'],
  'Takliflar yuklanmoqda...': ['Загрузка предложений...', 'Loading suggestions...'],
  "Takliflarni yuklab bo'lmadi.": ['Не удалось загрузить предложения.', 'Could not load suggestions.'],
  "Reyting, Telegram, tema va zaxira nusxa": ['Рейтинг, Telegram, тема и резервная копия', 'Ranking, Telegram, theme and backup'],
  'Bot token': ['Токен бота', 'Bot token'],
  'Chat/Group ID': ['ID чата/группы', 'Chat/Group ID'],
  "Ma'lumotlar ALMASHTIRILADI. Davom etamizmi?": ['Данные будут ЗАМЕНЕНЫ. Продолжить?', 'Data will be REPLACED. Continue?'],
  "O'qituvchilar ro'yxati": ['Список учителей', 'Teachers'],
  "O'qituvchi qo'shish": ['Добавить учителя', 'Add teacher'],
  "O'qituvchi muvaffaqiyatli yaratildi.": ['Учитель создан.', 'Teacher created.'],
  "Hozircha o'qituvchilar yo'q.": ['Учителей пока нет.', 'No teachers yet.'],
  'Faol talabalar': ['Активные ученики', 'Active students'],
  'PDF hujjat': ['PDF-документ', 'PDF document'],
  'PDFni alohida oynada ochish': ['Открыть PDF в новом окне', 'Open PDF in a new window'],
  'Rasmni kattalashtirish': ['Увеличить изображение', 'Enlarge image'],
  "O'quvchi yuborgan rasm": ['Фото от ученика', 'Image from student'],
  "Brauzeringiz audio faylni qo'llab-quvvatlamaydi.": ['Браузер не поддерживает аудио.', 'Your browser does not support audio.'],
  "Ruxsat berilmadi. Qayta tizimga kiring.": ['Доступ запрещён. Войдите снова.', 'Access denied. Please sign in again.'],
  "Faylni ochib bo'lmadi.": ['Не удалось открыть файл.', 'Could not open the file.'],
  "Fayl manzili noto'g'ri.": ['Неверный адрес файла.', 'Invalid file address.'],
};

const DICT = new Map(Object.entries(RAW).map(([k, v]) => [norm(k), v]));

// Raqamli/o'zgaruvchan matnlar uchun andozalar: [regex, ru, en]
const PATTERNS = [
  [/^(\d+) ta vazifa qoldi$/, 'Осталось заданий: $1', '$1 tasks left'],
  [/^(\d+) kun$/, '$1 дн.', '$1 days'],
  [/^(\d+) kun qoldi$/, 'осталось $1 дн.', '$1 days left'],
  [/^(\d+) XP · (\d+)-daraja$/, '$1 XP · уровень $2', '$1 XP · level $2'],
  [/^Salom, (.+)$/, 'Привет, $1', 'Hi, $1'],
  [/^(.+) daraja$/, 'Уровень $1', 'Level $1'],
  [/^(\d+) ta obunasi tugagan$/, 'истекло подписок: $1', '$1 subscriptions expired'],
  [/^(\d+) o'quvchi bo'yicha$/, 'учеников: $1', 'across $1 students'],
  [/^so'm · (\d+) ta to'liq to'lov$/, 'сум · полных оплат: $1', 'UZS · $1 paid in full'],
  [/^(\d+) ta to'lagan$/, 'Оплатили: $1', '$1 paid'],
  [/^(\d+) ta qarzdor$/, 'Должников: $1', '$1 in debt'],
  [/^(\d+) ta ish tekshirishni kutmoqda\. AI ularga dastlabki baho qo'ydi\.$/, 'Работ на проверке: $1. AI уже поставил предварительные оценки.', '$1 submissions are waiting. AI has already scored them.'],
  [/^(\d+) ta yangi o'quvchi ro'yxatdan o'tishni kutmoqda\.$/, 'Новых заявок на регистрацию: $1.', '$1 new students are waiting for sign-up approval.'],
  [/^(\d+) ta o'quvchining obunasi 3 kun ichida tugaydi: (.+)$/, 'Подписка заканчивается в течение 3 дней (учеников: $1): $2', '$1 students’ subscriptions end within 3 days: $2'],
  [/^(\d+) ta o'quvchining obunasi tugagan — ular vazifa topshira olmaydi\.$/, 'Подписка истекла у учеников: $1 — они не могут сдавать задания.', '$1 students’ subscriptions have expired — they cannot submit tasks.'],
  [/^Bu oy (\d+) ta o'quvchi to'lovni hali to'liq qilmagan\.$/, 'Не оплатили полностью в этом месяце: $1.', '$1 students have not paid in full this month.'],
  [/^(.+) reytingda birinchi — (\d+) ball\.$/, '$1 — первый в рейтинге: $2 баллов.', '$1 is first in the ranking — $2 points.'],
  [/^(.+) — kunlik vazifalar$/, '$1 — дневные задания', '$1 — daily tasks'],
  [/^(.+) · (\d+)\/(\d+) vazifa$/, '$1 · $2/$3 заданий', '$1 · $2/$3 tasks'],
  [/^Sertifikat uchun 95% kerak · hozir$/, 'Для сертификата нужно 95% · сейчас', 'Certificate needs 95% · now'],
  [/^Obunaga (\d+) kun qoldi\.$/, 'До конца подписки $1 дн.', '$1 days left on subscription.'],
  [/^Ustoz tasdiqladi: (\d+)%$/, 'Учитель подтвердил: $1%', 'Teacher approved: $1%'],
  [/^(\d+)\/(\d+) vazifa bajarildi$/, 'Выполнено заданий: $1/$2', '$1/$2 tasks done'],
  [/^(.+) obunasi 30 kunga uzaytirildi$/, 'Подписка $1 продлена на 30 дней', "$1's subscription extended by 30 days"],
  [/^Topilgan xatolar · (\d+)$/, 'Найдено ошибок: $1', 'Errors found: $1'],
  [/^Telegram: (\d+) ta ota-ona$/, 'Telegram: родителей $1', 'Telegram: $1 parents'],
  [/^(.+) nusxalandi ✓$/, 'Скопировано ✓', 'Copied ✓'],
  [/^Bot ulandi: @(.+) ✓$/, 'Бот подключён: @$1 ✓', 'Bot connected: @$1 ✓'],
  [/^(.+)\. Ustozdan yangi havola so'rang\.$/, '$1. Попросите у учителя новую ссылку.', '$1. Ask the teacher for a new link.'],
  [/^(.+) ligasi$/, 'Лига: $1', '$1 league'],
  [/^(\d+) XP · keyingi darajagacha (\d+) XP$/, '$1 XP · до следующего уровня $2 XP', '$1 XP · $2 XP to next level'],
  [/^(.+) \(sen\)$/, '$1 (ты)', '$1 (you)'],
  [/^Chiqish \((.+)\)$/, 'Выйти ($1)', 'Log out ($1)'],
  [/^(Dushanba|Seshanba|Chorshanba|Payshanba|Juma|Shanba|Yakshanba), (\d+)-(\w+)$/, null, null], // sana — alohida
];

const UZ_DAYS = { Dushanba: ['Понедельник', 'Monday'], Seshanba: ['Вторник', 'Tuesday'], Chorshanba: ['Среда', 'Wednesday'], Payshanba: ['Четверг', 'Thursday'], Juma: ['Пятница', 'Friday'], Shanba: ['Суббота', 'Saturday'], Yakshanba: ['Воскресенье', 'Sunday'] };
const UZ_MONTHS = { yanvar: ['января', 'January'], fevral: ['февраля', 'February'], mart: ['марта', 'March'], aprel: ['апреля', 'April'], may: ['мая', 'May'], iyun: ['июня', 'June'], iyul: ['июля', 'July'], avgust: ['августа', 'August'], sentabr: ['сентября', 'September'], oktabr: ['октября', 'October'], noyabr: ['ноября', 'November'], dekabr: ['декабря', 'December'] };

function translate(text, li) {
  const key = norm(text);
  if (!key) return null;
  const hit = DICT.get(key);
  if (hit) return hit[li];
  const dm = key.match(/^(Dushanba|Seshanba|Chorshanba|Payshanba|Juma|Shanba|Yakshanba), (\d+)-(\w+)$/);
  if (dm && UZ_MONTHS[dm[3]]) {
    return li === 0 ? `${UZ_DAYS[dm[1]][0]}, ${dm[2]} ${UZ_MONTHS[dm[3]][0]}` : `${UZ_DAYS[dm[1]][1]}, ${UZ_MONTHS[dm[3]][1]} ${dm[2]}`;
  }
  for (const [re, ru, en] of PATTERNS) {
    const tpl = li === 0 ? ru : en;
    if (tpl && re.test(key)) {
      const m = key.match(re);
      // ichki qismlarni ham tarjima qilamiz (masalan "B1 daraja")
      return tpl.replace(/\$(\d)/g, (_, i) => {
        const part = m[Number(i)] || '';
        return (DICT.get(norm(part)) || [])[li] || part;
      });
    }
  }
  return null;
}

// Kod ichida bevosita ishlatish uchun: t("O'zbekcha matn")
export function t(text) {
  const lang = getLang();
  if (lang === 'uz') return text;
  return translate(text, lang === 'ru' ? 0 : 1) ?? text;
}

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

export function startAutoTranslate() {
  const lang = getLang();
  document.documentElement.lang = lang;
  if (lang === 'uz') return;
  const li = lang === 'ru' ? 0 : 1;
  const done = new WeakMap(); // node -> translated value (o'zimiz yozgan qiymat)

  const doText = node => {
    const v = node.nodeValue;
    if (!v || done.get(node) === v) return;
    const tr = translate(v, li);
    if (tr != null && tr !== v) {
      const lead = v.match(/^\s*/)[0];
      const trail = v.match(/\s*$/)[0];
      const nv = lead + tr + trail;
      done.set(node, nv);
      node.nodeValue = nv;
    }
  };
  const doEl = el => {
    if (el.nodeType !== 1) return;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
    ATTRS.forEach(a => {
      const v = el.getAttribute(a);
      if (!v) return;
      const tr = translate(v, li);
      if (tr != null && tr !== v) el.setAttribute(a, tr);
    });
    if (tag === 'OPTION' && el.firstChild) doText(el.firstChild);
  };
  const walk = root => {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doEl(root);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let n = it.nextNode();
    while (n) {
      if (n.nodeType === 3) doText(n); else doEl(n);
      n = it.nextNode();
    }
  };

  walk(document.body);
  new MutationObserver(muts => {
    muts.forEach(m => {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doEl(m.target);
      else m.addedNodes.forEach(walk);
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // window.alert / confirm matnlarini ham tarjima qilamiz
  const wrap = fn => (msg, ...rest) => fn.call(window, typeof msg === 'string' ? (translate(msg, li) ?? msg) : msg, ...rest);
  window.alert = wrap(window.alert);
  window.confirm = wrap(window.confirm);
  window.prompt = wrap(window.prompt);
}
export const _translate = translate;
