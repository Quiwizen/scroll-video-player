const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

const STORAGE_KEY = 'player_video_path';
const SWIPE_THRESHOLD = 50;
const WHEEL_THRESHOLD = 150;
const WHEEL_COOLDOWN = 500;

let videos = [];
let playOrder = [];
let currentOrderIndex = 0;
let playedIndices = [];

const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const loadingEl = document.getElementById('loading');
const noVideosEl = document.getElementById('no-videos');
const progressFill = document.getElementById('progress-fill');
const speedButtons = document.querySelectorAll('.speed-btn');
const settingsBtn = document.getElementById('settings-btn');
const pathInfoEl = document.getElementById('path-info');
const selectFolderBtn = document.getElementById('select-folder-btn');

// 滑动/滚轮状态
let startY = 0;
let dragging = false;
let wheelLock = false;
let wheelAccum = 0;
// 路径提示自动隐藏定时器
let pathInfoTimer = null;

const getSavedPath = () => {
  try { return localStorage.getItem(STORAGE_KEY) || ''; }
  catch { return ''; }
};

const savePath = (p) => {
  try { localStorage.setItem(STORAGE_KEY, p); }
  catch (e) { console.error('保存路径失败:', e); }
};

function showPathInfo(path) {
  clearTimeout(pathInfoTimer);
  if (path) {
    pathInfoEl.textContent = `📁 ${path}`;
    pathInfoEl.classList.remove('hidden');
    pathInfoTimer = setTimeout(() => pathInfoEl.classList.add('hidden'), 3000);
  } else {
    pathInfoEl.classList.add('hidden');
  }
}

async function selectFolder() {
  try {
    const selected = await open({ directory: true, multiple: false, title: '选择视频文件夹' });
    if (typeof selected === 'string') await loadVideosFromPath(selected);
  } catch (error) {
    console.error('选择文件夹失败:', error);
    alert('选择文件夹失败: ' + error);
  }
}

// 显示“无视频”提示，并提供重新选择按钮
function showNoVideos(message, detail) {
  noVideosEl.innerHTML = `
    <p>未找到视频文件</p>
    <p>${message}</p>
    ${detail ? `<p style="font-size:12px;opacity:0.6;margin-top:8px;">${detail}</p>` : ''}
    <button id="reselect-btn" class="action-btn">重新选择</button>`;
  noVideosEl.classList.remove('hidden');
  document.getElementById('reselect-btn')?.addEventListener('click', selectFolder);
}

async function loadVideosFromPath(path) {
  try {
    showLoading();
    videos = await invoke('get_videos_by_path', { videoDir: path });
    hideLoading();

    if (videos.length === 0) {
      showNoVideos('该文件夹中没有支持的视频', path);
      showPathInfo(path);
      return;
    }

    savePath(path);
    showPathInfo(path);
    noVideosEl.classList.add('hidden');

    playOrder = [];
    currentOrderIndex = 0;
    playedIndices = [];
    await generateNewOrder();
    loadVideoByOrderIndex(0);
  } catch (error) {
    console.error('加载视频失败:', error);
    hideLoading();
    showNoVideos('加载失败', String(error));
  }
}

async function init() {
  // 关键修复：一开始就绑定按钮事件，避免首次打开（无保存路径 + 默认目录无视频）
  // 时“选择文件夹”和齿轮按钮点击无响应。
  setupEventListeners();

  const savedPath = getSavedPath();
  if (savedPath) {
    await loadVideosFromPath(savedPath);
    return;
  }

  // 首次打开：尝试默认 video 目录
  try {
    showLoading();
    videos = await invoke('get_videos');
    hideLoading();
    if (videos.length === 0) {
      noVideosEl.classList.remove('hidden');
      return;
    }
    await generateNewOrder();
    loadVideoByOrderIndex(0);
  } catch (error) {
    console.error('加载视频失败:', error);
    hideLoading();
    noVideosEl.classList.remove('hidden');
  }
}

async function generateNewOrder() {
  playOrder = await invoke('generate_play_order', {
    videoCount: videos.length,
    lastPlayed: playedIndices,
  });
  currentOrderIndex = 0;
}

const showLoading = () => loadingEl.classList.remove('hidden');
const hideLoading = () => loadingEl.classList.add('hidden');

function loadVideoByOrderIndex(orderIndex) {
  if (orderIndex < 0 || orderIndex >= playOrder.length) return;
  currentOrderIndex = orderIndex;
  const videoIndex = playOrder[orderIndex];
  if (!playedIndices.includes(videoIndex)) playedIndices.push(videoIndex);

  const video = videos[videoIndex];
  videoPlayer.src = window.__TAURI__.core.convertFileSrc(video.path, 'asset');
  videoTitle.textContent = video.name;
  videoPlayer.load();
  videoPlayer.play().catch(err => console.log('自动播放被阻止:', err));
  updateProgress();
}

async function playNext() {
  if (currentOrderIndex + 1 >= playOrder.length) {
    await generateNewOrder();
    loadVideoByOrderIndex(0);
  } else {
    loadVideoByOrderIndex(currentOrderIndex + 1);
  }
}

async function playPrev() {
  const prev = currentOrderIndex - 1;
  loadVideoByOrderIndex(prev < 0 ? playOrder.length - 1 : prev);
}

function updateProgress() {
  if (!videoPlayer.duration) return;
  progressFill.style.width = `${(videoPlayer.currentTime / videoPlayer.duration) * 100}%`;
}

// 上/下滑动切换视频（diff>0 表示向上滑 → 下一个）
function triggerSwipe(diff) {
  if (Math.abs(diff) < SWIPE_THRESHOLD) return;
  diff > 0 ? playNext() : playPrev();
}

function setupEventListeners() {
  if (videoPlayer._listenersReady) return;
  videoPlayer._listenersReady = true;

  videoPlayer.addEventListener('timeupdate', updateProgress);
  videoPlayer.addEventListener('ended', playNext);
  videoPlayer.addEventListener('click', (e) => {
    e.stopPropagation();
    videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
  });

  speedButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      videoPlayer.playbackRate = parseFloat(btn.dataset.speed);
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const container = document.getElementById('video-container');

  // 触摸滑动
  container.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });
  container.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    triggerSwipe(startY - e.changedTouches[0].clientY);
  }, { passive: true });

  // 鼠标滑动
  container.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    dragging = true;
  });
  container.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    triggerSwipe(startY - e.clientY);
  });
  container.addEventListener('mouseleave', () => { dragging = false; });

  // 滚轮切换（带节流，降低灵敏度）
  container.addEventListener('wheel', (e) => {
    if (wheelLock) return;
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
      wheelLock = true;
      wheelAccum = 0;
      setTimeout(() => { wheelLock = false; }, WHEEL_COOLDOWN);
      e.deltaY > 0 ? playNext() : playPrev();
    }
  }, { passive: true });

  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); selectFolder(); });
  selectFolderBtn?.addEventListener('click', selectFolder);
}

window.addEventListener('DOMContentLoaded', init);
