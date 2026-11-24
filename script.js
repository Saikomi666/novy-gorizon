

const bgVideo = document.getElementById("bgVideo");

if (bgVideo) {
  bgVideo.muted = true;
  bgVideo.defaultMuted = true;
  bgVideo.setAttribute("muted", "");
  bgVideo.setAttribute("playsinline", "");

  const startVideo = () => bgVideo.play().catch(() => {});

  bgVideo.addEventListener("loadeddata", startVideo, { once: true });
  startVideo();
}

const CONFIG = {
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzkoO25M9kNFM7fDr_kddWRaPIdIjyLqrytVdn3CqlnlUh6-ukhLeV0LICypBxUL5OqdQ/exec"
};

const $ = (s) => document.querySelector(s);

const modal = $("#formModal");
const success = $("#successModal");
const form = $("#recruitForm");
const statusEl = $("#formStatus");

$("#openForm").addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
});

function closeForm() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("#closeForm").addEventListener("click", closeForm);
$("#closeBackdrop").addEventListener("click", closeForm);

$("#successClose").addEventListener("click", () => {
  success.classList.remove("open");
  success.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeForm();
});


// Отображение названий выбранных файлов

document.querySelectorAll('input[type="file"]').forEach(input => {
  input.addEventListener("change", () => {
    const out = document.querySelector(
      `.file-name[data-for="${input.name}"]`
    );

    if (out) {
      out.textContent = input.files[0]?.name || "файл не выбран";
    }
  });
});


// Преобразование изображения в Base64

async function fileToDataURL(file, maxSide = 1800, quality = 0.88) {
  if (!file) return null;

  const img = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const scale = Math.min(
      1,
      maxSide / Math.max(img.width, img.height)
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Не удалось обработать изображение.");
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const isTransparent = file.type === "image/png";

    return canvas.toDataURL(
      isTransparent ? "image/png" : "image/jpeg",
      quality
    );

  } finally {
    URL.revokeObjectURL(url);
  }
}


// Отправка анкеты в Google Apps Script

async function submitToGoogle(data) {
  const url = CONFIG.GOOGLE_APPS_SCRIPT_URL;

  if (!url || url.includes("PASTE_YOUR")) {
    throw new Error("Не указан URL Google Apps Script.");
  }

  const body = new URLSearchParams();

  body.set("payload", JSON.stringify(data));

  const response = await fetch(url, {
    method: "POST",
    body: body
  });

  if (!response.ok) {
    throw new Error("Ошибка соединения с архивом.");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Архив не принял анкету.");
  }

  return result;
}


// Сбор и отправка всех полей анкеты

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = form.querySelector('[type="submit"]');

  if (submitButton.disabled) return;

  submitButton.disabled = true;

  statusEl.textContent = "Собираем личное дело…";

  try {
    const fd = new FormData(form);
    const data = {};

    // Собираем абсолютно все текстовые поля.
    // Если одинаковые имена случайно встретятся снова,
    // их значения не будут перезаписаны.

    for (const [key, value] of fd.entries()) {
      if (value instanceof File) continue;

      const text = String(value).trim();

      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (Array.isArray(data[key])) {
          data[key].push(text);
        } else {
          data[key] = [data[key], text];
        }
      } else {
        data[key] = text;
      }
    }

    // Изображения

    statusEl.textContent = "Обрабатываем изображения…";

    data.transparent_character = await fileToDataURL(
      fd.get("transparent_character")
    );

    data.character_background = await fileToDataURL(
      fd.get("character_background")
    );

    // Служебная информация

    data.submitted_at = new Date().toISOString();
    data.form_version = "NH-02";

    // Отправка

    statusEl.textContent = "Передаём запись в архив…";

    const result = await submitToGoogle(data);

    console.log("Анкета сохранена:", result);

    form.reset();

    document.querySelectorAll(".file-name").forEach(x => {
      x.textContent = "файл не выбран";
    });

    closeForm();

    success.classList.add("open");
    success.setAttribute("aria-hidden", "false");

  } catch (err) {
    console.error(err);

    statusEl.textContent =
      err.message || "Не удалось отправить анкету. Попробуйте ещё раз.";

  } finally {
    submitButton.disabled = false;
  }
});
// BACKGROUND MUSIC

const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const musicIcon = document.getElementById("musicIcon");

if (bgMusic && musicToggle) {
  bgMusic.volume = 0.35;

  function updateMusicButton() {
    if (bgMusic.paused) {
      musicIcon.textContent = "▶";
      musicToggle.setAttribute("aria-label", "Включить музыку");
    } else {
      musicIcon.textContent = "♫";
      musicToggle.setAttribute("aria-label", "Поставить музыку на паузу");
    }
  }

  async function playMusic() {
    try {
      await bgMusic.play();
    } catch (error) {
      console.log("Для запуска музыки нужно взаимодействие с сайтом.");
    }
    updateMusicButton();
  }

  musicToggle.addEventListener("click", async () => {
    if (bgMusic.paused) {
      await playMusic();
    } else {
      bgMusic.pause();
      updateMusicButton();
    }
  });

  bgMusic.addEventListener("play", updateMusicButton);
  bgMusic.addEventListener("pause", updateMusicButton);

  playMusic();

  document.addEventListener("pointerdown", () => {
    if (bgMusic.paused) playMusic();
  }, { once: true });

  updateMusicButton();
}