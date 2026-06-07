import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, totalCredits: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "logs"
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customCredits, setCustomCredits] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser.isAdmin) {
      navigate("/chat");
      return;
    }
    setUser(parsedUser);

    // Fetch Admin Data including API Logs
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        
        const [statsRes, usersRes, logsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/stats", { headers }),
          axios.get("http://localhost:5000/api/admin/users", { headers }),
          axios.get("http://localhost:5000/api/admin/logs", { headers })
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data);
        setLogs(logsRes.data || []);
      } catch (err) {
        console.error("Admin load error:", err);
        setError("Failed to load admin panel data. Make sure you are authorized.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleUpdateCredits = async (userId, amount) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/credits`,
        { credits: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, credits: res.data.user.credits } : u));
      
      // Re-fetch stats to update total credits
      const statsRes = await axios.get("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      // Clear input
      setCustomCredits(prev => ({ ...prev, [userId]: "" }));
    } catch (err) {
      alert("Error updating credits: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Are you sure you want to clear this log entry?")) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/admin/logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(prev => prev.filter(l => l._id !== logId));
    } catch (err) {
      alert("Error deleting log: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter(
    l =>
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.error?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-orb-spinner" />
        <p>INITIALIZING SECURE PROTOCOLS...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="bg"></div>
      <div className="grid-overlay"></div>
      <div className="scanline"></div>

      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-title-area">
            <span className="admin-badge">Admin Access</span>
            <h1>INDIAN AI CONTROL CENTER</h1>
          </div>
          <button className="admin-back-btn" onClick={() => navigate("/chat")}>
            <i className="bi bi-chat-dots-fill"></i> Return to Chat
          </button>
        </header>

        {error && <div className="admin-error-box">{error}</div>}

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="card-border-top"></div>
            <div className="stat-card-inner">
              <i className="bi bi-people-fill icon-cyan"></i>
              <div className="stat-data">
                <span className="stat-val">{stats.totalUsers}</span>
                <span className="stat-lbl">TOTAL USERS</span>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="card-border-top"></div>
            <div className="stat-card-inner">
              <i className="bi bi-chat-left-quote-fill icon-purple"></i>
              <div className="stat-data">
                <span className="stat-val">{stats.totalChats}</span>
                <span className="stat-lbl">TOTAL CHATS</span>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="card-border-top"></div>
            <div className="stat-card-inner">
              <i className="bi bi-lightning-charge-fill icon-yellow"></i>
              <div className="stat-data">
                <span className="stat-val">{stats.totalCredits}</span>
                <span className="stat-lbl">ACTIVE ALLOCATED CREDITS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("users");
              setSearch("");
            }}
          >
            <i className="bi bi-people-fill"></i> USER MANAGEMENT
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("logs");
              setSearch("");
            }}
          >
            <i className="bi bi-exclamation-triangle-fill"></i> SYSTEM ALERTS & LOGS
            {logs.length > 0 && <span className="logs-count-badge">{logs.length}</span>}
          </button>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder={activeTab === "users" ? "SEARCH USERNAME OR EMAIL..." : "SEARCH USER, ERROR DETAILS..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* User Management Tab Content */}
        {activeTab === "users" && (
          <div className="admin-table-card">
            <div className="card-border-top"></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>USERNAME</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>CURRENT CREDITS</th>
                    <th>LAST LOGIN</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td className="username-cell">{u.username}</td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.isAdmin ? "role-admin" : "role-user"}`}>
                            {u.isAdmin ? "ADMIN" : "USER"}
                          </span>
                        </td>
                        <td className="credits-cell">
                          <span className="credits-number">{u.credits}</span> / 25
                        </td>
                        <td className="login-cell">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                        </td>
                        <td>
                          <div className="actions-wrapper">
                            <button
                              className="action-btn btn-reset"
                              onClick={() => handleUpdateCredits(u._id, 25)}
                            >
                              Reset (25)
                            </button>
                            
                            <div className="custom-adjust-box">
                              <input
                                type="number"
                                min="0"
                                placeholder="QTY"
                                value={customCredits[u._id] || ""}
                                onChange={(e) =>
                                  setCustomCredits((prev) => ({ ...prev, [u._id]: e.target.value }))
                                }
                              />
                              <button
                                className="action-btn btn-add"
                                onClick={() => {
                                  const val = customCredits[u._id];
                                  if (val !== undefined && val !== "") {
                                    handleUpdateCredits(u._id, val);
                                  }
                                }}
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-users-cell">
                        NO PROTOCOLS MATCH SEARCH QUERY
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Alerts & Logs Tab Content */}
        {activeTab === "logs" && (
          <div className="admin-table-card">
            <div className="card-border-top"></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>RESPONSIBLE USER</th>
                    <th>API STATUS</th>
                    <th>ERROR DETAILS</th>
                    <th>USER PROMPT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((l) => (
                      <tr key={l._id}>
                        <td className="login-cell">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="username-cell">
                          <div className="log-user-info">
                            <strong>{l.username}</strong>
                            <div className="log-user-email">{l.userEmail}</div>
                            <small className="log-user-id">ID: {l.userId}</small>
                          </div>
                        </td>
                        <td>
                          <span className="role-badge role-admin" style={{ padding: '3px 8px', textShadow: '0 0 10px rgba(255, 0, 60, 0.3)' }}>
                            ERR {l.status}
                          </span>
                        </td>
                        <td className="email-cell" style={{ maxWidth: '280px', wordBreak: 'break-word', color: '#ff5577', fontStyle: 'italic' }}>
                          {l.error}
                        </td>
                        <td className="credits-cell" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.prompt}>
                          {l.prompt || "N/A"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="action-btn btn-reset"
                            style={{ background: 'rgba(255, 0, 60, 0.08)', border: '1px solid rgba(255, 0, 60, 0.3)', color: '#ff003c' }}
                            onClick={() => handleDeleteLog(l._id)}
                          >
                            Clear Alert
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-users-cell">
                        NO ACTIVE API LOGS OR ALERTS DETECTED
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
