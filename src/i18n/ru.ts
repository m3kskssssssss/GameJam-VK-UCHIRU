// Russian string constants for Деревня Знаний UI
// All keys and comments are in English; values are in Russian

export const ru = {
  landing: {
    title: 'Деревня Знаний',
    subtitle:
      'Образовательная игра для детей — родители видят прогресс, дети получают награды.',
    ctaLogin: 'Войти',
    ctaRegister: 'Зарегистрироваться',
    tagline: 'Учись, играй и побеждай вместе.',
  },

  auth: {
    // Page titles
    loginTitle: 'Вход в Деревню Знаний',
    registerTitle: 'Регистрация родителя',

    // Tab labels
    tabParent: 'Я родитель',
    tabChild: 'Я ребёнок',
    tabRelative: 'Родственник',

    // Field labels
    labelEmail: 'Электронная почта',
    labelDisplayName: 'Ваше имя',
    labelUsername: 'Имя пользователя',
    labelPassword: 'Пароль',
    labelGender: 'Пол персонажа',
    optionGenderBoy: 'Мальчик',
    optionGenderGirl: 'Девочка',
    labelGrade: 'Класс ребёнка',

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
    // Navigation
    nav: {
      children: 'Дети',
      feed: 'Лента',
      relatives: 'Родственники',
      profile: 'Профиль',
      brandTitle: 'Деревня Знаний',
    },

    // Feed
    feed: {
      title: 'Лента активности',
      empty: 'Пока нет записей. Дети ещё не завершили ни одного задания.',
      searchPlaceholder: 'Поиск по ленте...',
      filterAllChildren: 'Все дети',
      likeBtn: 'Нравится',
      commentBtn: 'Комментарии',
      commentsDialogTitle: 'Комментарии',
      commentPlaceholder: 'Написать комментарий...',
      btnSendComment: 'Отправить',
      loadMore: 'Загрузить ещё',
      loading: 'Загрузка...',
      rewardCoins: 'монет',
      rewardEnergy: 'энергии',
      kindPE: 'Физкультура',
      kindGrandparent: 'Бабушка / Дедушка',
      kindTask: 'Задание',
      noComments: 'Ещё нет комментариев. Будьте первым!',
      commentError: 'Не удалось отправить комментарий',
      likeError: 'Не удалось обновить лайк',
    },

    // Relatives
    relatives: {
      title: 'Родственники',
      empty: 'У вас ещё нет родственников. Добавьте первого.',
      btnAdd: 'Добавить родственника',
      addTitle: 'Новый родственник',
      addDescription: 'Создайте аккаунт для родственника. Они смогут просматривать ленту и оставлять комментарии.',
      labelUsername: 'Логин',
      labelDisplayName: 'Имя',
      labelPassword: 'Пароль',
      placeholderUsername: 'babushka_maria',
      placeholderDisplayName: 'Бабушка Мария',
      btnManage: 'Управление',
      manageTitle: 'Управление',
      btnResetPassword: 'Сменить пароль',
      resetPasswordTitle: 'Новый пароль для',
      labelNewPassword: 'Новый пароль',
      btnSavePassword: 'Сохранить',
      btnDelete: 'Удалить родственника',
      deleteTitle: 'Удалить родственника?',
      deleteDescription: 'Это действие нельзя отменить. Аккаунт родственника будет удалён.',
      btnDeleteConfirm: 'Удалить',
      btnCancel: 'Отмена',
      addSuccess: 'Родственник добавлен.',
      resetPasswordSuccess: 'Пароль успешно изменён.',
      deleteSuccess: 'Родственник удалён.',
      errorUsernameTaken: 'Это имя пользователя уже занято.',
      since: 'В системе с',
    },

    // Profile
    profile: {
      title: 'Мой профиль',
      labelDisplayName: 'Имя',
      labelEmail: 'Электронная почта',
      changePasswordTitle: 'Сменить пароль',
      labelCurrentPassword: 'Текущий пароль',
      labelNewPassword: 'Новый пароль',
      btnSave: 'Сохранить',
      changePasswordSuccess: 'Пароль успешно изменён.',
      errorInvalidPassword: 'Текущий пароль неверный.',
      errorGeneric: 'Что-то пошло не так. Попробуйте ещё раз.',
      placeholderCurrentPassword: '••••••',
      placeholderNewPassword: 'Минимум 6 символов',
    },

    // Avatar
    avatar: {
      btnChange: 'Изменить фото',
      btnTakePhoto: 'Сделать фото',
      btnFromGallery: 'Выбрать из галереи',
      uploadSuccess: 'Фото обновлено.',
      uploadError: 'Не удалось загрузить фото. Попробуйте ещё раз.',
      uploading: 'Загружаю...',
    },

    // Grandparent tab
    grandparentTab: {
      label: 'Бабушка / Дедушка',
      empty: 'Заданий от бабушки или дедушки пока нет.',
      grandmaSection: 'Задания от бабушки',
      grandpaSection: 'Задания от дедушки',
      photoAlt: 'Фото выполненного задания',
      enlargePhoto: 'Увеличить фото',
    },

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
      btnEnter: 'Войти в дом',
      btnExit: 'Выйти',
      btnTalkGrandma: 'Поговорить с бабушкой',
      btnTalkGrandpa: 'Поговорить с дедушкой',
    },
    dialog: {
      btnLeave: 'Уйти',
      speakerChild: 'Ты говоришь',
      speakerNpcGrandma: 'Бабушка говорит',
      speakerNpcGrandpa: 'Дедушка говорит',
      photo: {
        hintGrandma: 'Прикрепи фото результата — бабушка очень обрадуется!',
        hintGrandpa: 'Прикрепи фото результата — дедушка очень обрадуется!',
        btnTakePhoto: 'Сделать фото',
        btnFromGallery: 'Выбрать из галереи',
        btnRetake: 'Переснять',
        btnPickAnother: 'Выбрать другое',
        btnSend: 'Отправить',
        btnCancel: 'Отмена',
        sending: 'Отправляю...',
        errorUpload: 'Не удалось загрузить фото, попробуй ещё раз',
        successTitle: 'Какой ты молодец! Я так горжусь!',
        successOption: 'Спасибо!',
      },
    },
  },

  npc: {
    grandma: 'Бабушка',
    grandpa: 'Дедушка',
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

  lobbyGames: {
    // Portal config card
    cardStart: 'Начать',
    cardOpponent: 'С кем играть',
    cardSolo: 'Одному',
    cardAnyone: 'С любым игроком',
    cardCost: 'Стоимость',
    cardEnergy: 'энергии',
    cardClose: 'Закрыть',
    cardNoEnergy: 'Не хватает энергии — погуляй и подзарядись.',
    // Result screen
    resultPassed: 'Победа!',
    resultParticipated: 'Хорошо сыграл!',
    resultCoinsEarned: 'Монет получено',
    resultXpEarned: 'Опыта',
    resultPlayAgain: 'Сыграть ещё',
    resultBackToLobby: 'Назад в лобби',
    // Generic HUD
    hudOpponent: 'Соперник',
    hudScore: 'Очки',
    hudTimeLeft: 'Осталось',
    hudRound: 'Раунд',
    // Forest game
    forestStartHint: 'Беги по лесу и собирай монетки!',
    // Reaction game
    reactionStartHint: 'Тапай по зелёным кружкам, не задевай красные.',
    reactionTapStart: 'Готов? Жми старт!',
    // Memory game
    memoryStartHint: 'Запомни последовательность и повтори её.',
    memoryWatch: 'Смотри…',
    memoryYourTurn: 'Твой ход!',
    // Pairs game
    pairsStartHint: 'Найди все пары карточек.',
    pairsMoves: 'Ходов',
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
    tabPromo: 'Промокоды',

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
