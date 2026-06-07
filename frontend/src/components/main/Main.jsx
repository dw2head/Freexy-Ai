import React, { useContext, useEffect, useRef, useState } from "react";
import "./main.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

const FEATURE_CARDS = [
  {
    icon: "bi-heart-pulse-fill",
    title: "Freexy Agni (Fitness)",
    desc: "Empowering your health, workouts, daily tracker, and wellness journey.",
  },
  {
    icon: "bi-body-text",
    title: "Freexy Vaani (Script)",
    desc: "Structuring stories, scene-by-scene script writing, and narration scripts.",
  },
  {
    icon: "bi-book-half",
    title: "Freexy Pragya (Study)",
    desc: "Empowering knowledge, academic guides, and learning pathways.",
  },
];

const renderUserAvatar = (userObj, className = "avatar-img") => {
  if (userObj?.avatar && userObj.avatar.startsWith("bi-")) {
    let bg = "rgba(58, 134, 255, 0.15)";
    let color = "#00f0ff";
    if (userObj.avatar.includes("pulse")) { bg = "rgba(255, 42, 95, 0.15)"; color = "#ff2a5f"; }
    else if (userObj.avatar.includes("book")) { bg = "rgba(255, 183, 3, 0.15)"; color = "#ffb703"; }
    else if (userObj.avatar.includes("cpu")) { bg = "rgba(157, 78, 221, 0.15)"; color = "#9d4edd"; }
    else if (userObj.avatar.includes("shield")) { bg = "rgba(0, 255, 150, 0.15)"; color = "#00ff96"; }
    
    return (
      <span className={`user-avatar-icon-wrapper ${className}`} style={{ background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
        <i className={`bi ${userObj.avatar}`} style={{ fontSize: 'inherit' }} />
      </span>
    );
  }
  if (userObj?.avatar) {
    return <img src={userObj.avatar} alt="Profile" className={className} />;
  }
  return <img src={assets.user} alt="Profile" className={className} />;
};

const Main = () => {
  const {
    input,
    setInput,
    onSent,
    prevChats,
    showResults,
    loading,
    credits,
    activeChatId,
    activeChatMessages,
    typingText,
    selectPastChat,
    newChat,
    deleteChat,
    renameChat,
    mode,
    setMode,
    currentUser,
    setCurrentUser
  } = useContext(Context);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Onboarding form states
  const [obName, setObName] = useState("");
  const [obAge, setObAge] = useState("");
  const [obHeardFrom, setObHeardFrom] = useState("Google");
  const [obError, setObError] = useState("");

  // Profile form states
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileCustomAvatarUrl, setProfileCustomAvatarUrl] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Trigger onboarding modal on mount if not completed
  useEffect(() => {
    if (currentUser && !currentUser.onboardingCompleted) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(false);
  }, []);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages, typingText, loading]);

  const handleSend = () => {
    if (input.trim()) onSent();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleRenameActiveChat = () => {
    if (!activeChatId) return;
    const activeChat = prevChats.find((c) => c._id === activeChatId);
    if (!activeChat) return;

    const newTitle = window.prompt("Rename Chat Session:", activeChat.title);
    if (newTitle && newTitle.trim() && newTitle.trim() !== activeChat.title) {
      renameChat(activeChatId, newTitle.trim());
    }
  };

  const handleDeleteActiveChat = () => {
    if (!activeChatId) return;
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      deleteChat(activeChatId);
    }
  };

  const openProfileSettings = () => {
    if (currentUser) {
      setProfileUsername(currentUser.username || "");
      setProfilePassword("");
      setProfileConfirmPassword("");
      setProfileAvatar(currentUser.avatar || "bi-person-badge-fill");
      setProfileCustomAvatarUrl(currentUser.avatar && !currentUser.avatar.startsWith("bi-") ? currentUser.avatar : "");
      setProfileError("");
      setProfileSuccess("");
      setShowProfileModal(true);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!obName.trim()) {
      setObError("Name is required");
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/auth/onboarding", {
        name: obName.trim(),
        age: obAge,
        heardFrom: obHeardFrom
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCurrentUser(res.data.user);
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(res.data.user));
        setShowOnboardingModal(false);
      }
    } catch (err) {
      console.error(err);
      setObError(err.response?.data?.message || err.message || "Failed to submit onboarding");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setProfileError("Passwords do not match");
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const avatarValue = profileCustomAvatarUrl.trim() || profileAvatar;
      const res = await axios.put("http://localhost:5000/api/auth/profile", {
        username: profileUsername.trim(),
        password: profilePassword || undefined,
        avatar: avatarValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCurrentUser(res.data.user);
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(res.data.user));
        setProfileSuccess("Profile updated successfully!");
        setProfileError("");
        setTimeout(() => setShowProfileModal(false), 1200);
      }
    } catch (err) {
      console.error(err);
      setProfileSuccess("");
      setProfileError(err.response?.data?.message || err.message || "Failed to update profile");
    }
  };

  const formatMessageContent = (content) => {
    if (!content) return "";
    let responseArray = content.split("**");
    let newResponse = "";
    for (let i = 0; i < responseArray.length; i++) {
      if (i === 0 || i % 2 !== 1) {
        newResponse += responseArray[i];
      } else {
        newResponse += "<b>" + responseArray[i] + "</b>";
      }
    }
    return newResponse.split("*").join("<br/>");
  };

  return (
    <div className="main-app">
      <div className="main-bg-glow main-bg-glow--tr" />
      <div className="main-bg-glow main-bg-glow--bl" />

      {/* Sidebar */}
      <aside className="main-sidebar">
        <div className="sidebar-workspace">
          <div className="workspace-avatar">S</div>
          <div className="workspace-info">
            <span className="workspace-name">SYNTRIX ORG</span>
            <span className="workspace-status">Collaborative Suite</span>
          </div>
        </div>

        <button type="button" className="sidebar-new-chat-btn" onClick={newChat}>
          <i className="bi bi-plus-lg" />
          <span>New Discussion</span>
        </button>

        <div className="sidebar-history-container">
          {/* Collaborators Section (DMs) */}
          <div className="sidebar-section">
            <p className="sidebar-section-title">COLLABORATORS</p>
            <div className="collaborators-list">
              <button
                type="button"
                className={`collaborator-item ${mode === "daily" ? "active" : ""}`}
                onClick={() => setMode("daily")}
              >
                <div className="collaborator-avatar agni">
                  <i className="bi bi-heart-pulse-fill" />
                  <span className="status-dot online"></span>
                </div>
                <div className="collaborator-info">
                  <span className="collaborator-name">Freexy Agni</span>
                  <span className="collaborator-desc">Fitness Advisor</span>
                </div>
              </button>

              <button
                type="button"
                className={`collaborator-item ${mode === "script" ? "active" : ""}`}
                onClick={() => setMode("script")}
              >
                <div className="collaborator-avatar vaani">
                  <i className="bi bi-body-text" />
                  <span className="status-dot online"></span>
                </div>
                <div className="collaborator-info">
                  <span className="collaborator-name">Freexy Vaani</span>
                  <span className="collaborator-desc">Script Writer</span>
                </div>
              </button>

              <button
                type="button"
                className="collaborator-item offline"
                onClick={() => alert("Freexy Pragya (Study Assistant) will be released in v1.0 on 13th June 2026! It provides academic support, learning pathways, and tutoring.")}
              >
                <div className="collaborator-avatar pragya">
                  <i className="bi bi-book" />
                  <span className="status-dot offline"></span>
                </div>
                <div className="collaborator-info">
                  <span className="collaborator-name">Freexy Pragya</span>
                  <span className="collaborator-desc">Study Guide</span>
                </div>
                <span className="collaborator-badge">v1.0</span>
              </button>

              <button
                type="button"
                className="collaborator-item offline"
                onClick={() => alert("Freexy Eclips (Coding Assistant) will be released in future update 5.0! It provides automated code generation, debugging, and software engineering.")}
              >
                <div className="collaborator-avatar eclips">
                  <i className="bi bi-code-slash" />
                  <span className="status-dot offline"></span>
                </div>
                <div className="collaborator-info">
                  <span className="collaborator-name">Freexy Eclips</span>
                  <span className="collaborator-desc">Coding Advisor</span>
                </div>
                <span className="collaborator-badge">v5.0</span>
              </button>
            </div>
          </div>

          {/* Active Discussions Section */}
          <div className="sidebar-section">
            <p className="sidebar-section-title">ACTIVE DISCUSSIONS</p>
            <div className="sidebar-history">
              {prevChats && prevChats.length > 0 ? (
                prevChats.map((chat, idx) => (
                  <div
                    key={chat._id || idx}
                    className={`history-item-container ${chat._id === activeChatId ? "active" : ""}`}
                  >
                    <button
                      type="button"
                      className="history-item"
                      onClick={() => selectPastChat(chat)}
                    >
                      <i className="bi bi-hash" style={{ color: chat._id === activeChatId ? "#00f0ff" : "rgba(180,210,240,0.45)" }} />
                      <span>{chat.title || "discussion-thread"}</span>
                    </button>
                    <div className="history-item-actions">
                      <button
                        type="button"
                        className="inline-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTitle = window.prompt("Rename Discussion:", chat.title);
                          if (newTitle && newTitle.trim() && newTitle.trim() !== chat.title) {
                            renameChat(chat._id, newTitle.trim());
                          }
                        }}
                        title="Rename Discussion"
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="inline-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this discussion thread?")) {
                            deleteChat(chat._id);
                          }
                        }}
                        title="Delete Discussion"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-sessions-text">No active threads</p>
              )}
            </div>
          </div>
        </div>

        {/* User Card Profile Footer */}
        <div className="sidebar-user-card" onClick={openProfileSettings} style={{ cursor: "pointer" }}>
          {renderUserAvatar(currentUser, "user-card-avatar")}
          <div className="user-card-info">
            <span className="user-card-name">{currentUser?.username || "User"}</span>
            <span className="user-card-email">{currentUser?.email || "member@syntrix.org"}</span>
          </div>
          <button
            type="button"
            className="user-card-logout-btn"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <div className="main-panel">
        <header className="main-header">
          <div className="active-channel-info">
            <i className="bi bi-hash active-channel-hash" />
            <div className="active-channel-details">
              <span className="active-channel-name">
                {activeChatId
                  ? (prevChats.find(c => c._id === activeChatId)?.title || "discussion-thread")
                  : (mode === "daily" ? "freexy-agni" : mode === "script" ? "freexy-vaani" : "general")}
              </span>
              <span className="active-channel-status">
                <span className="channel-status-dot"></span>
                {mode === "daily" ? "Freexy Agni (Fitness Coach)" : "Freexy Vaani (Script Writer)"}
              </span>
            </div>
            {activeChatId && (
              <div className="channel-action-group">
                <button
                  type="button"
                  className="channel-action-btn"
                  onClick={handleRenameActiveChat}
                  title="Rename Channel"
                >
                  <i className="bi bi-pencil" />
                </button>
                <button
                  type="button"
                  className="channel-action-btn"
                  onClick={handleDeleteActiveChat}
                  title="Delete Channel"
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {currentUser?.isAdmin &&
              ["admin1@freexy.ai", "admin2@freexy.ai", "admin3@freexy.ai", "admin4@freexy.ai"].includes(
                currentUser.email
              ) && (
                <a
                  href="/admin"
                  className="admin-link-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "rgba(255, 0, 60, 0.08)",
                    border: "1px solid rgba(255, 0, 60, 0.25)",
                    borderRadius: "20px",
                    color: "#ff003c",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    textDecoration: "none",
                  }}
                >
                  <i className="bi bi-shield-lock-fill" style={{ color: "#ff003c" }}></i>
                  <span>ADMIN PANEL</span>
                </a>
              )}
            <div
              className="credits-badge"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(0, 240, 255, 0.08)",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                borderRadius: "20px",
                color: "#00f0ff",
                fontSize: "0.85rem",
                fontWeight: "600",
                letterSpacing: "1px",
              }}
            >
              <i className="bi bi-lightning-charge-fill" style={{ color: "#00f0ff" }}></i>
              <span>{credits} / 25 CREDITS</span>
            </div>
            <div onClick={openProfileSettings} style={{ cursor: "pointer" }} title="Edit Profile">
              {renderUserAvatar(currentUser, "main-avatar")}
            </div>
          </div>
        </header>

        <section className="main-hero">
          {!showResults ? (
            <div className="channel-welcome-card">
              <div className={`channel-welcome-avatar ${mode}`}>
                {mode === "daily" ? (
                  <i className="bi bi-heart-pulse-fill" />
                ) : (
                  <i className="bi bi-body-text" />
                )}
              </div>
              <h1 className="channel-welcome-title">
                This is the start of your discussion with <span>{mode === "daily" ? "Freexy Agni" : "Freexy Vaani"}</span>
              </h1>
              <p className="channel-welcome-desc">
                {mode === "daily"
                  ? "Freexy Agni is your personal health advisor, fitness coach, and everyday conversation partner. Ask for workout plans, meal ideas, or daily advice."
                  : "Freexy Vaani is your creative screenplay and script writing collaborator. Work stepwise through acts, scenes, and narration scripts."}
              </p>
              <div className="channel-welcome-divider" />
              <div className="channel-welcome-tips">
                <p><i className="bi bi-info-circle" /> Tips for this workspace:</p>
                <ul>
                  <li>Your discussions are automatically logged in the left panel.</li>
                  <li>Click on a message block to edit or copy text.</li>
                  <li>Switch between workspaces instantly in the Collaborators tab.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="main-results-container">
              {/* Channel Header Block */}
              <div className="chat-channel-intro">
                <div className={`chat-channel-intro-avatar ${mode}`}>
                  {mode === "daily" ? (
                    <i className="bi bi-heart-pulse-fill" />
                  ) : (
                    <i className="bi bi-body-text" />
                  )}
                </div>
                <h3>{mode === "daily" ? "Freexy Agni" : "Freexy Vaani"}</h3>
                <p className="intro-meta">
                  This channel was created on {new Date().toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}. 
                  All messaging logs are secured.
                </p>
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  <span>Active Channel &bull; Advisor Online</span>
                </div>
              </div>

              {activeChatMessages &&
                activeChatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === "user" ? (
                        renderUserAvatar(currentUser, "avatar-img")
                      ) : mode === "daily" ? (
                        <span className="ai-avatar-icon agni"><i className="bi bi-heart-pulse-fill" /></span>
                      ) : (
                        <span className="ai-avatar-icon vaani"><i className="bi bi-body-text" /></span>
                      )}
                    </div>
                    <div className="message-content-wrapper">
                      <div className="message-header-meta">
                        <span className="message-sender-name">
                          {msg.role === "user" ? (currentUser?.username || "You") : (mode === "daily" ? "Freexy Agni" : "Freexy Vaani")}
                        </span>
                        <span className="message-timestamp">
                          {new Date().toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="message-bubble">
                        {msg.role === "user" ? (
                          <p style={{ margin: 0 }}>{msg.content}</p>
                        ) : (
                          <div
                            className="results-content"
                            dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Typewriter message */}
              {typingText && (
                <div className="chat-message assistant typing">
                  <div className="message-avatar">
                    {mode === "daily" ? (
                      <span className="ai-avatar-icon agni"><i className="bi bi-heart-pulse-fill" /></span>
                    ) : (
                      <span className="ai-avatar-icon vaani"><i className="bi bi-body-text" /></span>
                    )}
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-header-meta">
                      <span className="message-sender-name">
                        {mode === "daily" ? "Freexy Agni" : "Freexy Vaani"}
                      </span>
                      <span className="message-timestamp">typing...</span>
                    </div>
                    <div className="message-bubble">
                      <div
                        className="results-content"
                        dangerouslySetInnerHTML={{ __html: typingText }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && !typingText && (
                <div className="chat-message assistant thinking">
                  <div className="message-avatar">
                    {mode === "daily" ? (
                      <span className="ai-avatar-icon agni"><i className="bi bi-heart-pulse-fill" /></span>
                    ) : (
                      <span className="ai-avatar-icon vaani"><i className="bi bi-body-text" /></span>
                    )}
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-header-meta">
                      <span className="message-sender-name">
                        {mode === "daily" ? "Freexy Agni" : "Freexy Vaani"}
                      </span>
                      <span className="message-timestamp">thinking...</span>
                    </div>
                    <div className="message-bubble">
                      <div className="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="chat-composer">
            <textarea
              className="chat-composer-input"
              placeholder="How can I help you?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <div className="chat-composer-footer">
              <div className="composer-left">
                <button type="button" className="composer-pill-btn attach-btn" aria-label="Attach files">
                  <i className="bi bi-paperclip" />
                  <span>Attach files</span>
                </button>
                <div className="model-dropdown-container" ref={dropdownRef}>
                  <button
                    type="button"
                    className="composer-pill-btn model-select-btn"
                    onClick={() => setDropdownOpen(prev => !prev)}
                  >
                    {mode === "daily" ? (
                      <i className="bi bi-heart-pulse-fill" style={{ color: "#ff2a5f" }} />
                    ) : mode === "script" ? (
                      <i className="bi bi-body-text" style={{ color: "#00f0ff" }} />
                    ) : (
                      <i className="bi bi-cpu" style={{ color: "#00f0ff" }} />
                    )}
                    <span>
                      {mode === "daily" ? "Freexy Agni" : mode === "script" ? "Freexy Vaani" : "Freexy Ai"}
                    </span>
                    <i className="bi bi-chevron-down" />
                  </button>
                  {dropdownOpen && (
                    <div className="model-dropdown-menu">
                      <button
                        type="button"
                        className={`dropdown-menu-item ${mode === "daily" ? "active" : ""}`}
                        onClick={() => {
                          setMode("daily");
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-heart-pulse-fill" style={{ color: "#ff2a5f" }} />
                        <div className="menu-item-text">
                          <span className="menu-item-name">Freexy Agni</span>
                          <span className="menu-item-desc">Fitness Tracker & Daily Conversations</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`dropdown-menu-item ${mode === "script" ? "active" : ""}`}
                        onClick={() => {
                          setMode("script");
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-body-text" style={{ color: "#00f0ff" }} />
                        <div className="menu-item-text">
                          <span className="menu-item-name">Freexy Vaani</span>
                          <span className="menu-item-desc">Creative Stepwise Script Writing</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="dropdown-menu-item disabled"
                        onClick={() => {
                          alert("Freexy Pragya (Study Assistant) will be released in v1.0 on 13th June 2026! It provides academic support, learning pathways, and tutoring.");
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-book" style={{ color: "#ffb703" }} />
                        <div className="menu-item-text">
                          <span className="menu-item-name">Freexy Pragya</span>
                          <span className="menu-item-desc">Advanced Study Guide & Tutoring</span>
                        </div>
                        <span className="dropdown-badge">v1.0</span>
                      </button>
                      <button
                        type="button"
                        className="dropdown-menu-item disabled"
                        onClick={() => {
                          alert("Freexy Eclips (Coding Assistant) will be released in future update 5.0! It provides automated code generation, debugging, and software engineering.");
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-code-slash" style={{ color: "#9d4edd" }} />
                        <div className="menu-item-text">
                          <span className="menu-item-name">Freexy Eclips</span>
                          <span className="menu-item-desc">Code Generation & Software Update</span>
                        </div>
                        <span className="dropdown-badge">v5.0</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="send-btn"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          </div>

          {!showResults && (
            <div className="feature-cards">
              {FEATURE_CARDS.map((card) => (
                <article key={card.title} className="feature-card">
                  <div className="feature-card-icon">
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">Welcome to Freexy Workspace</h2>
            <p className="modal-desc">Please complete these brief questions to activate your account.</p>
            {obError && <div className="modal-error">{obError}</div>}
            <form className="modal-form" onSubmit={handleOnboardingSubmit}>
              <div className="form-group">
                <label className="form-label">What should we call you? (Name)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your name" 
                  value={obName} 
                  onChange={(e) => setObName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">How old are you? (Age)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Enter your age" 
                  value={obAge} 
                  onChange={(e) => setObAge(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Where you Saw About Freexy Ai?</label>
                <select 
                  className="form-select" 
                  value={obHeardFrom} 
                  onChange={(e) => setObHeardFrom(e.target.value)}
                  required
                >
                  <option value="Google">Google Search</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Friend">A Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="modal-btn btn-primary">Complete Setup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Profile Settings</h2>
            <p className="modal-desc">Modify your name, password, or select a custom avatar.</p>
            {profileError && <div className="modal-error">{profileError}</div>}
            {profileSuccess && <div className="modal-success">{profileSuccess}</div>}
            <form className="modal-form" onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Display Name / Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileUsername} 
                  onChange={(e) => setProfileUsername(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="New password" 
                  value={profilePassword} 
                  onChange={(e) => setProfilePassword(e.target.value)} 
                />
              </div>
              {profilePassword && (
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Confirm password" 
                    value={profileConfirmPassword} 
                    onChange={(e) => setProfileConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Choose Avatar Preset</label>
                <div className="avatar-presets">
                  {[
                    "bi-person-badge-fill",
                    "bi-heart-pulse-fill",
                    "bi-body-text",
                    "bi-cpu",
                    "bi-mortarboard-fill",
                    "bi-shield-check",
                    "bi-controller",
                    "bi-stars"
                  ].map((avatarIcon) => (
                    <button
                      key={avatarIcon}
                      type="button"
                      className={`avatar-preset-btn ${profileAvatar === avatarIcon && !profileCustomAvatarUrl ? "active" : ""}`}
                      onClick={() => {
                        setProfileAvatar(avatarIcon);
                        setProfileCustomAvatarUrl("");
                      }}
                    >
                      <i className={`bi ${avatarIcon}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Or Custom Avatar Image URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://example.com/avatar.jpg" 
                  value={profileCustomAvatarUrl} 
                  onChange={(e) => setProfileCustomAvatarUrl(e.target.value)} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="modal-btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
