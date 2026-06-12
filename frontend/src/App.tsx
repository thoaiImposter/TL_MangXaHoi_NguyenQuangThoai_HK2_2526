import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import UserProfilePage from './pages/UserProfilePage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import GroupPostDetailPage from './pages/GroupPostDetailPage';
import type { SessionUser } from './types';

type MiniChatItem = {
  userId?: number;
  groupId?: number;
  minimized: boolean;
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(() => {
    const stored = localStorage.getItem('social_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [miniChats, setMiniChats] = useState<MiniChatItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('social_theme');
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    try {
      localStorage.setItem('social_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('social_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('social_user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setMiniChats([]);
    navigate('/login');
  };

  const openMiniChat = useCallback((userId: number) => {
    setMiniChats((current) => {
      const exists = current.find((c) => c.userId === userId);
      if (exists) {
        return current.map((c) => (c.userId === userId ? { ...c, minimized: false } : c));
      }
      if (current.length >= 2) {
        const trimmed = current.slice(1);
        return [...trimmed, { userId, minimized: false }];
      }
      return [...current, { userId, minimized: false }];
    });
  }, []);

  const openMiniGroupChat = useCallback((groupId: number) => {
    setMiniChats((current) => {
      const exists = current.find((c) => c.groupId === groupId);
      if (exists) {
        return current.map((c) => (c.groupId === groupId ? { ...c, minimized: false } : c));
      }
      if (current.length >= 2) {
        const trimmed = current.slice(1);
        return [...trimmed, { groupId, minimized: false }];
      }
      return [...current, { groupId, minimized: false }];
    });
  }, []);

  const closeMiniChat = useCallback((chat: { userId?: number; groupId?: number }) => {
    setMiniChats((current) => current.filter((c) => {
      if (chat.userId != null) return c.userId !== chat.userId;
      if (chat.groupId != null) return c.groupId !== chat.groupId;
      return true;
    }));
  }, []);

  const toggleMiniChat = useCallback((chat: { userId?: number; groupId?: number }) => {
    setMiniChats((current) =>
      current.map((c) => {
        if (chat.userId != null && c.userId === chat.userId) return { ...c, minimized: !c.minimized };
        if (chat.groupId != null && c.groupId === chat.groupId) return { ...c, minimized: !c.minimized };
        return c;
      })
    );
  }, []);

  const homeRoute = user ? `/users/${user.id}` : '/login';

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={homeRoute} replace />}
      />
      <Route path="/login" element={<LoginPage onAuth={setUser} />} />
      <Route path="/register" element={<RegisterPage onAuth={setUser} />} />
      <Route
        path="/home"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <HomePage user={user} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/profile" element={<Navigate to={homeRoute} replace />} />
      <Route
        path="/users/:userId"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <UserProfilePage currentUser={user} onOpenMiniChat={openMiniChat} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/settings"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <SettingsPage user={user} onUpdateUser={setUser} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/privacy"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <PrivacyPage user={user} onUpdateUser={setUser} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/friends"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <FriendsPage user={user} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
        <Route
            path="/chat/group/:groupId"
            element={
                user ? (
                    <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
                        <ChatPage user={user} />
                    </AppLayout>
                ) : (
                    <Navigate to="/login" replace />
                )
            }
        />
        <Route
            path="/chat/:userId"
            element={
                user ? (
                    <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
                        <ChatPage user={user} />
                    </AppLayout>
                ) : (
                    <Navigate to="/login" replace />
                )
            }
        />
        <Route
            path="/chat"
            element={
                user ? (
                    <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
                        <ChatPage user={user} />
                    </AppLayout>
                ) : (
                    <Navigate to="/login" replace />
                )
            }
        />
      <Route
        path="/chat"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <ChatPage user={user} />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


        <Route
        path="/groups"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <GroupsPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <GroupDetailPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/post/:postId"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <PostDetailPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/group/:groupId/post/:postId"
        element={
          user ? (
            <AppLayout onLogout={handleLogout} user={user} miniChats={miniChats} onOpenMiniChat={openMiniChat} onOpenMiniGroupChat={openMiniGroupChat} onCloseMiniChat={closeMiniChat} onToggleMiniChat={toggleMiniChat} theme={theme} onToggleTheme={toggleTheme}>
              <GroupPostDetailPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
