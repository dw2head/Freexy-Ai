import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevChats, setPrevChats] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(25);

  const [currentUser, setCurrentUser] = useState(null);

  // Chat Sessions States
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [mode, setMode] = useState("daily");

  // Load user from storage initially
  useEffect(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch chat history and user profile on mount if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      // Fetch user profile (credits)
      axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data && res.data.user) {
          setCredits(res.data.user.credits);
          setCurrentUser(res.data.user);
          if (localStorage.getItem("token")) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
          } else {
            sessionStorage.setItem("user", JSON.stringify(res.data.user));
          }
        }
      })
      .catch(err => console.error("Failed to load user profile:", err));

      // Fetch chat history
      axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setPrevChats(res.data);
          // Load the first (most recent) chat session by default if it exists
          if (res.data.length > 0) {
            const firstChat = res.data[0];
            setActiveChatId(firstChat._id);
            setActiveChatMessages(firstChat.messages || []);
            setShowResults(true);
          }
        }
      })
      .catch(err => console.error("Failed to load chat history:", err));
    }
  }, []);

  const newChat = () => {
    setLoading(false);
    setShowResults(false);
    setActiveChatId(null);
    setActiveChatMessages([]);
    setTypingText("");
    setInput("");
  };

  const selectPastChat = (chat) => {
    setLoading(false);
    setShowResults(true);
    setActiveChatId(chat._id);
    setActiveChatMessages(chat.messages || []);
    setRecentPrompt(chat.title || "Chat History");
    setTypingText("");
  };

  const deleteChat = async (chatId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedChats = prevChats.filter(c => c._id !== chatId);
      setPrevChats(updatedChats);

      if (activeChatId === chatId) {
        if (updatedChats.length > 0) {
          selectPastChat(updatedChats[0]);
        } else {
          newChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Error deleting chat: " + (err.response?.data?.message || err.message));
    }
  };

  const renameChat = async (chatId, newTitle) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.patch(`http://localhost:5000/api/chat/${chatId}`, 
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPrevChats(prev => prev.map(c => c._id === chatId ? res.data : c));
    } catch (err) {
      console.error("Failed to rename chat:", err);
      alert("Error renaming chat: " + (err.response?.data?.message || err.message));
    }
  };

  const onSent = async (prompt) => {
    const currentPrompt = prompt || input;
    if (!currentPrompt.trim()) return;

    setLoading(true);
    setShowResults(true);
    setRecentPrompt(currentPrompt);
    setInput("");

    // Append user message immediately to the UI
    const userMsg = {
      role: "user",
      content: currentPrompt,
      createdAt: new Date().toISOString()
    };
    setActiveChatMessages(prev => [...prev, userMsg]);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          prompt: currentPrompt,
          chatId: activeChatId,
          mode
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const { response, chat: updatedChat } = res.data;

      // Update activeChatId to the saved session ID
      setActiveChatId(updatedChat._id);

      // Update prevChats list
      setPrevChats(prev => {
        const exists = prev.some(c => c._id === updatedChat._id);
        if (exists) {
          return prev.map(c => c._id === updatedChat._id ? updatedChat : c)
                     .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          return [updatedChat, ...prev];
        }
      });

      // Update user credits in local storage / session storage
      if (res.data.credits !== undefined) {
        setCredits(res.data.credits);
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.credits = res.data.credits;
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(userObj));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
        }
      }

      // Process response formatting (bold and linebreaks)
      let responseArray = response.split("**");
      let newResponse = "";
      for (let i = 0; i < responseArray.length; i++) {
        if (i === 0 || i % 2 !== 1) {
          newResponse += responseArray[i];
        } else {
          newResponse += "<b>" + responseArray[i] + "</b>";
        }
      }
      let formattedResponse = newResponse.split("*").join("<br/>");

      // Character-by-character typewriter reveal
      let currentTypewriting = "";
      setTypingText("");

      const charArray = formattedResponse.split("");
      charArray.forEach((char, idx) => {
        setTimeout(() => {
          currentTypewriting += char;
          setTypingText(currentTypewriting);

          // Once typing is fully complete:
          if (idx === charArray.length - 1) {
            const assistantMsg = {
              role: "assistant",
              content: response,
              createdAt: new Date().toISOString()
            };
            setActiveChatMessages(prev => [...prev, assistantMsg]);
            setTypingText("");
          }
        }, 15 * idx);
      });

    } catch (error) {
      console.error("FREEXY AI Error:", error);
      const errMsg = error.response?.data?.message || "Error getting response from FREEXY AI.";
      
      const errorMsg = {
        role: "assistant",
        content: errMsg,
        createdAt: new Date().toISOString()
      };
      setActiveChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    prevChats,
    setPrevChats,
    activeChatId,
    activeChatMessages,
    typingText,
    onSent,
    setRecentPrompt,
    recentPrompt,
    input,
    setInput,
    showResults,
    loading,
    newChat,
    credits,
    selectPastChat,
    deleteChat,
    renameChat,
    mode,
    setMode,
    currentUser,
    setCurrentUser
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;
