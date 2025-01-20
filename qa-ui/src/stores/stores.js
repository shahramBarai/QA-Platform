import { readable, writable } from "svelte/store";

// ------------ USER CONFIGURATION ------------

// Get the userUuid from the local storage
let userUuid = localStorage.getItem("userUuid");
let user = {};

const createUser = async () => {
  let response = await fetch(`/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const newUser = await response.json();
  localStorage.setItem("userUuid", newUser.uuid);

  return newUser;
};

if (!userUuid) {
  // If the userUuid is not found in the local storage, create a new user
  user = await createUser();
} else {
  // Else, fetch the user information from the server
  let response = await fetch(`/api/users/${userUuid}`);
  if (response.status === 200) {
    user = await response.json();
  } else {
    // If the user is not found, create a new user
    user = await createUser();
  }
}

// Create a readable store with the user information
export const userInfo = readable(user);

// ------------ TOASTS CONFIGURATION ------------

export const toasts = writable([]);

export const addToast = (toast) => {
  // Create a unique ID so we can easily find/remove it
  // if it is dismissible/has a timeout.
  const id = Math.floor(Math.random() * 10000);

  // Setup some sensible defaults for a toast.
  const defaults = {
    id,
    type: "info",
    dismissible: true,
    timeout: 3000,
  };

  // Push the toast to the top of the list of toasts
  toasts.update((all) => [{ ...defaults, ...toast }, ...all]);

  // If toast is dismissible, dismiss it after "timeout" amount of time.
  if (toast.timeout) setTimeout(() => dismissToast(id), toast.timeout);
};

export const dismissToast = (id) => {
  toasts.update((all) => all.filter((t) => t.id !== id));
};
