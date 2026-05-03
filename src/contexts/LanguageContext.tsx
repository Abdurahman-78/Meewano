import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar" | "ku";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("meewano-language", lang);
    // Update HTML dir attribute for RTL languages
    document.documentElement.dir = (lang === "ar" || lang === "ku") ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem("meewano-language") as Language;
    if (savedLanguage && ["en", "ar", "ku"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const dir = (language === "ar" || language === "ku") ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};