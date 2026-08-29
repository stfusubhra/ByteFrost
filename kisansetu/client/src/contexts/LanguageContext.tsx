import { createContext, useContext } from "react";

const LanguageContext = createContext({
  t: (key: string) => key, // fallback: return the key itself
  lang: "en",
  setLang: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = React.useState("en");
  
  const t = (key: string) => {
    // Simple fallback - in a real app, this would look up translations
    // For now, we'll return the key or a simple mapping
    const translations: Record<string, string> = {
      "login.err.emailOrPhoneRequired": "Please enter your email or phone number",
      "login.err.passwordRequired": "Please enter your password"
    };
    
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t, lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
