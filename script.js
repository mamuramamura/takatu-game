const FORM_URL = "https://forms.google.com/";

// Local Storageで使用する名前
const STORAGE_KEY = "oyamakaidoCardGameData";

// 保存データの初期状態
let gameData = createInitialGameData();

// 現在選択しているカード
let currentCard = null;

/**
 * 初期状態のゲームデータを作る
 */
function createInitialGameData() {
  return {
    drawnCards: [],
    completedCards: [],
    currentCardId: null,
    unlockedRewards: []
  };
}

/**
 * Local Storageからデータを読み込む
 */
function loadGameData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return;
  }

  try {
    const parsedData = JSON.parse(savedData);

    // 現在存在するカードのID
    const existingCardIds = cards.map((card) => card.id);

    // 現在存在する特典の達成枚数
    const existingRewardCounts = rewards.map(
      (reward) => reward.count
    );

    gameData = {
      drawnCards: Array.isArray(parsedData.drawnCards)
        ? parsedData.drawnCards.filter((cardId) =>
            existingCardIds.includes(cardId)
          )
        : [],

      completedCards: Array.isArray(
        parsedData.completedCards
      )
        ? parsedData.completedCards.filter((cardId) =>
            existingCardIds.includes(cardId)
          )
        : [],

      currentCardId:
        parsedData.currentCardId !== null &&
        existingCardIds.includes(parsedData.currentCardId)
          ? parsedData.currentCardId
          : null,

      unlockedRewards: Array.isArray(
        parsedData.unlockedRewards
      )
        ? parsedData.unlockedRewards.filter((count) =>
            existingRewardCounts.includes(count)
          )
        : []
    };

    // 保存されていた挑戦中カードを復元する
    if (gameData.currentCardId !== null) {
      currentCard =
        cards.find(
          (card) => card.id === gameData.currentCardId
        ) ?? null;
    }
  } catch (error) {
    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );

    localStorage.removeItem(STORAGE_KEY);
    gameData = createInitialGameData();
  }
}

/**
 * 現在のデータをLocal Storageに保存する
 */
function saveGameData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(gameData)
  );
}

/**
 * 指定した画面だけを表示する
 */
function show(id) {
  document
    .querySelectorAll("section")
    .forEach((section) => {
      section.classList.add("hidden");
    });

  const targetSection = document.getElementById(id);

  if (!targetSection) {
    console.error(`${id}という画面が見つかりません。`);
    return;
  }

  targetSection.classList.remove("hidden");
}

/**
 * ゲーム開始
 */
function startGame() {
  const cardWasDrawn = drawCard();

  if (cardWasDrawn) {
    show("game");
  }
}

/**
 * トップ画面の進捗を更新する
 */
function updateProgress() {
  const completedCount =
    gameData.completedCards.length;

  const totalCount = cards.length;

  document.getElementById(
    "progressCount"
  ).innerText =
    `${completedCount} / ${totalCount} 達成`;

  const progressPercent =
    totalCount === 0
      ? 0
      : (completedCount / totalCount) * 100;

  document.getElementById(
    "progressFill"
  ).style.width = `${progressPercent}%`;

  document.getElementById(
    "nextReward"
  ).innerText =
    getNextRewardMessage(completedCount);
}

/**
 * 次の特典までの案内文を作る
 */
function getNextRewardMessage(completedCount) {
  // 全カードを達成した場合
  if (completedCount >= cards.length) {
    return "全カード達成！おめでとうございます！";
  }

  // 特典を達成枚数順に並べる
  const sortedRewards = [...rewards].sort(
    (a, b) => a.count - b.count
  );

  // 次に獲得できる特典を探す
  const nextReward = sortedRewards.find(
    (reward) => reward.count > completedCount
  );

  // まだ特典が残っている場合
  if (nextReward) {
    const remaining =
      nextReward.count - completedCount;

    return `あと${remaining}枚で${nextReward.count}枚達成特典！`;
  }

  // 特典はすべて獲得済みだがカードが残っている場合
  const remainingCards =
    cards.length - completedCount;

  return `すべての特典を獲得済み！全カード達成まであと${remainingCards}枚`;
}

/**
 * 引いたカードだけをアルバムに表示する
 */
function showAlbum() {
  const albumList =
    document.getElementById("albumList");

  albumList.innerHTML = "";

  if (gameData.drawnCards.length === 0) {
    albumList.innerHTML = `
      <p class="empty-message">
        まだカードを引いていません。
      </p>
    `;

    show("album");
    return;
  }

  gameData.drawnCards.forEach((cardId) => {
    const card = cards.find(
      (item) => item.id === cardId
    );

    if (!card) {
      return;
    }

    const isCompleted =
      gameData.completedCards.includes(card.id);

    const albumCard =
      document.createElement("div");

    albumCard.classList.add("album-card");

    if (isCompleted) {
      albumCard.classList.add("completed");
    } else {
      albumCard.classList.add("challenging");
    }

    albumCard.innerHTML = `
      <div class="album-status">
        ${
          isCompleted
            ? "✅ 達成済み"
            : "🟨 未達成"
        }
      </div>

      <h2>${card.title}</h2>

      <p>${card.text}</p>

      ${
        isCompleted
          ? ""
          : `
            <button
              onclick="selectCardFromAlbum(${card.id})"
            >
              このカードを選ぶ
            </button>
          `
      }
    `;

    albumList.appendChild(albumCard);
  });

  show("album");
}

/**
 * アルバムから未達成カードを選ぶ
 */
function selectCardFromAlbum(cardId) {
  const selectedCard = cards.find(
    (card) => card.id === cardId
  );

  if (!selectedCard) {
    alert("カードが見つかりませんでした。");
    return;
  }

  const isDrawn =
    gameData.drawnCards.includes(selectedCard.id);

  if (!isDrawn) {
    alert("まだ引いていないカードです。");
    return;
  }

  const isCompleted =
    gameData.completedCards.includes(
      selectedCard.id
    );

  if (isCompleted) {
    alert(
      "このカードはすでに達成済みです。"
    );
    return;
  }

  currentCard = selectedCard;
  playCard();
}

/**
 * まだ引いていないカードから
 * ランダムに1枚引く
 *
 * 成功した場合はtrue、
 * 引けなかった場合はfalseを返す
 */
function drawCard() {
  const availableCards = cards.filter(
    (card) =>
      !gameData.drawnCards.includes(card.id)
  );

  if (availableCards.length === 0) {
    alert(
      "すべてのカードを引きました！\n未達成カードはカード一覧から選べます。"
    );

    goHome();
    return false;
  }

  const randomIndex = Math.floor(
    Math.random() * availableCards.length
  );

  currentCard =
    availableCards[randomIndex];

  // 引いたカードとして記録する
  gameData.drawnCards.push(currentCard.id);

  // 現在挑戦中のカードとして記録する
  gameData.currentCardId =
    currentCard.id;

  saveGameData();

  document.getElementById(
    "title"
  ).innerText = currentCard.title;

  document.getElementById(
    "text"
  ).innerText = currentCard.text;

  return true;
}

/**
 * このカードで遊ぶ
 */
function playCard() {
  if (!currentCard) {
    alert(
      "先にカードを引いてください。"
    );
    return;
  }

  gameData.currentCardId =
    currentCard.id;

  saveGameData();

  document.getElementById(
    "playTitle"
  ).innerText = currentCard.title;

  document.getElementById(
    "playText"
  ).innerText = currentCard.text;

  updateMapButton();

  show("play");
}

/**
 * Googleマップボタンの
 * 表示・非表示を切り替える
 */
function updateMapButton() {
  const mapButton =
    document.getElementById("mapButton");

  if (!mapButton) {
    return;
  }

  if (currentCard?.mapUrl) {
    mapButton.style.display = "block";
  } else {
    mapButton.style.display = "none";
  }
}

/**
 * カードを達成済みにする
 */
function completeCard() {
  if (!currentCard) {
    alert(
      "挑戦中のカードがありません。"
    );
    return;
  }

  const alreadyCompleted =
    gameData.completedCards.includes(
      currentCard.id
    );

  if (!alreadyCompleted) {
    gameData.completedCards.push(
      currentCard.id
    );
  }

  gameData.currentCardId = null;

  saveGameData();
  updateProgress();

  const unlockedReward =
    getUnlockedReward();

  currentCard = null;

  if (unlockedReward) {
    showReward(unlockedReward);
  } else {
    show("complete");
  }
}

/**
 * 今回の達成で
 * 新しい特典が解放されたか調べる
 */
function getUnlockedReward() {
  const completedCount =
    gameData.completedCards.length;

  const reward = rewards.find(
    (item) => item.count === completedCount
  );

  if (!reward) {
    return null;
  }

  const alreadyUnlocked =
    gameData.unlockedRewards.includes(
      reward.count
    );

  if (alreadyUnlocked) {
    return null;
  }

  gameData.unlockedRewards.push(
    reward.count
  );

  saveGameData();

  return reward;
}

/**
 * 特典画面を表示する
 */
function showReward(reward) {
  document.getElementById(
    "rewardTitle"
  ).innerText = reward.title;

  document.getElementById(
    "rewardMessage"
  ).innerText = reward.message;

  show("reward");
}

/**
 * トップ画面へ戻る
 */
function goHome() {
  updateProgress();
  show("home");
}

/**
 * 保存データをすべてリセットする
 */
function resetGameData() {
  const confirmed = window.confirm(
    "引いたカード、達成状況、特典の記録をすべて削除します。\n本当にリセットしますか？"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);

  gameData = createInitialGameData();
  currentCard = null;

  updateProgress();
  show("home");

  alert("進捗をリセットしました。");
}

/**
 * Google Formsを別タブで開く
 */
function openForm() {
  window.open(FORM_URL, "_blank");
}

/**
 * 現在のカードのGoogleマップを開く
 */
function openMap() {
  if (!currentCard?.mapUrl) {
    alert(
      "このカードには地図が登録されていません。"
    );
    return;
  }

  window.open(
    currentCard.mapUrl,
    "_blank",
    "noopener,noreferrer"
  );
}

/**
 * ページを開いたときの初期処理
 */
function initializeGame() {
  loadGameData();
  updateProgress();
}

initializeGame();

/**
 * 遊び方画面を表示する
 */
function showHowToPlay() {
  show("howToPlay");
}