// LOCALSTORAGE-BASED PHONEBOOK (no remote API required)
const STORAGE_KEY = "phonebook_contacts";

const form = document.getElementById("contact-form");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const contactIdInput = document.getElementById("contact-id");
const contactsContainer = document.getElementById("contacts-container");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const formMsg = document.getElementById("form-msg");
const cancelEditBtn = document.getElementById("cancel-edit");
const themeToggle = document.getElementById("theme-toggle");

const errorName = document.getElementById("error-name");
const errorPhone = document.getElementById("error-phone");
const errorEmail = document.getElementById("error-email");

let contacts = [];

// Validation helpers
function validateName(name) {
  return /^[\p{L} ]{2,50}$/u.test(name.trim());
}

function validateEmail(email) {
  if (!email) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function setFieldValidity(inputEl, isValid, errorEl, message) {
  if (isValid) {
    inputEl.classList.remove("invalid");
    errorEl.textContent = "";
  } else {
    inputEl.classList.add("invalid");
    errorEl.textContent = message;
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    contacts = raw ? JSON.parse(raw) : [];
  } catch {
    contacts = [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function showMessage(el, msg, duration = 2000) {
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = "";
  }, duration);
}

function renderContacts(filter = "") {
  contactsContainer.innerHTML = "";
  const term = filter.trim().toLowerCase();
  const filtered = contacts.filter((c) => {
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  if (filtered.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  filtered.forEach((c) => {
    const tpl = document.getElementById("contact-template");
    const clone = tpl.content.cloneNode(true);
    clone.querySelector(".name").textContent = c.name;
    clone.querySelector(".phone").textContent = c.phone || "";
    clone.querySelector(".email").textContent = c.email || "";

    // Edit
    clone.querySelector("button.edit").addEventListener("click", () => {
      contactIdInput.value = c.id;
      nameInput.value = c.name;
      phoneInput.value = c.phone;
      emailInput.value = c.email || "";
      document.getElementById("save-btn").textContent = "Update";
      cancelEditBtn.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Delete
    clone.querySelector("button.delete").addEventListener("click", () => {
      if (!confirm(`Delete ${c.name}?`)) return;
      contacts = contacts.filter((x) => x.id !== c.id);
      saveToStorage();
      renderContacts(searchInput.value);
      showMessage(formMsg, "Deleted contact.");
    });

    contactsContainer.appendChild(clone);
  });
}

// Live field validation
nameInput.addEventListener("input", () => {
  setFieldValidity(
    nameInput,
    validateName(nameInput.value),
    errorName,
    "Name must be 2–50 letters/spaces."
  );
});
phoneInput.addEventListener("input", () => {
  setFieldValidity(
    phoneInput,
    validatePhone(phoneInput.value),
    errorPhone,
    "Phone needs 7–15 digits."
  );
});
emailInput.addEventListener("input", () => {
  setFieldValidity(
    emailInput,
    validateEmail(emailInput.value),
    errorEmail,
    "Email is invalid."
  );
});

// Form submit (add/update)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  let valid = true;

  if (!validateName(name)) {
    setFieldValidity(nameInput, false, errorName, "Name must be 2–50 letters/spaces.");
    valid = false;
  } else {
    setFieldValidity(nameInput, true, errorName, "");
  }

  if (!validatePhone(phone)) {
    setFieldValidity(phoneInput, false, errorPhone, "Phone needs 7-15 digits.");
    valid = false;
  } else {
    setFieldValidity(phoneInput, true, errorPhone, "");
  }

  if (!validateEmail(email)) {
    setFieldValidity(emailInput, false, errorEmail, "Email is invalid.");
    valid = false;
  } else {
    setFieldValidity(emailInput, true, errorEmail, "");
  }

  if (!valid) {
    showMessage(formMsg, "Fix validation errors before saving.");
    return;
  }

  const existingId = contactIdInput.value;
  if (existingId) {
    contacts = contacts.map((c) =>
      c.id === existingId ? { ...c, name, phone, email } : c
    );
    showMessage(formMsg, "Contact updated.");
  } else {
    contacts.unshift({
      id: crypto.randomUUID(),
      name,
      phone,
      email,
    });
    showMessage(formMsg, "Contact added.");
  }

  saveToStorage();
  form.reset();
  contactIdInput.value = "";
  document.getElementById("save-btn").textContent = "Save";
  cancelEditBtn.hidden = true;
  renderContacts(searchInput.value);
});

cancelEditBtn.addEventListener("click", () => {
  form.reset();
  contactIdInput.value = "";
  document.getElementById("save-btn").textContent = "Save";
  cancelEditBtn.hidden = true;
});

searchInput.addEventListener("input", (e) => {
  renderContacts(e.target.value);
});

// Dark mode toggle
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
(function initTheme() {
  const stored = localStorage.getItem("theme");
  applyTheme(stored);
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      localStorage.removeItem("theme");
      applyTheme("");
    } else {
      localStorage.setItem("theme", "dark");
      applyTheme("dark");
    }
  });
})();

// Init
loadFromStorage();
renderContacts();
