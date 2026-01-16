import { useEffect } from "react";

const ChatbotWidget = () => {
  useEffect(() => {
    // Avoid duplicate loads
    if (window.__chatbaseLoaded) return;
    window.__chatbaseLoaded = true;

    window.chatbaseConfig = {
      chatbotId: "2Knv76bKNafw3mdRT4iWt", // ✅ THIS VALUE
    };

    const script = document.createElement("script");
    script.src = "https://www.chatbase.co/embed.min.js";
    script.async = true;

    document.body.appendChild(script);
  }, []);

  return null;
};

export default ChatbotWidget;
