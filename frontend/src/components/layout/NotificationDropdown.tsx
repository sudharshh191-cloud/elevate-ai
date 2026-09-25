import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, FileText, Sparkles, Share2, Check } from 'lucide-react';
import { ApiService } from '../../services/api';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  onNavigateToSession?: (sessionId: string) => void;
  onNavigateToResume?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onNavigateToSession,
  onNavigateToResume,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await ApiService.getNotifications(1, 15);
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // poll every 20s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await ApiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      handleMarkRead(item._id);
    }
    setIsOpen(false);

    if (item.referenceType === 'InterviewSession' || item.referenceType === 'FeedbackReport') {
      if (item.referenceId && onNavigateToSession) {
        onNavigateToSession(item.referenceId);
      }
    } else if (item.referenceType === 'Resume' && onNavigateToResume) {
      onNavigateToResume();
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resume_parsed':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'interview_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'scorecard_ready':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'scorecard_shared':
        return <Share2 className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center space-y-1.5 p-4 text-slate-500">
                <Bell className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Notifications Yet</p>
                <p className="text-[11px] text-slate-500">
                  You'll receive notifications when your resume is parsed, assessments complete, or reports are generated.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !item.read ? 'bg-indigo-50/30' : 'bg-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{item.message}</p>
                  </div>
                  {!item.read && (
                    <button
                      onClick={(e) => handleMarkRead(item._id, e)}
                      title="Mark as read"
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
