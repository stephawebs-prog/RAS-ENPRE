import React, { createContext, useContext, useEffect, useState } from "react";
import strings from "@/i18n/strings";

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("red.lang");
    return saved || "es";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("red.lang", lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);
  const t = strings[lang] || strings.en;
  const toggle = () => setLang((l) => (l === "es" ? "en" : "es"));
  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
