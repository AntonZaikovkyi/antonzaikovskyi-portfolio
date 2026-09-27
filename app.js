"use strict";

// ============================================================
// 1. АУДІОДЕМО: відтворення, перемотування та звукова хвиля
// ============================================================

const audio = document.querySelector("#demo-audio");
const toggle = document.querySelector("#audio-toggle");
const seek = document.querySelector("#audio-seek");
const waveform = document.querySelector(".waveform");
const currentLabel = document.querySelector("#audio-current");
const durationLabel = document.querySelector("#audio-duration");
const audioError = document.querySelector("#audio-error");

// Тривалість поточного демо до завантаження метаданих файлу.
const DEFAULT_DEMO_DURATION = 81.92;

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

// Дані беруться з waveform-data.js, без fetch та локального сервера.
const levels = typeof DEMO_WAVEFORM !== "undefined" ? DEMO_WAVEFORM : [];
const waveBars = levels.map((level) => {
  const bar = document.createElement("i");
  bar.style.height = `${Math.max(6, level * 100)}%`;
  waveform.append(bar);
  return bar;
});

if (waveBars.length === 0) {
  waveform.hidden = true;
}

function updateAudio() {
  const duration = Number.isFinite(audio.duration)
    ? audio.duration
    : DEFAULT_DEMO_DURATION;
  const progress = duration ? audio.currentTime / duration : 0;

  seek.max = duration;
  seek.value = audio.currentTime;
  seek.style.setProperty("--played", `${progress * 100}%`);
  currentLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(Math.ceil(duration));
  seek.setAttribute(
    "aria-valuetext",
    `${formatTime(audio.currentTime)} з ${formatTime(Math.ceil(duration))}`,
  );

  waveBars.forEach((bar, index) => {
    bar.classList.toggle("played", index / waveBars.length < progress);
  });
}

function syncPlay() {
  const playing = !audio.paused;
  toggle.querySelector("use").setAttribute(
    "href",
    playing ? "#i-pause" : "#i-play",
  );
  toggle.setAttribute(
    "aria-label",
    playing ? "Призупинити демо" : "Відтворити демо",
  );
}

async function playAudio() {
  try {
    await audio.play();
    audioError.hidden = true;
  } catch {
    audioError.hidden = false;
  }
}

toggle.addEventListener("click", () => {
  if (audio.paused) playAudio();
  else audio.pause();
});

document.querySelector("#listen-demo").addEventListener("click", () => {
  if (audio.paused) playAudio();
});

seek.addEventListener("input", () => {
  audio.currentTime = Number(seek.value);
  updateAudio();
});

["timeupdate", "loadedmetadata", "durationchange"].forEach((eventName) => {
  audio.addEventListener(eventName, updateAudio);
});

["play", "pause", "ended"].forEach((eventName) => {
  audio.addEventListener(eventName, syncPlay);
});

audio.addEventListener("error", () => {
  audioError.hidden = false;
});

// ============================================================
// 2. ВІДЕОПЛЕЄР: Google Drive або локальний відеофайл
// Налаштування кожної роботи задаються в index.html:
// data-title — заголовок; data-drive — ID Google Drive;
// data-local — необов’язковий шлях до локального відео.
// ============================================================

const dialog = document.querySelector("#media-dialog");
const mediaContainer = document.querySelector("#media-container");
const mediaTitle = document.querySelector("#media-title");
const mediaOriginal = document.querySelector("#media-original");
let lastTrigger;

document.querySelectorAll(".media-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    audio.pause();
    lastTrigger = button;
    mediaTitle.textContent = button.dataset.title;
    mediaOriginal.href = `https://drive.google.com/file/d/${button.dataset.drive}/view`;

    const isLocal = Boolean(button.dataset.local);
    const player = document.createElement(isLocal ? "video" : "iframe");
    player.src = button.dataset.local
      || `https://drive.google.com/file/d/${button.dataset.drive}/preview`;
    player.title = button.dataset.title;

    if (isLocal) {
      player.controls = true;
      player.playsInline = true;
      player.preload = "metadata";
    } else {
      player.allow = "autoplay; fullscreen";
      player.allowFullscreen = true;
    }

    mediaContainer.replaceChildren(player);
    dialog.showModal();
    document.body.style.overflow = "hidden";
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => {
  dialog.close();
});

// Закриття натисканням за межами вікна. Escape обробляє сам <dialog>.
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  const clickedOutside = event.clientX < rect.left
    || event.clientX > rect.right
    || event.clientY < rect.top
    || event.clientY > rect.bottom;
  if (clickedOutside) dialog.close();
});

dialog.addEventListener("close", () => {
  // Видалення плеєра зупиняє відео, включно з Google Drive.
  mediaContainer.replaceChildren();
  document.body.style.overflow = "";
  lastTrigger?.focus();
});

// ============================================================
// 3. ПЛАВНА ПОЯВА БЛОКІВ І ОБРОБКА ЗОБРАЖЕНЬ
// ============================================================

document.querySelectorAll("img").forEach((img) => {
  img.addEventListener("error", () => {
    img.hidden = true;
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove("awaiting");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll(
    ".section-heading, .category-grid, .about-section, .counter-card, .contact-section",
  ).forEach((element) => {
    element.classList.add("reveal", "awaiting");
    observer.observe(element);
  });
}
