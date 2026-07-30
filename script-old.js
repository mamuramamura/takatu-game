const cards = [
  {
    id: 1,
    title: "居酒屋",
    text: "〇〇という居酒屋へ行ってみよう"
  },
  {
    id: 2,
    title: "居酒屋",
    text: "△△という居酒屋へ行ってみよう"
  },
  {
    id: 3,
    title: "神社を訪れる",
    text: "二子神社を訪れてみよう",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=二子神社"
  },
  {
    id: 4,
    title: "博物館を訪れる",
    text: "大山街道ふるさと館の展示を見てみよう",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=大山街道ふるさと館"
  },
  {
    id: 5,
    title: "街歩き",
    text: "溝の口駅から二子新地駅まで歩いてみよう"
  },
  {
    id: 6,
    title: "多摩川を渡る",
    text: "多摩川を渡ってみよう",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=二子橋"
  },
  {
    id: 7,
    title: "歴史",
    text: "昔の街道の痕跡を探そう"
  },
  {
    id: 8,
    title: "休憩",
    text: "街道で休憩できる場所を探そう"
  },
  {
    id: 9,
    title: "遊び場",
    text: "子どもの遊び場を探そう"
  },
  {
    id: 10,
    title: "犬目線",
    text: "犬の視点で街を歩いてみよう"
  }
];

const FORM_URL = "https://forms.google.com/";

// Local Storageで使用する名前
const STORAGE_KEY = "oyamakaidoCardGameData";

// 保存データの初期状態
let gameData = {
  drawnCards: [],
  completedCards: [],
  currentCardId: null,
  unlockedRewards: []
};

let currentCard = null;

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

   gameData = {
  drawnCards: Array.isArray(parsedData.drawnCards)
    ? parsedData.drawnCards
    : [],

  completedCards: Array.isArray(parsedData.completedCards)
    ? parsedData.completedCards
    : [],

  currentCardId: parsedData.currentCardId ?? null,

  unlockedRewards: Array.isArray(parsedData.unlockedRewards)
    ? parsedData.unlockedRewards
    : []
};

    // 保存されていた挑戦中カードを復元
    if (gameData.currentCardId !== null) {
      currentCard =
        cards.find((card) => card.id === gameData.currentCardId) ?? null;
    }
  } catch (error) {
    console.error("保存データの読み込みに失敗しました。", error);

    // 壊れた保存データを削除
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * 現在のデータをLocal Storageに保存する
 */
function saveGameData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

/**
 * 指定した画面だけを表示する
 */
function show(id) {
  document.querySelectorAll("section").forEach((section) => {
    section.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");
}

/**
 * ゲーム開始
 */
function startGame() {
  drawCard();
  show("game");
}

/**
 * トップ画面の進捗を更新する
 */
function updateProgress() {
  const completedCount = gameData.completedCards.length;
  const totalCount = cards.length;

  document.getElementById("progressCount").innerText =
    `${completedCount} / ${totalCount} 達成`;

  const progressPercent =
    totalCount === 0
      ? 0
      : (completedCount / totalCount) * 100;

  document.getElementById("progressFill").style.width =
    `${progressPercent}%`;

  document.getElementById("nextReward").innerText =
    getNextRewardMessage(completedCount);
}

/**
 * 次の特典までの案内文を作る
 */
function getNextRewardMessage(completedCount) {
  if (completedCount < 3) {
    return `あと${3 - completedCount}枚で3枚達成特典！`;
  }

  if (completedCount < 5) {
    return `あと${5 - completedCount}枚で5枚達成特典！`;
  }

  if (completedCount < 10) {
    return `あと${10 - completedCount}枚で10枚達成特典！`;
  }

  return "全カード達成！おめでとうございます！";
}

/**
 * 引いたカードだけをアルバムに表示する
 */
function showAlbum() {
  const albumList = document.getElementById("albumList");

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
    const card = cards.find((item) => item.id === cardId);

    if (!card) {
      return;
    }

    const isCompleted =
      gameData.completedCards.includes(card.id);

    const albumCard = document.createElement("div");

    albumCard.classList.add("album-card");

    if (isCompleted) {
      albumCard.classList.add("completed");
    } else {
      albumCard.classList.add("challenging");
    }

    albumCard.innerHTML = `
  <div class="album-status">
    ${isCompleted ? "✅ 達成済み" : "🟨 未達成"}
  </div>

  <h2>${card.title}</h2>

  <p>${card.text}</p>

  ${
    isCompleted
      ? ""
      : `
        <button onclick="selectCardFromAlbum(${card.id})">
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
  const selectedCard = cards.find((card) => {
    return card.id === cardId;
  });

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
    gameData.completedCards.includes(selectedCard.id);

  if (isCompleted) {
    alert("このカードはすでに達成済みです。");
    return;
  }

  currentCard = selectedCard;
playCard();
}

/**
 * まだ引いていないカードからランダムに1枚引く
 */
function drawCard() {
  const availableCards = cards.filter((card) => {
    return !gameData.drawnCards.includes(card.id);
  });

  if (availableCards.length === 0) {
    alert("すべてのカードを引きました！");
    goHome();
    return;
  }

  const randomIndex = Math.floor(
    Math.random() * availableCards.length
  );

  currentCard = availableCards[randomIndex];

  // 引いたカードとして記録
  gameData.drawnCards.push(currentCard.id);

  // 現在挑戦中のカードとして記録
  gameData.currentCardId = currentCard.id;

  saveGameData();

  document.getElementById("title").innerText =
    currentCard.title;

  document.getElementById("text").innerText =
    currentCard.text;
}

/**
 * このカードで遊ぶ
 */
function playCard() {
  if (!currentCard) {
    alert("先にカードを引いてください。");
    return;
  }

  gameData.currentCardId = currentCard.id;
  saveGameData();

 document.getElementById("playTitle").innerText =
  currentCard.title;
 
  document.getElementById("playText").innerText =
    currentCard.text;

    const mapButton = document.getElementById("mapButton");

if (currentCard.mapUrl) {
    mapButton.style.display = "block";
} else {
    mapButton.style.display = "none";
}

  show("play");
}

/**
 * カードを達成済みにする
 */
function completeCard() {
  if (!currentCard) {
    alert("挑戦中のカードがありません。");
    return;
  }

  const alreadyCompleted =
    gameData.completedCards.includes(currentCard.id);

  // 未達成の場合だけ追加
  if (!alreadyCompleted) {
    gameData.completedCards.push(currentCard.id);
  }

  gameData.currentCardId = null;

  saveGameData();
  updateProgress();

  // 特典の判定
  const unlockedReward = getUnlockedReward();

  // 選択状態の解除
  currentCard = null;

  if (unlockedReward) {
    showReward(unlockedReward);
  } else {
    show("complete");
  }
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

  gameData = {
    drawnCards: [],
    completedCards: [],
    currentCardId: null,
    unlockedRewards: []
  };

  currentCard = null;

  updateProgress();
  show("home");

  alert("進捗をリセットしました。");
}

/**
 * ページを開いたときに保存データを読み込む
 */
loadGameData();
updateProgress();

const rewards = {
  3: {
    title: "3枚達成特典！",
    message: "オリジナルステッカーをプレゼント！"
  },

  5: {
    title: "5枚達成特典！",
    message: "オリジナル缶バッジをプレゼント！"
  },

  10: {
    title: "全カード達成！",
    message: "コンプリート特典をプレゼント！"
  }
};

/**
 * 今回の達成で新しい特典が解放されたか調べる
 */
function getUnlockedReward() {
  const completedCount = gameData.completedCards.length;

  const reward = rewards[completedCount];

  if (!reward) {
    return null;
  }

  const alreadyUnlocked =
    gameData.unlockedRewards.includes(completedCount);

  if (alreadyUnlocked) {
    return null;
  }

  gameData.unlockedRewards.push(completedCount);

  saveGameData();

  return {
    count: completedCount,
    title: reward.title,
    message: reward.message
  };
}

/**
 * 特典画面を表示する
 */
function showReward(reward) {
  document.getElementById("rewardTitle").innerText =
    reward.title;

  document.getElementById("rewardMessage").innerText =
    reward.message;

  show("reward");
}

/**
 * Google Formsを別タブで開く
 */
function openForm() {
  window.open(FORM_URL, "_blank");
}

function openMap() {
  if (!currentCard || !currentCard.mapUrl) {
    alert("このカードには地図が登録されていません。");
    return;
  }

  window.open(currentCard.mapUrl, "_blank");
}