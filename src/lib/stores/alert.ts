// src/lib/stores/alertStore.ts
import { writable } from "svelte/store";

type AlertType = "success" | "info" | "warning" | "error";

interface Alert {
  id: number;
  type: AlertType;
  message: string;
  timeout?: number; // Optional timeout in milliseconds
}

function createAlertStore() {
  const { subscribe, update } = writable<Alert[]>([]);

  let idCounter = 0;

  function add(type: AlertType, message: string, timeout = 5000) {
    const alert: Alert = {
      id: idCounter++,
      type,
      message,
      timeout,
    };

    update((alerts) => [...alerts, alert]);

    // Auto-remove after timeout if specified
    if (timeout > 0) {
      setTimeout(() => {
        remove(alert.id);
      }, timeout);
    }
  }

  function remove(id: number) {
    update((alerts) => alerts.filter((alert) => alert.id !== id));
  }

  return {
    subscribe,
    success: (message: string, timeout?: number) =>
      add("success", message, timeout),
    info: (message: string, timeout?: number) => add("info", message, timeout),
    warning: (message: string, timeout?: number) =>
      add("warning", message, timeout),
    error: (message: string, timeout?: number) =>
      add("error", message, timeout),
    remove,
  };
}

export const alertStore = createAlertStore();
