// errorMessages.ts

export const errorMessages = {
  typescript: "Lehet, hogy TypeScript hiba van a kódodban. Nézd meg a szerkesztőt a részletekért.",
  transpile: "A kódod nem fordítható le. Lehet, hogy szintaktikai vagy fordítási hiba van benne.",
  render: "A kód lefordult, de nem generálódott HTML kimenet. Ellenőrizd a render függvényt.",
};

export type ErrorType = keyof typeof errorMessages | null;
