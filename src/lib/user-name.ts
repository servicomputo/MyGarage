// Helper para guardar y leer el nombre del usuario en localStorage
// (funciona tanto en navegador como en Capacitor/APK)

const USER_NAME_KEY = "mg_user_name";

export function getUserName(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function setUserName(name: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(USER_NAME_KEY, name.trim());
}

export function hasUserName(): boolean {
  if (typeof localStorage === "undefined") return false;
  return !!localStorage.getItem(USER_NAME_KEY);
}
