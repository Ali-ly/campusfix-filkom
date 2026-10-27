const form = document.getElementById("reportForm");
const formSection = document.getElementById("form-section");
const successSection = document.getElementById("success-section");

const building = document.getElementById("building");
const room = document.getElementById("room");
const description = document.getElementById("description");
const descriptionCount = document.getElementById("descriptionCount");

const photoInput = document.getElementById("photo");
const uploadTrigger = document.getElementById("uploadTrigger");
const previewWrap = document.getElementById("previewWrap");
const previewImage = document.getElementById("previewImage");
const photoName = document.getElementById("photoName");
const photoSize = document.getElementById("photoSize");
const removePhoto = document.getElementById("removePhoto");

const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventClock = document.getElementById("eventClock");
const eventPeriods = document.querySelectorAll('input[name="eventPeriod"]');

function syncEventTime() {
  const match = eventClock.value.trim().match(/^(0?[1-9]|1[0-2]):([0-5][0-9])$/);
  eventTime.value = "";
  if (!match) return !eventClock.value.trim();
  const period = document.querySelector('input[name="eventPeriod"]:checked').value;
  const hour = Number(match[1]) % 12 + (period === "PM" ? 12 : 0);
  eventTime.value = `${String(hour).padStart(2, "0")}:${match[2]}`;
  return true;
}
const newReportButton = document.getElementById("newReportButton");

const roomsByBuilding = {
  "Gedung G": Array.from({ length: 6 }, (_, index) => `G${index + 1}`),
  "Gedung F": Array.from({ length: 11 }, (_, index) => {
    const floor = index + 2;
    return Array.from({ length: 8 }, (_, roomIndex) => `F${floor}${roomIndex + 1}`);
  }).flat()
};

const allowedTypes = ["image/jpeg", "image/png"];
const maxFileSize = 5 * 1024 * 1024;

function setError(fieldId, message, inputElement = null) {
  const errorEl = document.getElementById(fieldId);
  errorEl.textContent = message;

  if (inputElement) {
    inputElement.classList.toggle("has-error", Boolean(message));
  }
}

function clearErrors() {
  setError("categoryError", "");
  setError("buildingError", "", building);
  setError("roomError", "", room);
  setError("descriptionError", "", description);
  setError("photoError", "");
  setError("eventDateError", "", eventDate);
  setError("eventTimeError", "", eventClock);
}

building.addEventListener("change", () => {
  setError("buildingError", "", building);
  setError("roomError", "", room);

  room.innerHTML = "";
  const selectedBuilding = building.value;

  if (!selectedBuilding) {
    room.disabled = true;
    room.innerHTML = '<option value="">Pilih gedung terlebih dahulu</option>';
    return;
  }

  room.disabled = false;
  room.innerHTML = '<option value="">Pilih ruangan</option>';

  if (selectedBuilding === "Gedung F") {
    for (let floor = 2; floor <= 12; floor++) {
      const group = document.createElement("optgroup");
      group.label = `Lantai ${floor}`;
      roomsByBuilding[selectedBuilding].slice((floor - 2) * 8, (floor - 1) * 8)
        .forEach((roomName) => group.appendChild(new Option(roomName, roomName)));
      room.appendChild(group);
    }
  } else {
    roomsByBuilding[selectedBuilding].forEach((roomName) => {
      room.appendChild(new Option(roomName, roomName));
    });
  }
});

room.addEventListener("change", () => setError("roomError", "", room));

document.querySelectorAll('input[name="category"]').forEach((radio) => {
  radio.addEventListener("change", () => setError("categoryError", ""));
});

description.addEventListener("input", () => {
  descriptionCount.textContent = `${description.value.length}/500`;
  if (description.value.trim()) {
    setError("descriptionError", "", description);
  }
});

uploadTrigger.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", () => {
  setError("photoError", "");

  const file = photoInput.files[0];

  if (!file) {
    resetPhotoPreview();
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    setError("photoError", "Format foto tidak didukung. Gunakan JPG, JPEG, atau PNG.");
    photoInput.value = "";
    resetPhotoPreview();
    return;
  }

  if (file.size > maxFileSize) {
    setError("photoError", "Ukuran foto maksimal 5 MB.");
    photoInput.value = "";
    resetPhotoPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    previewImage.src = event.target.result;
    photoName.textContent = file.name;
    photoSize.textContent = formatFileSize(file.size);
    uploadTrigger.hidden = true;
    previewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
});

removePhoto.addEventListener("click", () => {
  photoInput.value = "";
  resetPhotoPreview();
  setError("photoError", "");
});

function resetPhotoPreview() {
  previewImage.removeAttribute("src");
  photoName.textContent = "";
  photoSize.textContent = "";
  uploadTrigger.hidden = false;
  previewWrap.hidden = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function validateEventDateTime() {
  if (!syncEventTime()) {
    setError("eventTimeError", "Isi jam dengan format hh:mm, dari 01:00 sampai 12:59.", eventClock);
    return false;
  }
  setError("eventTimeError", "", eventClock);
  if (!eventDate.value && !eventTime.value) {
    setError("eventDateError", "", eventDate);
    setError("eventTimeError", "", eventClock);
    return true;
  }

  if (!eventDate.value && eventTime.value) {
    setError("eventDateError", "Pilih tanggal kejadian.", eventDate);
    return false;
  }

  const time = eventTime.value || "00:00";
  const selected = new Date(`${eventDate.value}T${time}`);
  const now = new Date();

  if (selected > now) {
    setError("eventDateError", "Waktu kejadian tidak boleh melebihi waktu saat ini.", eventDate);
    return false;
  }

  setError("eventDateError", "", eventDate);
  setError("eventTimeError", "", eventClock);
  return true;
}

eventDate.addEventListener("change", validateEventDateTime);
eventClock.addEventListener("input", () => {
  syncEventTime();
  setError("eventTimeError", "", eventClock);
});
eventClock.addEventListener("change", validateEventDateTime);
eventPeriods.forEach((period) => period.addEventListener("change", validateEventDateTime));

function validateForm() {
  clearErrors();

  let isValid = true;
  const category = document.querySelector('input[name="category"]:checked');

  if (!category) {
    setError("categoryError", "Pilih kategori kerusakan terlebih dahulu.");
    isValid = false;
  }

  if (!building.value) {
    setError("buildingError", "Pilih gedung tempat kerusakan ditemukan.", building);
    isValid = false;
  }

  if (!room.value) {
    setError("roomError", "Pilih ruangan tempat kerusakan ditemukan.", room);
    isValid = false;
  }

  if (!description.value.trim()) {
    setError("descriptionError", "Deskripsi kerusakan wajib diisi.", description);
    isValid = false;
  }

  if (!validateEventDateTime()) {
    isValid = false;
  }

  const file = photoInput.files[0];
  if (file) {
    if (!allowedTypes.includes(file.type)) {
      setError("photoError", "Format foto tidak didukung. Gunakan JPG, JPEG, atau PNG.");
      isValid = false;
    } else if (file.size > maxFileSize) {
      setError("photoError", "Ukuran foto maksimal 5 MB.");
      isValid = false;
    }
  }

  return isValid;
}

function generateTicketNumber() {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `FILKOM-CF-${year}-${randomNumber}`;
}

function formatEventTime(date, time) {
  if (!date && !time) return "Tidak diisi";

  const formattedDate = date
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date(`${date}T00:00`))
    : "";

  const displayTime = time ? (() => {
    const [hours, minutes] = time.split(":");
    return `${String(Number(hours) % 12 || 12).padStart(2, "0")}:${minutes} ${Number(hours) >= 12 ? "PM" : "AM"}`;
  })() : "";
  return [formattedDate, displayTime].filter(Boolean).join(", ");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
    const firstError = document.querySelector(".field-error:not(:empty)");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  const category = document.querySelector('input[name="category"]:checked').value;

  document.getElementById("ticketNumber").textContent = generateTicketNumber();
  document.getElementById("summaryCategory").textContent = category;
  document.getElementById("summaryLocation").textContent = `${building.value} — ${room.value}`;
  document.getElementById("summaryDescription").textContent = description.value.trim();
  document.getElementById("summaryTime").textContent = formatEventTime(
    eventDate.value,
    eventTime.value
  );

  formSection.hidden = true;
  successSection.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

newReportButton.addEventListener("click", () => {
  form.reset();
  room.disabled = true;
  room.innerHTML = '<option value="">Pilih gedung terlebih dahulu</option>';
  descriptionCount.textContent = "0/500";
  resetPhotoPreview();
  clearErrors();

  successSection.hidden = true;
  formSection.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Keep the navigation marker aligned with the section beneath the sticky header.
const navigationLinks = document.querySelectorAll('.header-nav a[href^="#"]');
const siteHeader = document.querySelector(".site-header");
function updateActiveNavigation() {
  const sectionOffset = Math.max(
    siteHeader.getBoundingClientRect().bottom,
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  );
  const reportVisible = !formSection.hidden &&
    formSection.getBoundingClientRect().top <= sectionOffset + 24;
  const activeTarget = reportVisible || !successSection.hidden ? "#form-section" : "#panduan";
  navigationLinks.forEach((link) => {
    const active = link.getAttribute("href") === activeTarget;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
let navigationFramePending = false;
window.addEventListener("scroll", () => {
  if (navigationFramePending) return;
  navigationFramePending = true;
  requestAnimationFrame(() => {
    updateActiveNavigation();
    navigationFramePending = false;
  });
}, { passive: true });
window.addEventListener("resize", updateActiveNavigation);
navigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = link.getAttribute("href") === "#form-section" && formSection.hidden
      ? successSection : document.querySelector(link.getAttribute("href"));
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
new MutationObserver(updateActiveNavigation).observe(formSection, {
  attributes: true, attributeFilter: ["hidden"]
});
updateActiveNavigation();

const reportWorkspace = document.querySelector(".report-workspace");
function updateReportProgress() {
  const complete = [Boolean(document.querySelector('input[name="category"]:checked')),
    Boolean(building.value && room.value), Boolean(description.value.trim())];
  const count = complete.filter(Boolean).length;
  document.getElementById("completionLabel").textContent = `${count} dari 3 lengkap`;
  document.getElementById("completionBar").style.width = `${count / 3 * 100}%`;
  document.querySelectorAll(".form-outline li").forEach((item, index) => {
    item.classList.toggle("complete", index < 3 ? complete[index] :
      index === 3 ? Boolean(photoInput.files.length) : Boolean(eventDate.value));
  });
  reportWorkspace.hidden = formSection.hidden;
}
form.addEventListener("input", updateReportProgress);
form.addEventListener("change", updateReportProgress);
form.addEventListener("reset", () => requestAnimationFrame(updateReportProgress));
new MutationObserver(updateReportProgress).observe(formSection, { attributes: true, attributeFilter: ["hidden"] });
updateReportProgress();
