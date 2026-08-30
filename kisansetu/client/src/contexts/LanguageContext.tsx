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
       "login.err.passwordRequired": "Please enter your password",
       "login.h1": "Sign in to KisanSetu",
       "login.p": "Access your account to buy, sell, and manage your agricultural produce",
       "login.email.label": "Email or Phone",
       "login.email.placeholder": "Enter your email or phone number",
       "login.phone.placeholder": "Enter your email or phone number",
       "login.password.label": "Password",
       "login.password.forgot": "Forgot password?",
       "login.password.placeholder": "Enter your password",
       "login.password.hide": "Hide password",
       "login.password.show": "Show password",
       "login.submitting": "Signing in...",
       "login.submit": "Sign in",
       "common.or": "or",
       "login.noAccount": "Don't have an account?",
       "login.createAccount": "Sign up",
       "login.demo.toggle": "Show demo credentials",
       "login.demo.hide": "Hide demo credentials",
       "login.demo.farmer": "Login as Farmer Demo",
       "login.demo.buyer": "Login as Buyer Demo"
     };
     
     return translations[key] || key;
   };
   
   return (
     <LanguageContext.Provider value={{ t, lang, setLang }}>
       {children}
     </LanguageContext.Provider>
   );
 };
