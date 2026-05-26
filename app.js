(function () {
  const SCRIPT_MESSAGES = [
    {
      id: "m01",
      actor: "SYSTEM",
      handle: "",
      text: "나무그늘과 달_없는밤이 들어왔습니다.",
      side: "system",
      offset: 0,
      system: true
    },
    {
      id: "m02",
      actor: "달_없는밤",
      handle: "",
      text: "여기 맞아?",
      side: "right",
      offset: 1000
    },
    {
      id: "m03",
      actor: "나무그늘",
      handle: "",
      text: "응. 위치 껐어?",
      side: "left",
      offset: 2000
    },
    {
      id: "m04",
      actor: "달_없는밤",
      handle: "",
      text: "꺼놨어.\n근데 자꾸 다시 켜질 것 같아.",
      side: "right",
      offset: 3000
    },
    {
      id: "m05",
      actor: "나무그늘",
      handle: "",
      text: "괜찮아. 여기선 아무도 널 못 찾아.",
      side: "left",
      offset: 4000
    },
    {
      id: "m06",
      actor: "SYSTEM",
      handle: "",
      text: "정답이 들어왔습니다.",
      side: "system",
      offset: 5000,
      system: true
    },
    {
      id: "m07",
      actor: "정답",
      handle: "",
      text: "정말 그렇게 생각해?",
      side: "left",
      offset: 6000
    },
    {
      id: "m08",
      actor: "달_없는밤",
      handle: "",
      text: "누구세요?",
      side: "right",
      offset: 7000
    },
    {
      id: "m09",
      actor: "정답",
      handle: "",
      text: "민아야.\n너 지금 위험한 짓 하고 있어.",
      side: "left",
      offset: 8000
    },
    {
      id: "m10",
      actor: "나무그늘",
      handle: "",
      text: "이미르?",
      side: "left",
      offset: 9000
    },
    {
      id: "m11",
      actor: "정답",
      handle: "",
      text: "나이선, 너야말로 그만해.\n네가 민아를 책임질 수 있어?",
      side: "left",
      offset: 10000
    },
    {
      id: "m12",
      actor: "달_없는밤",
      handle: "",
      text: "또 그 말이야?\n책임, 안전, 미래.",
      side: "right",
      offset: 11000
    },
    {
      id: "m13",
      actor: "정답",
      handle: "",
      text: "그게 현실이니까.",
      side: "left",
      offset: 12000
    },
    {
      id: "m14",
      actor: "나무그늘",
      handle: "",
      text: "현실이라는 말로 민아를 가두지 마.",
      side: "left",
      offset: 13000
    },
    {
      id: "m15",
      actor: "정답",
      handle: "",
      text: "너는 도망치는 걸 사랑이라고 부르는 거고.",
      side: "left",
      offset: 14000
    },
    {
      id: "m16",
      actor: "달_없는밤",
      handle: "",
      text: "그만해.\n너희 둘 다 나를 보고 있는 게 맞아?",
      side: "right",
      offset: 15000
    },
    {
      id: "m17",
      actor: "정답",
      handle: "",
      text: "나는 널 위해서—",
      side: "left",
      offset: 16000
    },
    {
      id: "m18",
      actor: "나무그늘",
      handle: "",
      text: "나는 널 사랑해서—",
      side: "left",
      offset: 17000
    },
    {
      id: "m19",
      actor: "달_없는밤",
      handle: "",
      text: "아니.\n너희가 보고 있는 건 내가 아니라,\n너희가 원하는 나 같아.",
      side: "right",
      offset: 18000
    },
    {
      id: "m20",
      actor: "SYSTEM",
      handle: "",
      text: "상대방의 얼굴을 최적화합니다.\n가장 이상적인 모습을 불러오는 중입니다.",
      side: "system",
      offset: 19000,
      system: true
    },
    {
      id: "m21",
      actor: "달_없는밤",
      handle: "",
      text: "방금… 너희 얼굴이 바뀌었어.",
      side: "right",
      offset: 20000
    },
    {
      id: "m22",
      actor: "나무그늘",
      handle: "",
      text: "나도.\n근데 이상하게… 더 익숙해.",
      side: "left",
      offset: 21000
    },
    {
      id: "m23",
      actor: "정답",
      handle: "",
      text: "이게 진짜일 수도 있잖아.",
      side: "left",
      offset: 22000
    },
    {
      id: "m24",
      actor: "달_없는밤",
      handle: "",
      text: "아니.\n진짜라면 이렇게 완벽할 리 없어.",
      side: "right",
      offset: 23000
    }
  ];

  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page;
  const isAudience = page === "audience";
  const messageList = document.getElementById("messageList");
  const template = document.getElementById("messageTemplate");
  const newMessageAlert = document.getElementById("newMessageAlert");
  const composerForm = document.getElementById("composerForm");
  const composerInput = document.getElementById("composerInput");
  const sessionKey = "bamboo-static-session";
  const startDelayMs = 1200;

  let startAt = getStartAt();
  let visibleIds = new Set();
  let pendingNewMessages = 0;

  init();

  function init() {
    if (!isAudience) {
      setupStageQr();
      setupStageButtons();
    }

    render();
    setupComposer();
    setupNewMessageAlert();
    setInterval(render, 250);
  }

  function setupComposer() {
    composerForm?.addEventListener("submit", event => {
      event.preventDefault();
    });

    composerInput?.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
      }
    });

    composerInput?.addEventListener("input", () => {
      composerInput.style.height = "auto";
      composerInput.style.height = `${Math.min(composerInput.scrollHeight, 92)}px`;
    });
  }

  function setupNewMessageAlert() {
    newMessageAlert?.addEventListener("click", () => {
      scrollToLatestMessage();
      hideNewMessageAlert();
    });

    messageList?.addEventListener("scroll", () => {
      if (isNearBottom(messageList)) hideNewMessageAlert();
    });
  }

  function getStartAt() {
    const explicit = Number(params.get("start"));
    if (Number.isFinite(explicit) && explicit > 0) return explicit;

    if (isAudience) return Date.now() + startDelayMs;

    const stored = Number(sessionStorage.getItem(sessionKey));
    if (Number.isFinite(stored) && stored > Date.now() - 60000) return stored;

    const next = Date.now() + startDelayMs;
    sessionStorage.setItem(sessionKey, String(next));
    return next;
  }

  function setupStageQr() {
    const qrCode = document.getElementById("qrCode");
    const joinUrl = document.getElementById("joinUrl");
    const audienceUrl = getAudienceUrl(startAt);

    if (joinUrl) joinUrl.textContent = audienceUrl;
    if (qrCode && window.QRQR) {
      qrCode.innerHTML = "";
      qrCode.appendChild(window.QRQR.createSvg(audienceUrl));
    }
  }

  function setupStageButtons() {
    const newSessionButton = document.getElementById("newSessionButton");
    const startNowButton = document.getElementById("startNowButton");
    const resetButton = document.getElementById("resetButton");

    newSessionButton?.addEventListener("click", () => {
      startAt = Date.now() + startDelayMs;
      sessionStorage.setItem(sessionKey, String(startAt));
      visibleIds = new Set();
      setupStageQr();
      render();
    });

    startNowButton?.addEventListener("click", () => {
      startAt = Date.now();
      sessionStorage.setItem(sessionKey, String(startAt));
      setupStageQr();
      render();
    });

    resetButton?.addEventListener("click", () => {
      startAt = Date.now() + startDelayMs;
      sessionStorage.setItem(sessionKey, String(startAt));
      visibleIds = new Set();
      setupStageQr();
      render();
    });
  }

  function getAudienceUrl(startTime) {
    const url = new URL("index.html", location.href);
    url.searchParams.set("start", String(startTime));
    return url.href;
  }

  function render() {
    const now = Date.now();
    const elapsed = now - startAt;
    const visibleMessages = SCRIPT_MESSAGES.filter(message => elapsed >= message.offset);

    renderStatus(now, visibleMessages.length);
    renderMessages(visibleMessages);
  }

  function renderStatus(now, visibleCount) {
    const status = document.getElementById("sessionStatus");
    const countdown = document.getElementById("countdownText");
    const progress = document.getElementById("scriptProgress");
    const progressBar = document.getElementById("progressBar");
    const remaining = startAt - now;

    if (status) {
      status.textContent = remaining > 0 ? "입장 중" : visibleCount >= SCRIPT_MESSAGES.length ? "종료" : "진행 중";
      status.classList.toggle("is-live", remaining <= 0);
    }

    if (countdown) {
      if (remaining > 0) countdown.textContent = `${Math.ceil(remaining / 1000)}초 후 시작`;
      else if (visibleCount >= SCRIPT_MESSAGES.length) countdown.textContent = "모든 대화 공개";
      else countdown.textContent = "대화 진행 중";
    }

    if (progress) progress.textContent = `${visibleCount} / ${SCRIPT_MESSAGES.length}`;
    if (progressBar) progressBar.style.width = `${Math.round((visibleCount / SCRIPT_MESSAGES.length) * 100)}%`;
  }

  function renderMessages(messages) {
    if (!messageList || !template) return;

    if (messages.length === 0) {
      messageList.innerHTML = "";
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "대나무 숲에 입장하는 중입니다.";
      messageList.appendChild(empty);
      visibleIds.clear();
      return;
    }

    const existing = new Set(Array.from(messageList.querySelectorAll("[data-id]")).map(node => node.dataset.id));
    const wasAtBottom = isNearBottom(messageList);
    let appendedCount = 0;

    for (const message of messages) {
      if (existing.has(message.id)) continue;

      if (!visibleIds.has(message.id)) visibleIds.add(message.id);
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = message.id;
      node.classList.add(message.side === "right" ? "from-right" : "from-left");
      if (message.system) node.classList.add("is-system");
      setNodeText(node, ".actor", message.actor);
      setNodeText(node, ".member-status", message.system ? "" : "온라인");
      setNodeText(node, ".handle", message.handle);
      setNodeText(node, ".message-time", formatOffset(message.offset));
      setNodeText(node, ".message-text", message.text);
      messageList.appendChild(node);
      appendedCount += 1;
    }

    Array.from(messageList.children).forEach(child => {
      if (child.classList.contains("empty-state")) child.remove();
      if (child.dataset.id && !messages.some(message => message.id === child.dataset.id)) child.remove();
    });

    if (appendedCount > 0) {
      if (wasAtBottom) {
        scrollToLatestMessage();
      } else {
        showNewMessageAlert(appendedCount);
      }
    }
  }

  function showNewMessageAlert(count) {
    if (!newMessageAlert) return;
    pendingNewMessages += count;
    newMessageAlert.textContent = `새 대화 ${pendingNewMessages}개`;
    newMessageAlert.hidden = false;
  }

  function hideNewMessageAlert() {
    if (!newMessageAlert) return;
    pendingNewMessages = 0;
    newMessageAlert.hidden = true;
  }

  function scrollToLatestMessage() {
    if (!messageList) return;
    messageList.scrollTop = messageList.scrollHeight;
  }

  function isNearBottom(element) {
    if (!element) return true;
    return element.scrollHeight - element.scrollTop - element.clientHeight < 48;
  }

  function setNodeText(root, selector, value) {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  }

  function formatOffset(offset) {
    const seconds = Math.round(offset / 1000);
    return `+${seconds}s`;
  }
})();
