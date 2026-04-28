// Russian string constants for Kid Quest UI
// All keys and comments are in English; values are in Russian

export const ru = {
  landing: {
    title: 'Kid Quest',
    subtitle:
      'Образовательная игра для детей — родители видят прогресс, дети получают награды.',
    ctaLogin: 'Войти',
    ctaRegister: 'Зарегистрироваться',
    tagline: 'Учись, играй и побеждай вместе.',
  },

  auth: {
    // Page titles
    loginTitle: 'Вход в Kid Quest',
    registerTitle: 'Регистрация родителя',

    // Tab labels
    tabParent: 'Я родитель',
    tabChild: 'Я ребёнок',

    // Field labels
    labelEmail: 'Электронная почта',
    labelDisplayName: 'Ваше имя',
    labelUsername: 'Имя пользователя',
    labelPassword: 'Пароль',

    // Placeholders
    placeholderEmail: 'example@mail.ru',
    placeholderDisplayName: 'Как вас зовут?',
    placeholderUsername: 'kid_name',
    placeholderPassword: '••••••',

    // Buttons
    btnLogin: 'Войти',
    btnRegister: 'Создать аккаунт',
    btnLoading: 'Загрузка...',

    // Links
    linkToLogin: 'Уже есть аккаунт? Войти',
    linkToRegister: 'Нет аккаунта? Зарегистрироваться',
    linkToHome: 'На главную',

    // Logout
    btnLogout: 'Выйти',

    // Descriptions
    usernameHint: 'Только строчные буквы, цифры и знак _ (3–20 символов)',

    // Error messages
    errors: {
      emailInvalid: 'Введите корректный адрес электронной почты',
      emailTaken: 'Этот адрес уже зарегистрирован',
      displayNameTooShort: 'Имя должно содержать не менее 2 символов',
      displayNameTooLong: 'Имя должно содержать не более 50 символов',
      passwordTooShort: 'Пароль должен содержать не менее 6 символов',
      passwordRequired: 'Введите пароль',
      usernameRequired: 'Введите имя пользователя',
      usernameTooShort: 'Имя пользователя должно содержать не менее 3 символов',
      usernameTooLong: 'Имя пользователя должно содержать не более 20 символов',
      usernameInvalid: 'Только строчные буквы латиницы, цифры и знак подчёркивания',
      usernameTaken: 'Это имя пользователя уже занято',
      invalidCredentials: 'Неверный логин или пароль',
      registrationDb: 'Не удалось сохранить аккаунт. Проверьте базу данных и миграции',
      registrationDbMigrations: 'База данных не готова. Нужно применить миграции Prisma',
      registrationAuth: 'Аккаунт создан, но вход не выполнен. Попробуйте войти вручную',
      validationFailed: 'Ошибка валидации. Проверьте введённые данные',
      accessDenied: 'Доступ запрещён',
      unexpected: 'Что-то пошло не так. Попробуйте ещё раз',
    },
  },

  parent: {
    // Header
    greeting: 'Здравствуйте',
    btnLogout: 'Выйти',

    // Children list page
    childrenTitle: 'Ваши дети',
    noChildren: 'У вас пока нет детей. Добавьте первого.',
    noChildrenCta: 'Добавить первого ребёнка',
    btnAddChild: 'Добавить',
    btnAddChildDialog: 'Добавить ребёнка',
    addChildTitle: 'Добавить ребёнка',
    addChildDescription: 'Создайте аккаунт для вашего ребёнка. Он сможет войти под своим логином.',
    btnOpen: 'Открыть',

    // Child card labels
    childCoins: 'Монеток',
    childEnergy: 'Энергия',
    childUsername: 'Логин',
    childHomeLevel: 'Уровень дома',

    // Child detail page
    childSince: 'В игре с',
    btnDelete: 'Удалить',
    btnDeleteConfirm: 'Удалить ребёнка',
    deleteTitle: 'Удалить аккаунт ребёнка?',
    deleteDescription: 'Это действие нельзя отменить. Все данные, прогресс и фото будут удалены безвозвратно.',
    btnCancel: 'Отмена',
    deleteSuccess: 'Аккаунт ребёнка удалён.',

    // Reset password
    btnResetPassword: 'Сменить пароль',
    resetPasswordTitle: 'Новый пароль для',
    resetPasswordDescription: 'Введите новый пароль. Минимум 6 символов.',
    labelNewPassword: 'Новый пароль',
    btnSavePassword: 'Сохранить',
    resetPasswordSuccess: 'Пароль успешно изменён.',

    // Subjects
    subjectMath: 'Математика',
    subjectReading: 'Чтение',
    subjectEnglish: 'Английский',
    subjectPE: 'Физкультура',

    // Subject summary card
    levelLabel: 'Уровень',
    completedLevelsLabel: 'Пройдено уровней',
    totalXpLabel: 'Всего XP',
    sessionsCountLabel: 'Сессий физкультуры',

    // Attempts list
    attemptsTitle: 'История попыток',
    noAttempts: 'Попыток ещё нет. Ребёнок ещё не проходил этот предмет.',
    attemptPassed: 'Пройдено',
    attemptFailed: 'Не пройдено',
    attemptScore: 'Результат',
    attemptCoins: 'монет',
    attemptLevel: 'Уровень',

    // PE sessions list
    peSessionsTitle: 'Сессии физкультуры',
    noPESessions: 'Сессий физкультуры ещё нет.',
    photoSlot10s: 'Фото (10 сек)',
    photoSlot60s: 'Фото (60 сек)',
    photoMissing: 'Нет фото',
    photoLoading: 'Фото загружается',

    // XP chart
    xpChartTitle: 'Прогресс XP за 14 дней',
    xpChartEmpty: 'Нет активности за последние 14 дней.',
    xpAxisLabel: 'XP',

    // Generic
    btnBack: 'Назад',
    loading: 'Загрузка...',
    errorNotFound: 'Ребёнок не найден.',
  },

  play: {
    greeting: 'Привет',
    hud: {
      coins: 'Монеты',
      energy: 'Энергия',
      homeLevelLabel: 'Уровень',
      btnEnter: 'Войти в домик',
      btnExit: 'Выйти',
    },
  },

  minigame: {
    // LevelSelect
    levelHeading: 'Уровень',
    completedOf: 'Пройдено уровней',
    completedOfSuffix: 'из 10',
    btnStart: 'Начать',
    btnExit: 'Выйти',
    loading: 'Загрузка...',

    // QuestionRunner
    questionCounter: '/', // rendered as "{current} / {total}"

    // ResultScreen
    headingPassed: 'Молодец!',
    headingFailed: 'Попробуй ещё!',
    btnNextLevel: 'Перейти к следующему уровню',
    btnRetry: 'Попробовать снова',
    btnExitHouse: 'Выйти из домика',
  },

  lobby: {
    title: 'Сервер игроков',
    subtitle: 'Скоро здесь появятся новые игры',
    enterArena: 'Игровой домик',
    arenaHint: 'Топчи клетки за 60 секунд — у кого больше очков, тот и победил!',
    back: 'Назад в мир',
    // arena
    waiting: 'Ожидание игроков',
    start: 'Старт раунда!',
    startCta: 'Начать!',
    playersInLobby: 'В лобби',
    yourScore: 'Твой счёт',
    timeLeft: 'Осталось',
    finished: 'Раунд завершён!',
    rewardCoins: 'Монет',
    playAgain: 'Сыграть ещё',
    leave: 'Выйти',
    controlsHint: 'WASD / стрелки или кнопки внизу',
  },

  home: {
    title: 'Мой дом',

    // Top HUD buttons
    btnBack: 'Назад к домикам',
    btnLobby: 'Сервер игроков',
    btnWardrobe: 'Гардероб',
    btnShop: 'Магазин',
    btnEditRoom: 'Изменить комнату',
    btnFinishEdit: 'Готово',

    // Tab labels for shop / wardrobe modals
    tabFurniture: 'Мебель',
    tabHair: 'Волосы',
    tabTop: 'Верх',
    tabBottom: 'Низ',
    tabPets: 'Питомцы',

    // Modal titles
    shopTitle: 'Магазин',
    wardrobeTitle: 'Гардероб',

    // Card actions
    btnBuy: 'Купить',
    btnOwned: 'Куплено',
    btnEquip: 'Надеть',
    btnEquipped: 'Надето',

    // Toasts
    toastBought: 'Куплено!',
    toastEquipped: 'Готово!',
    toastPlaced: 'Поставлено',
    toastRemoved: 'Убрано',
    toastRoomUnlocked: 'Новая комната открыта!',

    // Errors (mapped from server-action error keys)
    errorInsufficientFunds: 'Не хватает монет',
    errorAlreadyOwned: 'У тебя это уже есть',
    errorNotOwned: 'Сначала купи в магазине',
    errorLevelTooLow: 'Нужен более высокий уровень дома',
    errorGeneric: 'Что-то пошло не так',

    // Room labels and unlock
    roomLabel: 'Комната',
    unlockRoomTitle: 'Открыть комнату 2',
    unlockRoomCost: '200 монет + уровень дома 2',
    unlockRoomBtn: 'Открыть',

    // Placement mode
    placementHint: 'Выбери предмет и нажми на клетку',
    placementSidebar: 'Мои предметы',
    placementEmpty: 'Купи мебель в магазине',

    // Pet
    petLocked: 'Купи питомца в магазине',

    // Lock label
    premiumLocked: 'Только после покупки',
    pricePrefix: 'Цена',

    // Empty state
    noPlacedItems: 'Поставь мебель в режиме редактирования',
  },
} as const

export type Translations = typeof ru
