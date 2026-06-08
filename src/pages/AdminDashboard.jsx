import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  XCircle,
  Clock,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  Send,
  Settings,
  Lock,
  Edit3,
  RefreshCw,
  Truck,
  Percent,
  CheckCircle,
  MessageSquare,
  Eye,
  AlertCircle,
  FolderTree,
  ClipboardList,
  Plus,
  Tag,
  Save,
  X,
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  FileText,
  RotateCcw,
  Ban,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useDashboardNavigationGuard from '../utils/useDashboardNavigationGuard';
import MultipleImageUpload from '../components/MultipleImageUpload';
import AdminSidebar from '../components/AdminSidebar';
import SpecialOfferManager from '../components/SpecialOfferManager';
import HeroVideoManager from '../components/HeroVideoManager';
import AdvertisementManager from '../components/AdvertisementManager';
import CustomerReviewsView from '../components/CustomerReviewsView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Analytics helpers ─────────────────────────────────────────────────────
const ANALYTICS_PAGE_SIZE = 10;
const MANAGEMENT_PAGE_SIZE = 10;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeSearchText = (value) => String(value || '').toLowerCase();
const simplifySearchText = (value) => normalizeSearchText(value).replace(/[aeiou]/g, '').replace(/[^a-z0-9]/g, '');
const fuzzyIncludes = (source, term) => {
  const normalizedSource = normalizeSearchText(source);
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return true;
  return normalizedSource.includes(normalizedTerm) || simplifySearchText(normalizedSource).includes(simplifySearchText(normalizedTerm));
};

const normalizeDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
// ───────────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();
  useDashboardNavigationGuard({
    enabled: Boolean(isAuthenticated),
    message: 'You are leaving the Admin Dashboard. Unsaved dashboard context may be lost. Continue?'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState(() => localStorage.getItem('adminDashboardActiveView') || 'dashboard');

  // Data states
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  // Messages pagination
  const [messagesPage, setMessagesPage] = useState(1);
  const messagesPerPage = 5;

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('adminDashboardSearchTerm') || '');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('adminDashboardStatusFilter') || 'All');
  const [sourceFilter, setSourceFilter] = useState(() => localStorage.getItem('adminDashboardSourceFilter') || 'All');
  const [productsPage, setProductsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [compactVerifyModal, setCompactVerifyModal] = useState(true);
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptTransportDraft, setReceiptTransportDraft] = useState({});
  const [receiptUpdatingOrderId, setReceiptUpdatingOrderId] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState({
    bank_bk_account: '',
    bank_equity_account: '',
    mobile_mtn_number: '',
    mobile_airtel_number: '',
    tin_number: '',
    ebm_number: '',
    reference_prefix: 'PAY',
    notes: ''
  });
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(false);
  const [paymentOptionsSaving, setPaymentOptionsSaving] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('monthly');
  const [topCustomersPage, setTopCustomersPage] = useState(1);
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [businessStatusPage, setBusinessStatusPage] = useState(1);
  const [productsReportPage, setProductsReportPage] = useState(1);
  // Reports
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('daily');
  const [reportGenerated, setReportGenerated] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
  // Order comments & items
  const [orderComments, setOrderComments] = useState({});
  const [expandedOrderComments, setExpandedOrderComments] = useState({});
  const [expandedOrderItems, setExpandedOrderItems] = useState({});
  const [newComment, setNewComment] = useState({});
  const [sendingComment, setSendingComment] = useState(null);

  // Toast & Confirm Dialog system (replaces browser alert/confirm)
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const shownNotifIdsRef = React.useRef(new Set());

  const loadNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) {
        const freshNotifs = d.notifications || [];
        setNotifications(freshNotifs);
        const unread = freshNotifs.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);

        // Show popup toast for new unread notifications
        freshNotifs.forEach(notif => {
          if (!notif.is_read && !shownNotifIdsRef.current.has(notif.id)) {
            shownNotifIdsRef.current.add(notif.id);
            const icon = notif.type === 'order' ? '📦' : notif.type === 'message' ? '💬' : '🔔';
            showToast(`${icon} ${notif.message}`, 'info');
          }
        });
      }
    } catch (e) { console.error('Failed to load notifications', e); }
  };

  const openNotificationLink = async (notification) => {
    try {
      if (notification?.id && !notification?.is_read) {
        await fetch(`http://localhost:5000/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }

      const rawLink = String(notification?.link || '').trim();
      const link = rawLink.toLowerCase();
      const orderMatch = rawLink.match(/^\/?orders\/?(\d+)$/i) || rawLink.match(/^\/?orders\/(\d+)$/i);
      const deepOrderId = orderMatch?.[1] ? String(orderMatch[1]) : '';

      if (deepOrderId) {
        setSourceFilter('All');
        setStatusFilter('All');
        setSearchTerm(deepOrderId);
        setOrdersPage(1);
        setExpandedOrderItems((prev) => ({ ...prev, [deepOrderId]: true }));
        setActiveView('orders');
        setTimeout(() => {
          const el = document.getElementById(`order-row-${deepOrderId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else if (link === '/orders' || link === 'orders') {
        setActiveView('orders');
      } else if (link === '/messages' || link === 'messages') {
        setActiveView('messages');
      } else if (link === '/users' || link === 'users') {
        setActiveView('users');
      } else if (link === '/products' || link === 'products') {
        setActiveView('products');
      } else {
        setActiveView('dashboard');
      }

      setNotifOpen(false);
      await loadNotifications();
    } catch (e) {
      console.error('Failed to open notification link', e);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      await loadNotifications();
    } catch (e) { console.error('Failed to mark as read', e); }
  };

  const deleteNotificationItem = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      await loadNotifications();
    } catch (e) { console.error('Failed to delete notification', e); }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const openConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Edit states
  const [editingUser, setEditingUser] = useState(null);

  // Fix: Add closeUserModal function
  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'customer'
    });
  };
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });

  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    size_type: 'none',
    size_options_text: '',
    color_type: 'none',
    color_options_text: ''
  });

  const [imageFiles, setImageFiles] = useState([]);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: '',
    categoryImage: null
  });
  const [categoryImageFile, setCategoryImageFile] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const normalizeOrderSourceValue = (source, status, email) => {
    const normalized = String(source || '').trim().toLowerCase();
    if (['email', 'mail', 'e-mail'].includes(normalized)) return 'email';
    if (normalized === 'direct_no_email') return 'direct_no_email';
    if (normalized === 'whatsapp') return 'whatsapp';
    // Backward-compat: older submitted website orders with an email were often email submissions.
    if (normalized === 'website' && String(status || '').toLowerCase() === 'submitted' && String(email || '').includes('@')) return 'email';
    return normalized || 'website';
  };

  const getOrderSourceMeta = (source, status, email) => {
    const normalized = normalizeOrderSourceValue(source, status, email);
    if (normalized === 'whatsapp') {
      return { label: 'WhatsApp', className: 'bg-green-100 text-green-800 border-green-200' };
    }
    if (normalized === 'email') {
      return { label: 'Email', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (normalized === 'direct_no_email') {
      return { label: 'Direct (No Email)', className: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
    return { label: 'Website', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  const ORDER_STATUS_OPTIONS = ['All', 'Waiting_Proof', 'Payment_Under_Review', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Not_Delivered', 'Cancelled'];

  const normalizePaymentStatusValue = (order) => {
    const status = String(order?.status || '').trim().toLowerCase();
    const payment = String(order?.payment_status || '').trim().toLowerCase();
    return payment || status;
  };

  const isOrderPaid = (order) => {
    const status = String(order?.status || '').trim().toLowerCase();
    const payment = normalizePaymentStatusValue(order);
    return ['paid', 'verified'].includes(payment) || ['paid', 'delivered', 'completed', 'shipped'].includes(status);
  };

  const matchesStatusFilter = (order, selectedStatus) => {
    if (selectedStatus === 'All') return true;
    const selected = String(selectedStatus || '').trim().toLowerCase();
    const status = String(order?.status || '').trim().toLowerCase();
    const payment = normalizePaymentStatusValue(order);
    if (selected === 'paid') return isOrderPaid(order);
    if (selected === 'payment_under_review') return ['awaiting_verification', 'payment_under_review'].includes(payment) || status === 'payment_under_review';
    return status === selected;
  };

  const getOrderLocationDisplay = (order) => {
    const raw =
      order?.delivery_address ||
      order?.customer_address ||
      order?.address ||
      order?.shipping_address ||
      order?.customer?.address ||
      '';
    const normalized = String(raw || '').trim();
    return normalized || 'Location not provided';
  };

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (loading) return;

    if (!isAuthenticated || !isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    loadDashboardData();
    // load notifications periodically (every 5 seconds for faster updates)
    loadNotifications();
    const notifInterval = setInterval(() => loadNotifications(), 5000);
    return () => clearInterval(notifInterval);
  }, [isAuthenticated, isAdmin, navigate, loading]);

  useEffect(() => {
    localStorage.setItem('adminDashboardActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('adminDashboardSourceFilter', sourceFilter);
  }, [sourceFilter]);

  useEffect(() => {
    localStorage.setItem('adminDashboardStatusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('adminDashboardSearchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setProductsPage(1);
    setCategoriesPage(1);
    setOrdersPage(1);
  }, [searchTerm, statusFilter, sourceFilter, activeView]);

  useEffect(() => {
    setProductsPage(1);
  }, [products.length]);

  useEffect(() => {
    setCategoriesPage(1);
  }, [categories.length]);

  useEffect(() => {
    setOrdersPage(1);
  }, [orders.length]);

  const renderPaginationControls = ({ currentPage, totalPages, onPageChange, totalItems, label }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 px-1">
        <p className="text-sm text-gray-500">
          Showing {label} page {currentPage} of {totalPages} ({totalItems} total)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="px-3 py-2 text-sm font-semibold text-gray-700">{currentPage}/{totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !isAdmin || loading) return;
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin, loading]);

  useEffect(() => {
    if (activeView === 'analytics' && isAuthenticated && isAdmin) {
      loadAnalytics();
    }
  }, [activeView, timeRange, isAuthenticated, isAdmin]);

  const loadDashboardData = () => {
    loadOrders();
    loadProducts();
    loadCategories();
    loadUsers();
    loadReviews();
    loadPaymentOptions();
    // Load messages only if current user is admin
    if (user?.role === 'admin') {
      loadMessages();
    }
  };

  const loadPaymentOptions = async () => {
    setPaymentOptionsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/payments/options', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.success && data?.options) {
        setPaymentOptions({
          bank_bk_account: data.options.bank_bk_account || '',
          bank_equity_account: data.options.bank_equity_account || '',
          mobile_mtn_number: data.options.mobile_mtn_number || '',
          mobile_airtel_number: data.options.mobile_airtel_number || '',
          tin_number: data.options.tin_number || '',
          ebm_number: data.options.ebm_number || '',
          reference_prefix: data.options.reference_prefix || 'PAY',
          notes: data.options.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment options:', error);
    } finally {
      setPaymentOptionsLoading(false);
    }
  };

  const savePaymentOptions = async () => {
    setPaymentOptionsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/payments/options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentOptions)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.success) {
        showToast('✅ Payment options updated successfully.', 'success');
        await loadPaymentOptions();
      } else {
        showToast(data?.message || 'Failed to update payment options', 'error');
      }
    } catch (error) {
      console.error('Error saving payment options:', error);
      showToast('Network error: could not update payment options', 'error');
    } finally {
      setPaymentOptionsSaving(false);
    }
  };

  const clearPaymentOptionField = (fieldName, label) => {
    openConfirm(`Remove current ${label}?`, () => {
      setPaymentOptions((prev) => ({ ...prev, [fieldName]: '' }));
    });
  };

  const clearAllPaymentOptionsDraft = () => {
    openConfirm('Remove all current payment option values? You can type and save new ones right after.', () => {
      setPaymentOptions((prev) => ({
        ...prev,
        bank_bk_account: '',
        bank_equity_account: '',
        mobile_mtn_number: '',
        mobile_airtel_number: '',
        tin_number: '',
        ebm_number: '',
        notes: ''
      }));
    });
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadOrderComments = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const comments = Array.isArray(data?.comments) ? data.comments : [];
        setOrderComments(prev => ({ ...prev, [orderId]: comments }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const sendOrderComment = async (orderId) => {
    const comment = newComment[orderId];
    if (!comment || !comment.trim()) return;

    setSendingComment(orderId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      });

      if (response.ok) {
        const data = await response.json();
        const comments = Array.isArray(data?.comments) ? data.comments : null;
        setNewComment(prev => ({ ...prev, [orderId]: '' }));
        if (comments) {
          setOrderComments(prev => ({ ...prev, [orderId]: comments }));
        } else {
          loadOrderComments(orderId);
        }
      }
    } catch (err) {
      console.error('Error sending comment:', err);
    } finally {
      setSendingComment(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Network error.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const normalizedOrders = (Array.isArray(data.orders) ? data.orders : []).map((order) => ({
          ...order,
          order_source: normalizeOrderSourceValue(order.order_source, order.status, order.customer_email || order.email)
        }));
        setOrders(normalizedOrders);
        localStorage.setItem('adminDashboardOrdersCache', JSON.stringify(normalizedOrders));
      } else {
        console.warn('Failed to load orders:', response.status, await response.text());
        const cachedOrders = JSON.parse(localStorage.getItem('adminDashboardOrdersCache') || '[]');
        setOrders(Array.isArray(cachedOrders) ? cachedOrders : []);
      }
    } catch (error) {
      const localOrders = JSON.parse(localStorage.getItem('adminDashboardOrdersCache') || localStorage.getItem('orders') || '[]');
      setOrders(Array.isArray(localOrders) ? localOrders : []);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const products = await response.json();
        setProducts(products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    };
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(localUsers);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // controller returns { messages } or rows directly; normalize
        setMessages(data.messages || data || []);
      } else {
        console.warn('Failed to load messages', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/reviews/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRecentReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } else {
        setRecentReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setRecentReviews([]);
    }
  };

  // Order Operations
  const approvePayment = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ payment_receipt: receiptUrl })
      });
      const data = await response.json();

      if (data.success) {
        showToast(`✅ ${data.message || 'Approve action completed.'}`, 'success');
        loadOrders();
        setShowVerifyModal(false);
        setVerifyingOrder(null);
        setReceiptUrl('');
      } else {
        showToast(data.message || 'Failed to approve payment', 'error');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      showToast('Network error: Could not approve payment.', 'error');
    }
  };

  const rejectPayment = async (orderId) => {
    openConfirm('Reject this payment proof? The customer will need to re-upload.', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/reject-payment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
          showToast('❌ Payment proof rejected. Customer notified to re-upload.', 'warning');
          loadOrders();
        } else {
          showToast(data.message || 'Failed to reject payment', 'error');
        }
      } catch (error) {
        console.error('Error rejecting payment:', error);
        showToast('Network error: Could not reject payment.', 'error');
      }
    });
  };

  const deliverOrder = async (orderId) => {
    openConfirm('Run Deliver action for this order? (Processing -> Shipped -> Delivered)', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/deliver`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          showToast(`✅ ${data.message || 'Deliver action completed.'}`, 'success');
          loadOrders();
        } else {
          showToast(data.message || 'Failed to update order', 'error');
        }
      } catch (error) {
        console.error('Error delivering order:', error);
        showToast('Network error: Could not update order.', 'error');
      }
    });
  };

  // Resend order back to Paid (for Not_Delivered investigation)
  const resendOrder = async (orderId) => {
    openConfirm('Resend this order? This will reset status to Paid so you can deliver again.', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/resend`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          showToast('🔄 Order resent — status set back to Paid.', 'success');
          loadOrders();
        } else {
          showToast(data.message || 'Failed to resend order', 'error');
        }
      } catch (error) {
        console.error('Error resending order:', error);
        showToast('Network error: Could not resend order.', 'error');
      }
    });
  };

  // Cancel / close an order after Not_Delivered investigation
  const cancelOrder = async (orderId) => {
    openConfirm('Cancel this order? If already paid, the system will mark it for refund processing.', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          showToast(`⚠️ ${data.message || 'Order cancelled.'}`, 'warning');
          loadOrders();
        } else {
          showToast(data.message || 'Failed to cancel order', 'error');
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Network error: Could not cancel order.', 'error');
      }
    });
  };

  // Delete Order (permanent deletion from database)
  const deleteOrder = async (orderId) => {
    openConfirm('⚠️ PERMANENT DELETE: This will permanently delete this order from the database. This action CANNOT be undone. Are you absolutely sure?', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          showToast('🗑️ Order permanently deleted from database.', 'success');
          loadOrders();
        } else {
          showToast(data.message || 'Failed to delete order', 'error');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Network error: Could not delete order.', 'error');
      }
    });
  };

  const verifyPayment = approvePayment;

  const updateReceiptSettings = async (orderId, opts = {}) => {
    if (!orderId) return;
    const rawTransport = opts.forceAmount !== undefined ? String(opts.forceAmount) : receiptTransportDraft[orderId];
    const transportAmount = Number(rawTransport ?? 0);
    if (!Number.isFinite(transportAmount) || transportAmount < 0) {
      showToast('Transport must be a valid number (0 or higher).', 'error');
      return;
    }

    setReceiptUpdatingOrderId(orderId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/receipt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transport_amount: transportAmount })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        showToast(data.message || 'Failed to update receipt settings.', 'error');
        return;
      }

      showToast('Receipt updated by admin. Transport saved and PDF regenerated.', 'success');
      setReceiptTransportDraft((prev) => ({ ...prev, [orderId]: String(Number(data?.receipt?.transport_amount || transportAmount)) }));
      await loadOrders();
    } catch (error) {
      console.error('Error updating receipt settings:', error);
      showToast('Network error while updating receipt.', 'error');
    } finally {
      setReceiptUpdatingOrderId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (String(newStatus || '').toLowerCase() === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order && !order.payment_proof && !order.payment_proof_file) {
          showToast('Cannot complete order: No proof of payment uploaded.', 'error');
          return;
        }
      }

      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast('Order status updated successfully!', 'success');
        loadOrders();
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Error updating order status', 'error');
    }
  };

  // User CRUD Operations
  const handleCreateUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        showToast('User created successfully!', 'success');
        loadUsers();
        closeUserModal();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Error creating user', 'error');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        showToast('User updated successfully!', 'success');
        loadUsers();
        closeUserModal();
      } else {
        showToast('Failed to update user', 'error');
      }
    } catch (error) {
      showToast('Error updating user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    openConfirm('Are you sure you want to delete this user?', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          showToast('User deleted successfully!', 'success');
          loadUsers();
        } else {
          showToast('Failed to delete user', 'error');
        }
      } catch (error) {
        showToast('Error deleting user', 'error');
      }
    });
  };

  const handleResetUserPassword = async (user) => {
    const typed = window.prompt(`Enter a new password for ${user.full_name || user.email}:`);
    if (typed === null) return;
    const newPassword = String(typed || '').trim();
    if (!newPassword) {
      showToast('Password reset cancelled: empty password.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.success) {
        showToast(`Password reset for ${user.full_name || user.email}.`, 'success');
      } else {
        showToast(data?.message || 'Failed to reset password.', 'error');
      }
    } catch (error) {
      console.error('Error resetting user password:', error);
      showToast('Error resetting user password.', 'error');
    }
  };

  // Product CRUD Operations
  const parseSizeOptions = (text, sizeType) => {
    const raw = String(text || '').trim();
    if (!raw || sizeType === 'none') return [];
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_e) {
        return [];
      }
    }

    return raw.split(',').map((chunk) => {
      const [labelPart, pricePart] = chunk.split(':');
      const value = String(labelPart || '').trim();
      if (!value) return null;
      const parsedPrice = Number(String(pricePart || '').trim());
      return Number.isFinite(parsedPrice) ? { value, price: parsedPrice } : { value };
    }).filter(Boolean);
  };

  const parseColorOptions = (text, colorType) => {
    const raw = String(text || '').trim();
    if (!raw || colorType === 'none') return [];
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_e) {
        return [];
      }
    }

    return raw.split(',').map((chunk) => {
      const [labelPart, pricePart] = chunk.split(':');
      const value = String(labelPart || '').trim();
      if (!value) return null;
      const parsedPrice = Number(String(pricePart || '').trim());
      return Number.isFinite(parsedPrice) ? { value, price: parsedPrice } : { value };
    }).filter(Boolean);
  };

  const hasDuplicateProductName = (candidateName, excludeProductId = null) => {
    const normalizedCandidate = String(candidateName || '').trim().toLowerCase();
    if (!normalizedCandidate) return false;

    return (Array.isArray(products) ? products : []).some((product) => {
      if (excludeProductId && Number(product.id) === Number(excludeProductId)) return false;
      return String(product.name || '').trim().toLowerCase() === normalizedCandidate;
    });
  };

  const validateProductPricingAndSizes = (formState, sizeOptions) => {
    const numericPrice = Number(formState.price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return { valid: false, message: 'Price must be greater than 0 RWF.' };
    }

    const numericStock = Number(formState.stock);
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return { valid: false, message: 'Stock must be 0 or greater.' };
    }

    // Size prices are OPTIONAL. Only validate conflict if price is provided.
    const hasConflict = (sizeOptions || []).some((opt) => {
      const label = String(opt?.value || opt?.label || '').trim();
      const priceValue = String(opt?.price || '').trim();
      // Skip if no price provided (optional)
      if (!priceValue) return false;
      const optionPrice = Number(priceValue);
      if (!label || !Number.isFinite(optionPrice)) return false;
      const labelAsNumber = Number(label);
      return Number.isFinite(labelAsNumber) && labelAsNumber === optionPrice;
    });

    if (hasConflict) {
      return { valid: false, message: 'Size value and size price cannot be the same number (prices are optional).' };
    }

    return { valid: true };
  };

  const handleCreateProduct = async () => {
    try {
      const trimmedName = String(productForm.name || '').trim();
      if (hasDuplicateProductName(trimmedName)) {
        showToast('A product with this name already exists.', 'error');
        return;
      }

      const formData = new FormData();
      const sizeTypeToSend = productForm.size_type || 'none';
      const sizeOptionsToSend = parseSizeOptions(productForm.size_options_text, sizeTypeToSend);
      const colorTypeToSend = productForm.color_type || 'none';
      const colorOptionsToSend = parseColorOptions(productForm.color_options_text, colorTypeToSend);
      const validation = validateProductPricingAndSizes(productForm, sizeOptionsToSend);
      if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
      }
      formData.append('name', productForm.name);
      formData.append('category_id', productForm.category_id);
      formData.append('subcategory_id', productForm.subcategory_id);
      formData.append('price', String(Number(productForm.price)));
      formData.append('stock', String(Math.trunc(Number(productForm.stock))));
      formData.append('description', productForm.description);
      formData.append('size_type', sizeTypeToSend);
      formData.append('size_options', JSON.stringify(sizeOptionsToSend));
      formData.append('color_type', colorTypeToSend);
      formData.append('color_options', JSON.stringify(colorOptionsToSend));
      formData.append('owner_id', user.id);

      // Append image files
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        showToast('Product created successfully!', 'success');
        loadProducts();
        closeProductModal();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to create product', 'error');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Error creating product', 'error');
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const trimmedName = String(productForm.name || '').trim();
      if (hasDuplicateProductName(trimmedName, editingProduct?.id)) {
        showToast('A product with this name already exists.', 'error');
        return;
      }

      const formData = new FormData();
      const sizeTypeToSend = productForm.size_type || 'none';
      const sizeOptionsToSend = parseSizeOptions(productForm.size_options_text, sizeTypeToSend);
      const colorTypeToSend = productForm.color_type || 'none';
      const colorOptionsToSend = parseColorOptions(productForm.color_options_text, colorTypeToSend);
      const validation = validateProductPricingAndSizes(productForm, sizeOptionsToSend);
      if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
      }
      formData.append('name', productForm.name);
      formData.append('category_id', productForm.category_id);
      formData.append('subcategory_id', productForm.subcategory_id);
      formData.append('price', String(Number(productForm.price)));
      formData.append('stock', String(Math.trunc(Number(productForm.stock))));
      formData.append('description', productForm.description);
      formData.append('size_type', sizeTypeToSend);
      formData.append('size_options', JSON.stringify(sizeOptionsToSend));
      formData.append('color_type', colorTypeToSend);
      formData.append('color_options', JSON.stringify(colorOptionsToSend));

      // Append new image files if any
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`http://localhost:5000/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        showToast('Product updated successfully!', 'success');
        loadProducts();
        closeProductModal();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to update product', 'error');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Error updating product', 'error');
    }
  };

  const handleRemoveExistingImage = async (productId, imageUrl) => {
    if (!confirm('Remove this image from product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ imageUrl })
      });
      const data = await res.json();
      if (res.ok) { showToast('Image removed', 'success'); loadProducts(); } else { showToast(data.message || 'Failed to remove image', 'error'); }
    } catch (e) { console.error(e); showToast('Error removing image', 'error'); }
  };

  const handleSetMainImage = async (productId, imageUrl) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}/image-main`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ imageUrl })
      });
      const data = await res.json();
      if (res.ok) { showToast('Main image updated', 'success'); loadProducts(); } else { showToast(data.message || 'Failed to update main image', 'error'); }
    } catch (e) { console.error(e); showToast('Error updating main image', 'error'); }
  };

  const handleDeleteProduct = async (productId) => {
    openConfirm('Are you sure you want to delete this product?', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          showToast('Product deleted successfully!', 'success');
          loadProducts();
        } else {
          showToast('Failed to delete product', 'error');
        }
      } catch (error) {
        showToast('Error deleting product', 'error');
      }
    });
  };

  // Category CRUD Operations
  const handleCreateCategory = async () => {
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      formData.append('parent_id', categoryForm.parent_id || '');
      if (categoryImageFile) {
        formData.append('image', categoryImageFile);
      }

      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        showToast('Category created successfully!', 'success');
        loadCategories();
        closeCategoryModal();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to create category', 'error');
      }
    } catch (error) {
      showToast('Error creating category', 'error');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      formData.append('parent_id', categoryForm.parent_id || '');
      if (categoryImageFile) {
        formData.append('image', categoryImageFile);
      }

      const response = await fetch(`http://localhost:5000/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        showToast('Category updated successfully!', 'success');
        loadCategories();
        closeCategoryModal();
      } else {
        showToast('Failed to update category', 'error');
      }
    } catch (error) {
      showToast('Error updating category', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    openConfirm('Delete this category? Products using it may be affected.', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const data = await response.json();
        if (response.ok) {
          showToast('Category deleted successfully!', 'success');
          loadCategories();
          loadProducts();
        } else {
          showToast(data.message || 'Failed to delete category', 'error');
        }
      } catch (error) {
        showToast('Error deleting category', 'error');
      }
    });
  };

  // Modal handlers
  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setUserForm({ full_name: '', email: '', phone: '', password: '', role: 'customer' });
    }
    setShowUserModal(true);
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category_id: product.category_id || '',
        subcategory_id: product.subcategory_id || '',
        price: product.price,
        stock: product.stock,
        description: product.description || '',
        image: product.image || '',
        size_type: product.size_type || 'none',
        size_options_text: Array.isArray(product.size_options)
          ? product.size_options.map((opt) => opt?.price ? `${opt.value || opt.label}:${opt.price}` : `${opt.value || opt.label}`).join(', ')
          : '',
        color_type: product.color_type || 'none',
        color_options_text: Array.isArray(product.color_options)
          ? product.color_options.map((opt) => opt?.price ? `${opt.value || opt.label}:${opt.price}` : `${opt.value || opt.label}`).join(', ')
          : ''
      });
      setImageFiles([]);
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', category_id: '', subcategory_id: '', price: '', stock: '', description: '', image: '', size_type: 'none', size_options_text: '', color_type: 'none', color_options_text: '' });
      setImageFiles([]);
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: '', category_id: '', subcategory_id: '', price: '', stock: '', description: '', image: '', size_type: 'none', size_options_text: '', color_type: 'none', color_options_text: '' });
    setImageFiles([]);
  };

  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || '', parent_id: category.parent_id || '', categoryImage: category.image || null });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', parent_id: '', categoryImage: null });
    }
    setCategoryImageFile(null);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', parent_id: '', categoryImage: null });
    setCategoryImageFile(null);
  };

  const getDescendantCategoryIds = (parentId) => {
    const descendants = new Set();
    if (!parentId) return descendants;
    const queue = [Number(parentId)];
    while (queue.length > 0) {
      const current = queue.shift();
      const children = categories.filter((cat) => Number(cat.parent_id) === Number(current));
      children.forEach((child) => {
        const childId = Number(child.id);
        if (!descendants.has(childId)) {
          descendants.add(childId);
          queue.push(childId);
        }
      });
    }
    return descendants;
  };

  const getCategoryDepth = (categoryId) => {
    let depth = 0;
    let cursor = categories.find((cat) => Number(cat.id) === Number(categoryId));
    const visited = new Set();

    while (cursor && cursor.parent_id) {
      const parentId = Number(cursor.parent_id);
      if (!Number.isFinite(parentId) || visited.has(parentId)) break;
      visited.add(parentId);
      depth += 1;
      cursor = categories.find((cat) => Number(cat.id) === parentId);
    }

    return depth;
  };

  const getCategoryPathLabel = (categoryId) => {
    const path = [];
    let cursor = categories.find((cat) => Number(cat.id) === Number(categoryId));
    const visited = new Set();

    while (cursor) {
      const idNum = Number(cursor.id);
      if (visited.has(idNum)) break;
      visited.add(idNum);
      path.unshift(cursor.name);
      if (!cursor.parent_id) break;
      cursor = categories.find((cat) => Number(cat.id) === Number(cursor.parent_id));
    }

    return path.join(' > ');
  };

  const getCategoryOptionLabel = (category) => {
    const depth = getCategoryDepth(category.id);
    const prefix = depth > 0 ? `${'-'.repeat(Math.min(depth, 6))} ` : '';
    return `${prefix}${category.name}`;
  };

  const getNestedChildrenForCategory = (parentId) => {
    if (!parentId) return [];
    const rootId = Number(parentId);
    const collected = [];
    const queue = [rootId];
    const visited = new Set([rootId]);

    while (queue.length > 0) {
      const current = queue.shift();
      const children = categories
        .filter((cat) => Number(cat.parent_id) === Number(current))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

      children.forEach((child) => {
        const childId = Number(child.id);
        if (visited.has(childId)) return;
        visited.add(childId);
        collected.push(child);
        queue.push(childId);
      });
    }

    return collected;
  };

  const getSelectableParentCategories = () => {
    const sorted = [...categories].sort((a, b) => {
      const pathA = getCategoryPathLabel(a.id);
      const pathB = getCategoryPathLabel(b.id);
      return pathA.localeCompare(pathB);
    });

    if (!editingCategory) return sorted;
    const disallowed = getDescendantCategoryIds(editingCategory.id);
    disallowed.add(Number(editingCategory.id));
    return sorted.filter((cat) => !disallowed.has(Number(cat.id)));
  };

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = Number(order.total_amount) || Number(order.total) || 0;
    return sum + amount;
  }, 0);
  // Format total revenue with currency and thousands separators
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(totalRevenue);
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;

  const getCategoryLabel = (product) => {
    if (product?.category) return product.category;
    const match = categories.find((c) => Number(c.id) === Number(product?.category_id));
    return match?.name || 'Uncategorized';
  };

  // ─── Computed analytics (local, time-ranged) ─────────────────────────────
  const computedAnalytics = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const now = new Date();

    const productAgg = new Map();
    const customerAgg = new Map();

    const addProductRow = (name, units, revenue) => {
      const key = name || 'Unknown Product';
      const prev = productAgg.get(key) || { name: key, units: 0, revenue: 0 };
      productAgg.set(key, { ...prev, units: prev.units + units, revenue: prev.revenue + revenue });
    };

    const addCustomerRow = (order) => {
      const key = order.customer_email || order.email || `customer-${order.customer_id || order.id}`;
      const label = order.customer_name || order.full_name || order.customer_email || 'Customer';
      const total = toNum(order.total_amount || order.total);
      const prev = customerAgg.get(key) || { name: label, email: key, orders: 0, spent: 0 };
      customerAgg.set(key, { ...prev, orders: prev.orders + 1, spent: prev.spent + total });
    };

    safeOrders.forEach((order) => {
      addCustomerRow(order);
      const orderTotal = toNum(order.total_amount || order.total);
      const items = Array.isArray(order.items) ? order.items : [];
      if (items.length === 0) { addProductRow('Unmapped Product', 1, orderTotal); return; }
      const totalQty = items.reduce((sum, item) => sum + Math.max(1, toNum(item.quantity || item.qty || 1)), 0);
      items.forEach((item) => {
        const qty = Math.max(1, toNum(item.quantity || item.qty || 1));
        const fallbackRevenue = totalQty > 0 ? (orderTotal * qty) / totalQty : 0;
        const lineRevenue = toNum(item.subtotal || item.total || (toNum(item.price) * qty) || fallbackRevenue);
        addProductRow(item.product_name || item.name || `Product #${item.product_id || 'N/A'}`, qty, lineRevenue || fallbackRevenue);
      });
    });

    const bucketConfig = {
      daily:   { count: 14, key: (d) => d.toISOString().slice(0, 10), label: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), step: (d, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - (13 - i)) },
      weekly:  { count: 12, key: (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${Math.ceil((((t - ys) / 86400000) + 1) / 7)}`; }, label: (d) => `Wk ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, step: (d, i) => { const r = new Date(d); r.setDate(d.getDate() - ((11 - i) * 7)); return r; } },
      monthly: { count: 12, key: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), step: (d, i) => new Date(d.getFullYear(), d.getMonth() - (11 - i), 1) },
      yearly:  { count: 5,  key: (d) => `${d.getFullYear()}`, label: (d) => `${d.getFullYear()}`, step: (d, i) => new Date(d.getFullYear() - (4 - i), 0, 1) }
    };
    const range = bucketConfig[timeRange] ? timeRange : 'monthly';
    const { count, key, label, step } = bucketConfig[range];
    const buckets = [];
    for (let i = 0; i < count; i++) {
      const dp = step(now, i);
      buckets.push({ key: key(dp), label: label(dp), revenue: 0, orders: 0 });
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    safeOrders.forEach((order) => {
      const orderDate = normalizeDate(order.created_at || order.date);
      const bucket = bucketMap.get(key(orderDate));
      if (!bucket) return;
      bucket.revenue += toNum(order.total_amount || order.total);
      bucket.orders += 1;
    });

    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);
    const summarize = (from) => {
      let rev = 0, cnt = 0;
      safeOrders.forEach((o) => { const d = normalizeDate(o.created_at || o.date); if (d >= from) { rev += toNum(o.total_amount || o.total); cnt++; } });
      return { revenue: rev, orders: cnt };
    };

    return {
      series: buckets,
      kpis: { daily: summarize(startOfDay), weekly: summarize(startOfWeek), monthly: summarize(startOfMonth), yearly: summarize(startOfYear) },
      topProducts: Array.from(productAgg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 50),
      topCustomers: Array.from(customerAgg.values()).sort((a, b) => b.spent - a.spent).slice(0, 50),
      productCatalog: safeProducts.map((p) => {
        const cur = productAgg.get(p.name) || { units: 0, revenue: 0 };
        return { id: p.id, name: p.name, category: getCategoryLabel(p), stock: toNum(p.stock), unitsSold: cur.units, revenue: cur.revenue };
      }).sort((a, b) => b.revenue - a.revenue),
      totalRevenue: safeOrders.reduce((s, o) => s + toNum(o.total_amount || o.total), 0),
      totalOrders: safeOrders.length
    };
  }, [orders, products, categories, timeRange]);

  const adminBusinessStatusItems = useMemo(() => [
    { label: 'Total Platform Revenue', value: `${computedAnalytics.totalRevenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Total Orders',           value: `${computedAnalytics.totalOrders}`,                      tone: 'indigo' },
    { label: 'Registered Customers',   value: `${totalCustomers}`,                                     tone: 'amber' },
    { label: 'Products In Catalog',    value: `${products.length}`,                                    tone: 'purple' },
    { label: 'Registered Users',       value: `${users.length}`,                                       tone: 'amber' },
    { label: 'Daily Revenue',          value: `${computedAnalytics.kpis.daily.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Daily Orders',           value: `${computedAnalytics.kpis.daily.orders}`,               tone: 'indigo' },
    { label: 'Weekly Revenue',         value: `${computedAnalytics.kpis.weekly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Weekly Orders',          value: `${computedAnalytics.kpis.weekly.orders}`,              tone: 'indigo' },
    { label: 'Monthly Revenue',        value: `${computedAnalytics.kpis.monthly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Monthly Orders',         value: `${computedAnalytics.kpis.monthly.orders}`,             tone: 'indigo' },
    { label: 'Yearly Revenue',         value: `${computedAnalytics.kpis.yearly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Yearly Orders',          value: `${computedAnalytics.kpis.yearly.orders}`,              tone: 'indigo' }
  ], [computedAnalytics, totalCustomers, products.length, users.length]);

  const getAnalyticsPages = (items) => Math.max(1, Math.ceil((items?.length || 0) / ANALYTICS_PAGE_SIZE));
  const paginateAnalytics = (items, page) => { const s = (page - 1) * ANALYTICS_PAGE_SIZE; return (items || []).slice(s, s + ANALYTICS_PAGE_SIZE); };
  const renderAnalyticsPagination = (page, setPage, totalPages) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
        <span className="text-xs font-semibold text-gray-500">Page {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
      </div>
    );
  };
  // Reset pagination when view or time range changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTopCustomersPage(1); setTopProductsPage(1); setBusinessStatusPage(1); setProductsReportPage(1); }, [timeRange, activeView]);
  // ─────────────────────────────────────────────────────────────────────────

  const MetricCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-semibold mb-1 uppercase">{label}</p>
          <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
        </div>
        <div className={`${color} p-3 rounded-full`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back, {user?.full_name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={formattedRevenue}
          color="bg-green-500"
          bgColor="bg-green-50"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders}
          color="bg-blue-500"
          bgColor="bg-blue-50"
        />
        <MetricCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          color="bg-purple-500"
          bgColor="bg-purple-50"
        />
        <MetricCard
          icon={Package}
          label="Total Products"
          value={totalProducts}
          color="bg-orange-500"
          bgColor="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={24} />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{order.total_amount?.toLocaleString()} RWF</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-600" size={24} />
            Low Stock Alert
          </h3>
          <div className="space-y-3">
            {(Array.isArray(products) ? products : []).filter(p => p.stock < 50).slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">Stock: {product.stock} units</p>
                </div>
                <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                  Low Stock
                </span>
              </div>
            ))}
            {(Array.isArray(products) ? products : []).filter(p => p.stock < 50).length === 0 && (
              <p className="text-center text-gray-500 py-8">All products are well stocked!</p>
            )}
          </div>
        </div>

        {/* Recent Customer Reviews */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} />
              Recent Customer Reviews
            </h3>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {recentReviews.length} total
            </span>
          </div>
          {recentReviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.slice(0, 8).map((review) => (
                <div key={review.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{review.userName} • {review.productName}</p>
                      <p className="text-xs text-gray-600">{review.userEmail || 'No email provided'}</p>
                      <p className="text-xs text-gray-500">{new Date(review.date).toLocaleString()}</p>
                    </div>
                    <div className="text-sm font-bold text-amber-600">{'★'.repeat(Math.max(0, Number(review.rating || 0)))}{'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}</div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const UsersView = () => {
    const filteredUsers = (Array.isArray(users) ? users : []).filter(u =>
      fuzzyIncludes(u.full_name, searchTerm) ||
      fuzzyIncludes(u.email, searchTerm) ||
      fuzzyIncludes(u.role, searchTerm)
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={() => openUserModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>

        {/* Using global header search; local search removed to avoid duplication */}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Phone</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-gray-600">{u.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openUserModal(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleResetUserPassword(u)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <Lock size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ProductsView = () => {
    const filteredProducts = (Array.isArray(products) ? products : []).filter(p =>
      fuzzyIncludes(p.name, searchTerm) ||
      fuzzyIncludes(p.description, searchTerm) ||
      fuzzyIncludes(p.category, searchTerm) ||
      fuzzyIncludes(p.subcategory, searchTerm) ||
      fuzzyIncludes(p.size_type, searchTerm)
    );
    // Sorting
    const [productsSort, setProductsSort] = useState?.length ? useState('newest') : undefined;
    // If useState not available in this scope (closure), use a simple variable fallback
    // We'll implement a lightweight sort option using URL state via localStorage
    const sortOption = (localStorage.getItem('adminProductsSort') || 'newest');
    const sortedProducts = (() => {
      const copy = [...filteredProducts];
      if (sortOption === 'newest') {
        copy.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
      } else if (sortOption === 'name') {
        copy.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      } else if (sortOption === 'price-low') {
        copy.sort((a, b) => (Number(a.price || 0) - Number(b.price || 0)));
      } else if (sortOption === 'price-high') {
        copy.sort((a, b) => (Number(b.price || 0) - Number(a.price || 0)));
      }
      return copy;
    })();
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / MANAGEMENT_PAGE_SIZE));
    const currentPage = Math.min(productsPage, totalPages);
    const paginatedProducts = sortedProducts.slice((currentPage - 1) * MANAGEMENT_PAGE_SIZE, currentPage * MANAGEMENT_PAGE_SIZE);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              defaultValue={localStorage.getItem('adminProductsSort') || 'newest'}
              onChange={(e) => { localStorage.setItem('adminProductsSort', e.target.value); window.location.reload(); }}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Using global header search; local search removed to avoid duplication */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => {
            const category = categories.find(c => c.id === product.category_id);
            const subcategory = categories.find(c => c.id === product.subcategory_id);
            const primaryMedia = Array.isArray(product.media) && product.media.length > 0
              ? product.media[0]
              : (product.images && product.images.length > 0 ? { type: 'image', url: product.images[0] } : null);
            const displayUrl = primaryMedia
              ? (primaryMedia.url.startsWith('http') ? primaryMedia.url : `http://localhost:5000${primaryMedia.url}`)
              : (product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`) : null);
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {displayUrl ? (
                    primaryMedia?.type === 'video'
                      ? <video src={displayUrl} className="w-full h-full object-cover" muted autoPlay loop controls />
                      : <img src={displayUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={64} className="text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{category?.name || 'Uncategorized'}</p>
                  {subcategory && <p className="text-xs text-indigo-600 mb-2">{subcategory.name}</p>}
                  {product.size_type && product.size_type !== 'none' && (
                    <p className="inline-block text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold mb-2">Type: {String(product.size_type).replace(/_/g, ' ')}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">{product.price?.toLocaleString()} RWF</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${product.stock > 50 ? 'bg-green-100 text-green-700' :
                      product.stock > 20 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  {Array.isArray(product.media) && product.media.length > 1 && (
                    <p className="text-xs text-gray-500 mb-2">📦 {product.media.length} media files</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProductModal(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {renderPaginationControls({
          currentPage,
          totalPages,
          onPageChange: setProductsPage,
          totalItems: filteredProducts.length,
          label: 'products'
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    );
  };

  const CategoriesView = () => {
    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(c =>
      fuzzyIncludes(c.name, searchTerm) ||
      fuzzyIncludes(c.description, searchTerm)
    );
    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / MANAGEMENT_PAGE_SIZE));
    const currentPage = Math.min(categoriesPage, totalPages);
    const paginatedCategories = filteredCategories.slice((currentPage - 1) * MANAGEMENT_PAGE_SIZE, currentPage * MANAGEMENT_PAGE_SIZE);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Category Management</h2>
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add New Category
          </button>
        </div>

        {/* Using global header search; local search removed to avoid duplication */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCategories.map((category) => {
            const productCount = (Array.isArray(products) ? products : []).filter(p => p.category_id === category.id).length;
            const parent = categories.find((c) => Number(c.id) === Number(category.parent_id));
            const depth = getCategoryDepth(category.id);
            const fullPath = getCategoryPathLabel(category.id);
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FolderTree className="text-purple-600" size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-xs font-semibold text-slate-500 mb-1">Level: {depth + 1}</p>
                {parent && <p className="text-xs font-semibold text-indigo-600 mb-2">Parent: {parent.name}</p>}
                {fullPath && <p className="text-xs text-gray-500 mb-2">Path: {fullPath}</p>}
                <p className="text-sm text-gray-600 mb-4">{category.description || 'No description'}</p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Products</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {productCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {renderPaginationControls({
          currentPage,
          totalPages,
          onPageChange: setCategoriesPage,
          totalItems: filteredCategories.length,
          label: 'categories'
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <FolderTree size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories found</p>
          </div>
        )}
      </div>
    );
  };

  // --- End of Orders View Logic ---

  const AnalyticsView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <PieChart className="text-blue-600 w-8 h-8" />
            Platform Analytics
          </h2>
          <p className="text-gray-500 font-medium">System-wide performance metrics, customer insights, and revenue tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className={`flex items-center p-1 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
            {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={loadAnalytics}
            className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 font-bold ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'}`}
          >
            <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Daily',   data: computedAnalytics.kpis.daily,   icon: BarChart3 },
          { title: 'Weekly',  data: computedAnalytics.kpis.weekly,  icon: TrendingUp },
          { title: 'Monthly', data: computedAnalytics.kpis.monthly, icon: ShoppingBag },
          { title: 'Yearly',  data: computedAnalytics.kpis.yearly,  icon: DollarSign }
        ].map((kpi) => (
          <div key={kpi.title} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">{kpi.title} Report</p>
              <kpi.icon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-green-600">{kpi.data.revenue.toLocaleString()} RWF</p>
            <p className="text-sm text-gray-500 mt-1">{kpi.data.orders} orders</p>
          </div>
        ))}
      </div>

      {/* Chart + Top Customers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className={`xl:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2">
              <BarChart3 className="text-blue-600 w-5 h-5" />
              Sales Trend ({timeRange})
            </h3>
            <p className="text-xs font-bold text-gray-500">Revenue + Orders</p>
          </div>
          {computedAnalytics.series.length > 0 && computedAnalytics.series.some(s => s.revenue > 0 || s.orders > 0) ? (
            <div className="h-64 flex items-end gap-2">
              {computedAnalytics.series.map((point) => {
                const maxRevenue = Math.max(...computedAnalytics.series.map(s => s.revenue), 1);
                const maxOrders  = Math.max(...computedAnalytics.series.map(s => s.orders), 1);
                const revenueH = (point.revenue / maxRevenue) * 100;
                const ordersH  = (point.orders  / maxOrders)  * 100;
                return (
                  <div key={point.key} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                    <div className="w-full flex items-end gap-0.5 h-full">
                      <div className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-300" style={{ height: `${revenueH}%` }} title={`Revenue: ${point.revenue.toLocaleString()} RWF`} />
                      <div className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-500 to-indigo-300" style={{ height: `${ordersH}%` }}  title={`Orders: ${point.orders}`} />
                    </div>
                    <span className="text-[10px] mt-2 text-gray-500 text-center truncate w-full">{point.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No sales data for this period yet.</div>
          )}
          <div className="flex items-center gap-6 mt-4 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500" />Revenue</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500" />Orders</div>
          </div>
        </div>

        {/* Top Customers */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
          <h3 className="text-lg font-black mb-4">Top Customers</h3>
          <div className="space-y-3">
            {computedAnalytics.topCustomers.length > 0
              ? paginateAnalytics(computedAnalytics.topCustomers, topCustomersPage).map((customer, idx) => (
                <div key={`${customer.email}-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="font-bold text-sm truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>{customer.orders} orders</span>
                    <span className="font-black text-blue-600">{customer.spent.toLocaleString()} RWF</span>
                  </div>
                </div>
              ))
              : <p className="text-sm text-gray-500">No customer purchase data yet.</p>
            }
          </div>
          {renderAnalyticsPagination(topCustomersPage, setTopCustomersPage, getAnalyticsPages(computedAnalytics.topCustomers))}
        </div>
      </div>

      {/* Best Selling Products + Platform Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black">Best Selling Products</h3>
            <button onClick={() => setActiveView('products')} className="text-xs font-bold text-blue-600">Open Products</button>
          </div>
          <div className="space-y-3">
            {computedAnalytics.topProducts.length > 0
              ? paginateAnalytics(computedAnalytics.topProducts, topProductsPage).map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate pr-2">{((topProductsPage - 1) * ANALYTICS_PAGE_SIZE) + idx + 1}. {item.name}</p>
                    <p className="text-xs font-black text-green-600 shrink-0">{item.revenue.toLocaleString()} RWF</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Units sold: {item.units}</p>
                </div>
              ))
              : <p className="text-sm text-gray-500">No product sales data yet.</p>
            }
          </div>
          {renderAnalyticsPagination(topProductsPage, setTopProductsPage, getAnalyticsPages(computedAnalytics.topProducts))}
        </div>

        {/* Overall Platform Status */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
          <h3 className="text-lg font-black mb-4">Overall Platform Status</h3>
          <div className="space-y-3">
            {paginateAnalytics(adminBusinessStatusItems, businessStatusPage).map((item) => (
              <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.tone === 'emerald' ? 'bg-emerald-50 border border-emerald-100' : item.tone === 'indigo' ? 'bg-indigo-50 border border-indigo-100' : item.tone === 'amber' ? 'bg-amber-50 border border-amber-100' : 'bg-purple-50 border border-purple-100'}`}>
                <span className="text-sm font-semibold">{item.label}</span>
                <span className={`font-black ${item.tone === 'emerald' ? 'text-emerald-700' : item.tone === 'indigo' ? 'text-indigo-700' : item.tone === 'amber' ? 'text-amber-700' : 'text-purple-700'}`}>{item.value}</span>
              </div>
            ))}
          </div>
          {renderAnalyticsPagination(businessStatusPage, setBusinessStatusPage, getAnalyticsPages(adminBusinessStatusItems))}
        </div>
      </div>

      {/* All Products Sales Report */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
        <h3 className="text-lg font-black mb-4">All Products Sales Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left border-b ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                <th className="py-3 pr-4 font-black">Product</th>
                <th className="py-3 pr-4 font-black">Category</th>
                <th className="py-3 pr-4 font-black">Units Sold</th>
                <th className="py-3 pr-4 font-black">Revenue</th>
                <th className="py-3 font-black">Stock</th>
              </tr>
            </thead>
            <tbody>
              {computedAnalytics.productCatalog.length > 0
                ? paginateAnalytics(computedAnalytics.productCatalog, productsReportPage).map((row) => (
                  <tr key={row.id || row.name} className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="py-3 pr-4 font-semibold">{row.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{row.category}</td>
                    <td className="py-3 pr-4">{row.unitsSold}</td>
                    <td className="py-3 pr-4 font-black text-green-600">{row.revenue.toLocaleString()} RWF</td>
                    <td className="py-3">{row.stock}</td>
                  </tr>
                ))
                : (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-500">No product data available.</td></tr>
                )
              }
            </tbody>
          </table>
        </div>
        {renderAnalyticsPagination(productsReportPage, setProductsReportPage, getAnalyticsPages(computedAnalytics.productCatalog))}
      </div>
    </div>
  );

  // ─── Reports: compute data from orders ────────────────────────────────────
  const buildReportData = () => {
    const sel = new Date(reportDate + 'T00:00:00');
    let startDate, endDate;
    if (reportType === 'daily') {
      startDate = new Date(sel);
      endDate = new Date(sel);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      const diff = (sel.getDay() + 6) % 7;
      startDate = new Date(sel);
      startDate.setDate(sel.getDate() - diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    }
    const filtered = (Array.isArray(orders) ? orders : []).filter(o => {
      const d = normalizeDate(o.created_at || o.date);
      return d >= startDate && d < endDate;
    });

    const aggregateProducts = (ordersList) => {
      const productMap = new Map();
      ordersList.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const orderTotal = toNum(order.total_amount || order.total);
        if (items.length === 0) {
          const key = 'Uncategorized Order';
          const prev = productMap.get(key) || { name: key, units: 0, revenue: 0 };
          productMap.set(key, { ...prev, units: prev.units + 1, revenue: prev.revenue + orderTotal });
          return;
        }

        const totalQty = items.reduce((s, i) => s + Math.max(1, toNum(i.quantity || i.qty || 1)), 0);
        items.forEach(item => {
          const qty = Math.max(1, toNum(item.quantity || item.qty || 1));
          const fallbackRev = totalQty > 0 ? (orderTotal * qty) / totalQty : 0;
          const lineRev = toNum(item.subtotal || item.total || (toNum(item.price) * qty) || fallbackRev);
          const name = item.product_name || item.name || `Product #${item.product_id || 'N/A'}`;
          const prev = productMap.get(name) || { name, units: 0, revenue: 0 };
          productMap.set(name, { ...prev, units: prev.units + qty, revenue: prev.revenue + (lineRev || fallbackRev) });
        });
      });
      return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    };

    const rows = aggregateProducts(filtered);
    const paidOrders = filtered.filter(isOrderPaid);
    const paidRows = aggregateProducts(paidOrders);

    return {
      startDate,
      endDate,
      orders: filtered,
      paidOrders,
      rows,
      paidRows,
      totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
      totalUnits: rows.reduce((s, r) => s + r.units, 0),
      totalOrders: filtered.length,
      totalPaidRevenue: paidRows.reduce((s, r) => s + r.revenue, 0),
      totalPaidUnits: paidRows.reduce((s, r) => s + r.units, 0),
      totalPaidOrders: paidOrders.length
    };
  };

  const reportData = useMemo(() => {
    if (!reportGenerated) return null;
    return buildReportData();
  }, [reportGenerated, reportDate, reportType, orders]);

  const reportDateRangeLabel = useMemo(() => {
    if (!reportData) return '';
    if (reportType === 'daily') {
      return new Date(reportDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    const end = new Date(reportData.endDate.getTime() - 1);
    return `${reportData.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [reportData, reportDate, reportType]);

  const downloadReportCSV = () => {
    const exportData = reportData || buildReportData();
    if (!exportData) return;
    const lines = [
      [`AVATA Trading — ${reportType === 'daily' ? 'Daily' : 'Weekly'} Sales Report`],
      [`Period: ${reportDateRangeLabel}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['#', 'Product', 'Units Sold', 'Revenue (RWF)', '% of Total'],
      ...exportData.rows.map((r, i) => [
        i + 1, r.name, r.units, r.revenue.toFixed(0),
        exportData.totalRevenue > 0 ? (r.revenue / exportData.totalRevenue * 100).toFixed(1) + '%' : '0%'
      ]),
      [],
      ['', 'TOTAL', exportData.totalUnits, exportData.totalRevenue.toFixed(0), '100%'],
      [],
      ['PAID PRODUCTS ONLY'],
      ['#', 'Product', 'Paid Units', 'Paid Revenue (RWF)', '% of Paid Revenue'],
      ...exportData.paidRows.map((r, i) => [
        i + 1,
        r.name,
        r.units,
        r.revenue.toFixed(0),
        exportData.totalPaidRevenue > 0 ? (r.revenue / exportData.totalPaidRevenue * 100).toFixed(1) + '%' : '0%'
      ]),
      ['', 'TOTAL PAID', exportData.totalPaidUnits, exportData.totalPaidRevenue.toFixed(0), '100%'],
      [],
      ['ORDER DETAILS'],
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Amount (RWF)'],
      ...exportData.orders.map(o => [
        `#${o.id}`,
        o.customer_name || o.full_name || o.customer_email || '—',
        normalizeDate(o.created_at || o.date).toLocaleDateString(),
        o.status,
        normalizePaymentStatusValue(o),
        Number(o.total_amount || o.total || 0).toFixed(0)
      ])
    ];
    const csv = lines.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVATA-${reportType}-report-${reportDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    const generateAdminPDF = () => {
      const exportData = reportData || buildReportData();
      if (!exportData) return;
      // eslint-disable-next-line new-cap
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      // Header bar
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageW, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('AVATA Trading', 15, 15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${reportType === 'daily' ? 'Daily' : 'Weekly'} Sales Report`, 15, 23);
      doc.setFontSize(9);
      doc.text(`Period: ${reportDateRangeLabel}`, 15, 31);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 38);
      // Summary boxes
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 15, 54);
      const adminStats = [
        { label: 'Total Revenue', value: `${exportData.totalRevenue.toLocaleString()} RWF` },
        { label: 'Paid Revenue', value: `${exportData.totalPaidRevenue.toLocaleString()} RWF` },
        { label: 'Total Orders', value: String(exportData.totalOrders) },
        { label: 'Paid Orders', value: String(exportData.totalPaidOrders) },
      ];
      const boxW = (pageW - 40) / 4;
      adminStats.forEach((s, i) => {
        const bx = 15 + i * (boxW + 5);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(bx, 58, boxW, 22, 3, 3, 'F');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
        doc.text(s.value, bx + boxW / 2, 68, { align: 'center' });
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
        doc.text(s.label.toUpperCase(), bx + boxW / 2, 74, { align: 'center' });
      });
      // Product breakdown table
      doc.setTextColor(30, 30, 30); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Product Sales Breakdown', 15, 92);
      const prodBody = exportData.rows.map((r, i) => [
        i + 1, r.name, r.units, r.revenue.toLocaleString(),
        exportData.totalRevenue > 0 ? `${(r.revenue / exportData.totalRevenue * 100).toFixed(1)}%` : '0%',
      ]);
      prodBody.push(['', 'TOTAL', exportData.totalUnits, exportData.totalRevenue.toLocaleString(), '100%']);
      autoTable(doc, {
        head: [['#', 'Product Name', 'Units Sold', 'Revenue (RWF)', '% Share']],
        body: prodBody,
        startY: 96,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === prodBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [30, 64, 175];
          }
        },
      });
      // Paid products table
      const yPaid = (doc.lastAutoTable?.finalY || 96) + 12;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text('Paid Products', 15, yPaid);
      autoTable(doc, {
        head: [['#', 'Product Name', 'Paid Units', 'Paid Revenue (RWF)', '% of Paid Revenue']],
        body: [
          ...exportData.paidRows.map((r, i) => [
            i + 1,
            r.name,
            r.units,
            r.revenue.toLocaleString(),
            exportData.totalPaidRevenue > 0 ? `${(r.revenue / exportData.totalPaidRevenue * 100).toFixed(1)}%` : '0%',
          ]),
          ['', 'TOTAL PAID', exportData.totalPaidUnits, exportData.totalPaidRevenue.toLocaleString(), '100%']
        ],
        startY: yPaid + 4,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [236, 253, 245] }
      });

      // Order details table
      const y2 = (doc.lastAutoTable?.finalY || 96) + 12;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text('Order Details', 15, y2);
      autoTable(doc, {
        head: [['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Amount (RWF)']],
        body: exportData.orders.map(o => [
          `#${o.id}`,
          o.customer_name || o.full_name || o.customer_email || '—',
          normalizeDate(o.created_at || o.date).toLocaleDateString(),
          o.status,
          normalizePaymentStatusValue(o),
          Number(o.total_amount || o.total || 0).toLocaleString(),
        ]),
        startY: y2 + 4,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [239, 246, 255] },
      });
      // Footer on each page
      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(170, 170, 170);
        doc.text(`AVATA Trading — Confidential | Page ${p} of ${pages}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }
      doc.save(`AVATA-${reportType}-report-${reportDate}.pdf`);
      setShowPdfPreview(false);
    };

    const AdminPdfPreviewModal = () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowPdfPreview(false)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
          {/* Modal toolbar */}
          <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
            <div>
              <h3 className="font-black text-lg">PDF Preview</h3>
              <p className="text-blue-200 text-xs">{reportType === 'daily' ? 'Daily' : 'Weekly'} Report — {reportDateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={generateAdminPDF} className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 text-sm transition-all shadow-md">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={() => setShowPdfPreview(false)} className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Paper preview */}
          <div className="p-5 bg-gray-100">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Report header */}
              <div className="bg-blue-600 px-6 py-5 text-white">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">AVATA Trading</p>
                <h2 className="text-2xl font-black tracking-tight">{reportType === 'daily' ? 'Daily' : 'Weekly'} Sales Report</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-200">
                  <span>Period: <span className="text-white font-bold">{reportDateRangeLabel}</span></span>
                  <span>Generated: <span className="text-white font-bold">{new Date().toLocaleString()}</span></span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                  <h4 className="font-black text-gray-700 text-xs uppercase tracking-wider mb-3">Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Revenue', value: `${reportData.totalRevenue.toLocaleString()} RWF`, color: 'text-green-600' },
                      { label: 'Total Orders',  value: reportData.totalOrders, color: 'text-blue-600' },
                      { label: 'Units Sold',    value: reportData.totalUnits,  color: 'text-purple-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Product breakdown */}
                <div>
                  <h4 className="font-black text-gray-700 text-xs uppercase tracking-wider mb-3">Product Sales Breakdown</h4>
                  {reportData.rows.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="p-2.5 text-left font-bold">#</th>
                            <th className="p-2.5 text-left font-bold">Product Name</th>
                            <th className="p-2.5 text-right font-bold">Units</th>
                            <th className="p-2.5 text-right font-bold">Revenue (RWF)</th>
                            <th className="p-2.5 text-right font-bold">% Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                              <td className="p-2.5 text-gray-400">{i + 1}</td>
                              <td className="p-2.5 font-semibold text-gray-800">{row.name}</td>
                              <td className="p-2.5 text-right">{row.units}</td>
                              <td className="p-2.5 text-right font-bold text-green-700">{row.revenue.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-gray-600">{reportData.totalRevenue > 0 ? (row.revenue / reportData.totalRevenue * 100).toFixed(1) : 0}%</td>
                            </tr>
                          ))}
                          <tr className="bg-blue-100 font-black text-blue-800">
                            <td className="p-2.5" colSpan={2}>TOTAL</td>
                            <td className="p-2.5 text-right">{reportData.totalUnits}</td>
                            <td className="p-2.5 text-right text-green-700">{reportData.totalRevenue.toLocaleString()}</td>
                            <td className="p-2.5 text-right">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-6">No products sold in this period.</p>
                  )}
                </div>
                {/* Order details */}
                {reportData.orders.length > 0 && (
                  <div>
                    <h4 className="font-black text-gray-700 text-xs uppercase tracking-wider mb-3">Order Details ({reportData.orders.length})</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="p-2.5 text-left font-bold">Order ID</th>
                            <th className="p-2.5 text-left font-bold">Customer</th>
                            <th className="p-2.5 text-left font-bold">Date</th>
                            <th className="p-2.5 text-left font-bold">Status</th>
                            <th className="p-2.5 text-right font-bold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.orders.slice(0, 20).map((order, i) => (
                            <tr key={order.id} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                              <td className="p-2.5 text-blue-600 font-bold">#{order.id}</td>
                              <td className="p-2.5 text-gray-700">{order.customer_name || order.full_name || order.customer_email || '—'}</td>
                              <td className="p-2.5 text-gray-500">{normalizeDate(order.created_at || order.date).toLocaleDateString()}</td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded-full font-bold ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                              </td>
                              <td className="p-2.5 text-right font-bold text-green-700">{Number(order.total_amount || order.total || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                          {reportData.orders.length > 20 && (
                            <tr className="bg-gray-50"><td className="p-2.5 text-center text-gray-500" colSpan={5}>... and {reportData.orders.length - 20} more orders (included in PDF download)</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-3">AVATA Trading — Confidential Report | Generated {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const ReportsView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <ClipboardList className="text-blue-600 w-8 h-8" />
          Sales Reports
        </h2>
        <p className="text-gray-500 font-medium">Generate and download daily or weekly sales reports with full product and order breakdown.</p>
      </div>

      {/* Controls */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6 space-y-5 shadow-sm`}>
        <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Configure Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Report Type */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Report Type</label>
            <div className="flex gap-2">
              {['daily', 'weekly'].map(type => (
                <button
                  key={type}
                  onClick={() => { setReportType(type); setReportGenerated(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all capitalize ${reportType === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : `border-gray-200 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">
              {reportType === 'daily' ? 'Select Date' : 'Any Day in the Week'}
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={e => { setReportDate(e.target.value); setReportGenerated(false); }}
              max={new Date().toISOString().slice(0, 10)}
              className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none font-bold transition-all ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`}
            />
          </div>

          {/* Quick Select */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Today',     fn: () => new Date().toISOString().slice(0, 10) },
                { label: 'Yesterday', fn: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); } },
                { label: 'This Week', fn: () => new Date().toISOString().slice(0, 10) },
                { label: 'Last Week', fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); } },
              ].map(q => (
                <button
                  key={q.label}
                  onClick={() => { setReportDate(q.fn()); setReportType(q.label.includes('Week') ? 'weekly' : 'daily'); setReportGenerated(false); }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setReportGenerated(true)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-200/60"
        >
          <BarChart3 className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `${reportData.totalRevenue.toLocaleString()} RWF`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
              { label: 'Paid Revenue', value: `${reportData.totalPaidRevenue.toLocaleString()} RWF`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Total Orders', value: reportData.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Paid Orders', value: reportData.totalPaidOrders, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
            ].map(s => (
              <div key={s.label} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-5 flex items-center gap-4 shadow-sm`}>
                <div className={`p-3 rounded-xl border ${s.bg}`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Product Breakdown Table */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6 shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {reportType === 'daily' ? 'Daily' : 'Weekly'} Sales — <span className="text-blue-600">{reportDateRangeLabel}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{reportData.rows.length} product(s) sold in this period</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPdfPreview(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-blue-200/60"
                >
                  <FileText className="w-4 h-4" />
                  Preview & PDF
                </button>
                <button
                  onClick={downloadReportCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-green-200/60"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>

            {reportData.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left border-b ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                      <th className="py-3 pr-3 font-black">#</th>
                      <th className="py-3 pr-4 font-black">Product</th>
                      <th className="py-3 pr-4 font-black">Units Sold</th>
                      <th className="py-3 pr-4 font-black">Revenue</th>
                      <th className="py-3 font-black">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row, i) => {
                      const pct = reportData.totalRevenue > 0 ? (row.revenue / reportData.totalRevenue * 100) : 0;
                      return (
                        <tr key={`${row.name}-${i}`} className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className={`py-3 pr-3 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</td>
                          <td className="py-3 pr-4 font-semibold">{row.name}</td>
                          <td className="py-3 pr-4">{row.units}</td>
                          <td className="py-3 pr-4 font-black text-green-600">{row.revenue.toLocaleString()} RWF</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex-1 rounded-full h-1.5 max-w-[80px] ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct.toFixed(0)}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-500">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className={`font-black border-t-2 ${darkMode ? 'border-gray-600 text-white' : 'border-gray-300'}`}>
                      <td className="py-3 pr-3" colSpan={2}>TOTAL</td>
                      <td className="py-3 pr-4">{reportData.totalUnits}</td>
                      <td className="py-3 pr-4 text-green-600">{reportData.totalRevenue.toLocaleString()} RWF</td>
                      <td className="py-3">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-14 text-center">
                <ClipboardList size={52} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-bold text-lg">No sales recorded for this period.</p>
                <p className="text-gray-400 text-sm mt-1">Try selecting a different date or time range.</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          {reportData.orders.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6 shadow-sm`}>
              <h3 className={`font-black text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Details <span className="text-blue-600">({reportData.orders.length})</span></h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left border-b ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                      <th className="py-3 pr-4 font-black">Order ID</th>
                      <th className="py-3 pr-4 font-black">Customer</th>
                      <th className="py-3 pr-4 font-black">Date</th>
                      <th className="py-3 pr-4 font-black">Status</th>
                      <th className="py-3 pr-4 font-black">Payment</th>
                      <th className="py-3 font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map(order => (
                      <tr key={order.id} className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className="py-3 pr-4 font-bold text-blue-600">#{order.id}</td>
                        <td className="py-3 pr-4">{order.customer_name || order.full_name || order.customer_email || '—'}</td>
                        <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{normalizeDate(order.created_at || order.date).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' || order.status === 'Not_Delivered' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOrderPaid(order) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isOrderPaid(order) ? 'Paid' : normalizePaymentStatusValue(order)}
                          </span>
                        </td>
                        <td className="py-3 font-black text-green-600">{Number(order.total_amount || order.total || 0).toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  // ──────────────────────────────────────────────────────────────────────────

  const ProfileView = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-200">
          {user?.full_name?.charAt(0)}
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900">{user?.full_name}</h2>
          <p className="text-gray-500 text-lg">{user?.role?.toUpperCase()} ACCOUNT • {user?.email}</p>
        </div>
      </div>

      {profileMsg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-bounce ${profileMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <AlertCircle size={20} />
          <p className="font-bold">{profileMsg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="text-blue-600" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase">Email Address (Unique ID)</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed font-medium"
                />
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {isSavingProfile ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                {isSavingProfile ? 'Saving...' : 'Update Records'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="text-orange-400" /> Security Hub
            </h3>
            <p className="text-sm text-gray-400 mb-6">Keep your administrative access secure by updating credentials regularly.</p>
            <button
              onClick={() => alert('Security protocol initiated: Reset link sent to your root email.')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold transition-all"
            >
              Reset Administrator Key
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Account Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs text-gray-400 font-bold uppercase">Role</span>
                <span className="text-xs font-black text-blue-600 uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs text-gray-400 font-bold uppercase">Joined</span>
                <span className="text-xs font-black text-gray-700">FEB 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentOptionsView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <CreditCard className="text-blue-600" /> Payment Options
        </h2>
        <p className="text-gray-500 font-medium">Set bank accounts, mobile money numbers, and payment reference prefix shown to customers.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        {paymentOptionsLoading ? (
          <p className="text-sm text-gray-500">Loading payment options...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">BK Account Number</label>
                  {paymentOptions.bank_bk_account && (
                    <button
                      type="button"
                      onClick={() => clearPaymentOptionField('bank_bk_account', 'BK account number')}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={paymentOptions.bank_bk_account}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, bank_bk_account: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="e.g. 01123XXXXXXX"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Equity Account Number</label>
                  {paymentOptions.bank_equity_account && (
                    <button
                      type="button"
                      onClick={() => clearPaymentOptionField('bank_equity_account', 'Equity account number')}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={paymentOptions.bank_equity_account}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, bank_equity_account: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="e.g. 01456XXXXXXX"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">MTN Mobile Money</label>
                  {paymentOptions.mobile_mtn_number && (
                    <button
                      type="button"
                      onClick={() => clearPaymentOptionField('mobile_mtn_number', 'MTN number')}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={paymentOptions.mobile_mtn_number}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, mobile_mtn_number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="e.g. +25078XXXXXXX"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Airtel Money</label>
                  {paymentOptions.mobile_airtel_number && (
                    <button
                      type="button"
                      onClick={() => clearPaymentOptionField('mobile_airtel_number', 'Airtel number')}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={paymentOptions.mobile_airtel_number}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, mobile_airtel_number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="e.g. +25073XXXXXXX"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Company TIN Number</label>
                <input
                  type="text"
                  value={paymentOptions.tin_number}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, tin_number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="TIN Number"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">BPR Plc Account number</label>
                <input
                  type="text"
                  value={paymentOptions.ebm_number}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, ebm_number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  placeholder="BPR Plc"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Payment Instructions (Optional)</label>
                <textarea
                  value={paymentOptions.notes}
                  onChange={(e) => setPaymentOptions(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none min-h-[100px]"
                  placeholder="Any extra payment instructions shown to customers"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={clearAllPaymentOptionsDraft}
                  disabled={paymentOptionsSaving}
                  className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold disabled:opacity-50"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={savePaymentOptions}
                  disabled={paymentOptionsSaving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {paymentOptionsSaving ? 'Saving...' : 'Save Payment Options'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">After clearing or editing values, click Save Payment Options to apply the new details.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Messages View with pagination (5 per page)
  const MessagesView = () => {
    const all = Array.isArray(messages) ? messages : [];
    const filteredMessages = all.filter((message) =>
      fuzzyIncludes(message.name, searchTerm) ||
      fuzzyIncludes(message.email, searchTerm) ||
      fuzzyIncludes(message.subject, searchTerm) ||
      fuzzyIncludes(message.message, searchTerm)
    );

    const totalMessages = filteredMessages.length;
    const totalPages = Math.max(1, Math.ceil(totalMessages / messagesPerPage));
    const currentPage = Math.min(messagesPage, totalPages);
    const startIdx = (currentPage - 1) * messagesPerPage;
    const pageMessages = filteredMessages.slice(startIdx, startIdx + messagesPerPage);

    const goToPage = (p) => {
      const next = Math.max(1, Math.min(totalPages, p));
      setMessagesPage(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Customer Messages</h2>
          <div className="text-sm text-gray-600">Showing {Math.min(totalMessages, messagesPerPage)} of {totalMessages} — Page {currentPage}/{totalPages}</div>
        </div>

        {/* Messages Grid */}
        <div className="grid gap-4">
          {pageMessages.map((message) => (
            <article key={message.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6">
              <header className="flex items-start justify-between mb-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {message.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{message.name}</h3>
                    <p className="text-sm text-gray-600">{message.email}</p>
                  </div>
                </div>
                <time className="text-sm text-gray-500">{message.created_at ? new Date(message.created_at).toLocaleString() : 'N/A'}</time>
              </header>

              {message.subject && (
                <div className="mb-2">
                  <p className="font-semibold text-gray-700">Subject: {message.subject}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
              </div>

              <footer className="flex items-center justify-between text-sm text-gray-600">
                <div>{message.phone ? (<span><span className="font-semibold">Phone:</span> {message.phone}</span>) : <span className="text-gray-400">No phone provided</span>}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigator.clipboard?.writeText(message.email || '')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">Copy Email</button>
                  <button onClick={() => { if (confirm('Delete this message?')) { fetch(`http://localhost:5000/api/messages/${message.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => { if (r.ok) { setMessages(messages.filter(m => m.id !== message.id)); alert('Deleted'); } else { alert('Failed to delete'); } }).catch(() => alert('Failed to delete')); } }} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs">Delete</button>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalMessages > messagesPerPage && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => goToPage(i + 1)} className={`px-3 py-1 rounded-lg ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
          </div>
        )}

        {totalMessages === 0 && (
          <div className="text-center py-12 bg-white rounded-xl mt-6">
            <MessageSquare size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages found</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <AdminSidebar active={activeView} setActiveView={setActiveView} />
        <div className="flex-1 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold max-w-sm animate-in slide-in-from-right-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white shadow-green-200' :
              toast.type === 'error' ? 'bg-red-600 text-white shadow-red-200' :
                toast.type === 'warning' ? 'bg-orange-500 text-white shadow-orange-200' :
                  'bg-blue-600 text-white shadow-blue-200'
              }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="opacity-70 hover:opacity-100 transition text-lg leading-none"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-lg mb-1">Confirm Action</h3>
                <p className="text-gray-600 text-sm">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white hover:shadow-lg hover:shadow-blue-200 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen overflow-auto">
        {/* Sidebar */}
        <AdminSidebar
          active={activeView}
          setActiveView={setActiveView}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Interface Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Global Header */}
          <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-90`}>
            <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Menu className="w-6 h-6 text-blue-600" />
                </button>
                <div className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex-1 min-w-0 max-w-[14rem] sm:max-w-md shadow-inner`}>
                  <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Global search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-transparent outline-none flex-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-xs font-black uppercase tracking-tighter opacity-80">{user?.role}</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">{user?.full_name}</p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }}
                    className="p-2.5 rounded-xl transition-all bg-gray-100 hover:bg-gray-200 text-gray-700"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="p-2 border-b text-sm font-semibold">Notifications</div>
                      <div className="max-h-56 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No notifications</div>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`p-3 text-sm border-b ${n.is_read ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openNotificationLink(n)}
                                className="flex-1 text-left hover:bg-gray-50 rounded-md p-1 -m-1 transition"
                              >
                                <div className="font-medium text-gray-800">{n.title || 'Notification'}</div>
                                <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                                <div className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                              </button>
                              <div className="flex flex-col items-end gap-1">
                                {!n.is_read && <button onClick={() => markNotificationRead(n.id)} className="text-xs text-blue-600">Mark read</button>}
                                <button onClick={() => deleteNotificationItem(n.id)} className="text-xs text-red-500">Delete</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Exit</span>
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable Content View */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'reviews' && <CustomerReviewsView key="reviews" reviews={recentReviews} darkMode={darkMode} onRefresh={loadReviews} />}
              {activeView === 'users' && <UsersView />}
              {activeView === 'products' && <ProductsView />}
              {activeView === 'categories' && <CategoriesView />}
              {activeView === 'orders' && (() => {
                const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
                  const searchStr = searchTerm.toLowerCase().trim();
                  const location = getOrderLocationDisplay(order).toLowerCase();
                  const matchesSearch =
                    !searchStr ||
                    (order.id?.toString() || '').includes(searchStr) ||
                    (order.customer_name || '').toLowerCase().includes(searchStr) ||
                    (order.email || order.customer_email || '').toLowerCase().includes(searchStr) ||
                    (order.customer_phone || '').toLowerCase().includes(searchStr) ||
                    location.includes(searchStr);

                  const src = normalizeOrderSourceValue(order.order_source, order.status, order.customer_email || order.email);
                  const matchesSource =
                    sourceFilter === 'All' ||
                    (sourceFilter === 'WhatsApp' && src === 'whatsapp') ||
                    (sourceFilter === 'Email' && src === 'email') ||
                    (sourceFilter === 'DirectNoEmail' && src === 'direct_no_email') ||
                    (sourceFilter === 'NoWhatsApp' && src !== 'whatsapp');

                  return matchesSearch && matchesSource && matchesStatusFilter(order, statusFilter);
                });
                const totalPages = Math.max(1, Math.ceil(filteredOrders.length / MANAGEMENT_PAGE_SIZE));
                const currentPage = Math.min(ordersPage, totalPages);
                const paginatedOrders = filteredOrders.slice((currentPage - 1) * MANAGEMENT_PAGE_SIZE, currentPage * MANAGEMENT_PAGE_SIZE);

                return (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                          <ShoppingBag className="text-purple-600 w-8 h-8" />
                          Order Management
                        </h2>
                        <p className="text-gray-500 font-medium">Verify payments and track fulfillment lifecycle</p>
                      </div>
                      <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2">
                        <label className="text-sm font-semibold text-gray-600">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status === 'All' ? 'All' : status.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <label className="text-sm font-semibold text-gray-600">Source</label>
                        <select
                          value={sourceFilter}
                          onChange={(e) => setSourceFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="All">All</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Email">Email</option>
                          <option value="DirectNoEmail">Direct No Email</option>
                          <option value="NoWhatsApp">No WhatsApp</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Card Layout - Visible on mobile only */}
                    <div className="block lg:hidden space-y-4">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => {
                          const oId = order.id || order.orderId;
                          const items = order.items || [];
                          const orderDate = new Date(order.created_at);
                          const orderStatus = String(order.status || '').toLowerCase();
                          const paymentStatus = String(order.payment_status || '').toLowerCase();
                          const verificationStatus = String(order.verification_status || '').toLowerCase();
                          const hasProof = Boolean(order.payment_proof_file || order.payment_proof);
                          const isPaid = ['paid', 'verified'].includes(paymentStatus) || orderStatus === 'paid';
                          const canApprovePayment = hasProof && !isPaid && ['waiting_proof', 'payment_under_review'].includes(orderStatus);
                          const canApproveToProcessing = isPaid && orderStatus === 'paid';
                          const canApprove = canApprovePayment || canApproveToProcessing;
                          const canDeliver = isPaid && ['paid', 'processing', 'shipped'].includes(orderStatus);
                          const canCancel = ['waiting_proof', 'payment_under_review', 'paid', 'processing'].includes(orderStatus);

                          return (
                            <div id={`order-row-${oId}`} key={oId} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                              {/* Order Header */}
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b-2 border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                      #{oId}
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-semibold">Order ID</p>
                                      <p className="text-sm font-bold text-gray-900">{order.payment_number || `PAY-${oId}`}</p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                    ${order.status === 'Waiting_Proof' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'Payment_Under_Review' ? 'bg-orange-100 text-orange-800' :
                                        order.status === 'Paid' || order.status === 'Payment_Received' ? 'bg-green-100 text-green-800' :
                                          order.status === 'Processing' ? 'bg-cyan-100 text-cyan-800' :
                                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'Delivered' ? 'bg-purple-100 text-purple-800' :
                                              order.status === 'Not_Delivered' ? 'bg-red-100 text-red-800' :
                                                order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                  order.status === 'Cancelled' ? 'bg-red-200 text-red-900' : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {order.status?.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {/* Product Images */}
                                <div className="flex -space-x-2 mb-2">
                                  {items.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-gray-100 shadow-md" title={item.product_name}>
                                      {item.image_url || item.image ? (
                                        <img src={getFullImageUrl(item.image_url || item.image)} alt={item.product_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-5 h-5 text-gray-400 m-auto mt-2" />
                                      )}
                                    </div>
                                  ))}
                                  {items.length > 4 && (
                                    <div className="w-10 h-10 rounded-lg border-2 border-white bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                      +{items.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Customer</p>
                                    <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                                    <p className="text-xs text-gray-500">{order.customer_phone || 'N/A'}</p>
                                    <p className={`text-xs truncate ${order?.delivery_address ? 'text-gray-400' : 'text-red-500 font-semibold'}`} title={getOrderLocationDisplay(order)}>📍 {getOrderLocationDisplay(order)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Date & Time</p>
                                    <p className="text-sm font-bold text-gray-900">{orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    <p className="text-xs text-gray-500">{orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Source</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getOrderSourceMeta(order.order_source, order.status, order.customer_email || order.email).className}`}>
                                      {getOrderSourceMeta(order.order_source, order.status, order.customer_email || order.email).label}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-purple-700 font-semibold">Total Amount</p>
                                      <p className="text-lg font-black text-purple-600">{(order.total_amount || 0).toLocaleString()} RWF</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-purple-700 font-semibold">Items</p>
                                      <p className="text-lg font-black text-purple-600">{items.length}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons - Compact Mobile Layout */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                  <button onClick={() => setExpandedOrderItems(prev => ({ ...prev, [oId]: !prev[oId] }))} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <Eye className="w-4 h-4" /> View
                                  </button>
                                  {canApprove && (
                                    <button onClick={() => {
                                      setVerifyingOrder(order);
                                      setCompactVerifyModal(true);
                                      setShowVerifyModal(true);
                                    }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                      <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                  )}
                                  {canDeliver && (
                                    <button onClick={() => deliverOrder(oId)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                      <Truck className="w-4 h-4" /> Deliver
                                    </button>
                                  )}
                                  {canCancel && (
                                    <button onClick={() => cancelOrder(oId)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                      <Ban className="w-4 h-4" /> Cancel
                                    </button>
                                  )}
                                </div>

                                {user?.role === 'admin' && (
                                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-amber-700" />
                                      <p className="text-xs font-bold text-amber-900">Admin Receipt Editor</p>
                                    </div>
                                    <p className="text-[11px] text-amber-800 mb-2">Ajoutez ou modifiez les frais de transport (RWF) ; « Retirer (0) » les enlève du reçu PDF. La preuve de paiement du client n&apos;est plus bloquée.</p>
                                    <div className="flex flex-col gap-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={receiptTransportDraft[oId] ?? String(Number(order.receipt_transport || 0))}
                                        onChange={(e) => setReceiptTransportDraft((prev) => ({ ...prev, [oId]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-amber-300 text-xs font-semibold text-gray-800 bg-white"
                                        placeholder="Transport amount (RWF)"
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => updateReceiptSettings(oId)}
                                          disabled={receiptUpdatingOrderId === oId}
                                          className="flex-1 min-w-[8rem] bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
                                        >
                                          {receiptUpdatingOrderId === oId ? 'Saving...' : 'Save Receipt'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReceiptTransportDraft((prev) => ({ ...prev, [oId]: '0' }));
                                            updateReceiptSettings(oId, { forceAmount: 0 });
                                          }}
                                          disabled={receiptUpdatingOrderId === oId}
                                          className="flex-1 min-w-[8rem] bg-white border-2 border-amber-400 text-amber-900 hover:bg-amber-100 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
                                        >
                                          Retirer (0)
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Receipt Download - Show when BOTH payment verified AND delivered/completed */}
                                {((order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid') &&
                                  (order.status === 'Delivered' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'completed' || order.status === 'Shipped')) && (
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                      <p className="text-xs font-bold text-blue-900">📄 Order Receipt</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <button
                                        onClick={async () => {
                                          try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`http://localhost:5000/api/orders/${oId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                            if (!res.ok) { showToast('Receipt not available yet', 'error'); return; }
                                            const blob = await res.blob();
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                          } catch (e) { console.error(e); showToast('Failed to load receipt', 'error'); }
                                        }}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md"
                                      >
                                        <Eye className="w-4 h-4" /> View
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`http://localhost:5000/api/orders/${oId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                            if (!res.ok) { showToast('Receipt not available yet', 'error'); return; }
                                            const blob = await res.blob();
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `AVATA-Receipt-Order-${oId}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            URL.revokeObjectURL(url);
                                            showToast('📥 Receipt downloaded!', 'success');
                                          } catch (e) { console.error(e); showToast('Failed to download receipt', 'error'); }
                                        }}
                                        className="bg-white border-2 border-indigo-300 hover:bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md"
                                      >
                                        <FileText className="w-4 h-4" /> PDF
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <button onClick={() => {
                                  if (expandedOrderComments[oId]) {
                                    setExpandedOrderComments(prev => ({ ...prev, [oId]: false }));
                                  } else {
                                    loadOrderComments(oId);
                                    setExpandedOrderComments(prev => ({ ...prev, [oId]: true }));
                                  }
                                }} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                  <MessageSquare className="w-4 h-4" /> {expandedOrderComments[oId] ? 'Hide' : 'Show'} Comments
                                </button>

                                {/* Expanded Items for Mobile */}
                                {expandedOrderItems[oId] && (
                                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-3">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                      <Package className="w-4 h-4 text-purple-600" />
                                      Order Items ({items.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white">
                                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            {item.image_url || item.image ? (
                                              <img src={getFullImageUrl(item.image_url || item.image)} alt={item.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                              <Package className="w-6 h-6 text-gray-400 m-auto mt-4" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-xs mb-1 truncate">{item.product_name}</p>
                                            {item.selected_size && (
                                              <p className="text-xs text-indigo-600 font-semibold mb-1">Size: {item.selected_size}</p>
                                            )}
                                            <div className="flex items-center justify-between">
                                              <p className="text-xs text-purple-600 font-bold">{item.price?.toLocaleString()} RWF</p>
                                              <p className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Qty: {item.quantity}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Expanded Comments for Mobile */}
                                {expandedOrderComments[oId] && (
                                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-3">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                      <MessageSquare className="w-4 h-4 text-purple-600" />
                                      Comments
                                    </h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                                      {orderComments[oId]?.length > 0 ? (
                                        orderComments[oId].map((c, i) => (
                                          <div key={i} className={`flex flex-col ${(c.author_role || c.role) === 'customer' ? 'items-start' : 'items-end'}`}>
                                            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${(c.author_role || c.role) === 'customer' ? 'bg-white text-gray-800 border border-gray-200' : 'bg-purple-600 text-white'}`}>
                                              {c.comment}
                                            </div>
                                            <div className="text-[9px] text-gray-400 mt-1 px-2">{(c.author_role || c.role || 'user')} • {new Date(c.created_at).toLocaleString()}</div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-center text-gray-400 text-xs py-4">No comments yet</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newComment[oId] || ''}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, [oId]: e.target.value }))}
                                        placeholder="Add comment..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                      <button
                                        onClick={() => sendOrderComment(oId)}
                                        disabled={sendingComment === oId || !(newComment[oId] || '').trim()}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="bg-white rounded-xl p-8 text-center">
                          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold">No orders found</p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Table Layout - Hidden on mobile, visible on lg+ */}
                    <div className="hidden lg:block bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] lg:min-w-[920px]">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Order ID</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Products</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Date & Time</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Source</th>
                              <th className="px-6 py-4 text-center text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {paginatedOrders.length > 0 ? (
                              paginatedOrders.map((order) => {
                                const oId = order.id || order.orderId;
                                const items = order.items || [];
                                const orderDate = new Date(order.created_at);
                                const orderStatus = String(order.status || '').toLowerCase();
                                const paymentStatus = String(order.payment_status || '').toLowerCase();
                                const verificationStatus = String(order.verification_status || '').toLowerCase();
                                const hasProof = Boolean(order.payment_proof_file || order.payment_proof);
                                const isPaid = ['paid', 'verified'].includes(paymentStatus) || orderStatus === 'paid';
                                const canApprovePayment = hasProof && !isPaid && ['waiting_proof', 'payment_under_review'].includes(orderStatus);
                                const canApproveToProcessing = isPaid && orderStatus === 'paid';
                                const canApprove = canApprovePayment || canApproveToProcessing;
                                const canDeliver = isPaid && ['paid', 'processing', 'shipped'].includes(orderStatus);
                                const canCancel = ['waiting_proof', 'payment_under_review', 'paid', 'processing'].includes(orderStatus);

                                return (
                                  <React.Fragment key={oId}>
                                    <tr id={`order-row-${oId}`} className="hover:bg-gray-50 transition-colors">
                                      {/* Order ID */}
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 font-bold shadow-sm">
                                            #{oId}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Product Images */}
                                      <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                          {items.slice(0, 3).map((item, idx) => (
                                            <div
                                              key={idx}
                                              onClick={() => {
                                                // Show full image modal
                                                setExpandedOrderItems(prev => ({ ...prev, [oId]: !prev[oId] }));
                                              }}
                                              className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-gray-100 shadow-md hover:scale-110 transition-transform cursor-pointer"
                                              title={item.product_name}
                                            >
                                              {item.image_url || item.image ? (
                                                <img
                                                  src={getFullImageUrl(item.image_url || item.image)}
                                                  alt={item.product_name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <Package className="w-6 h-6 text-gray-400 m-auto" />
                                              )}
                                            </div>
                                          ))}
                                          {items.length > 3 && (
                                            <div className="w-12 h-12 rounded-lg border-2 border-white bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                              +{items.length - 3}
                                            </div>
                                          )}
                                        </div>

                                      </td>

                                      {/* Customer Info */}
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-gray-900 text-sm">{order.customer_name}</span>
                                          <span className="text-xs text-gray-500">{order.email || order.customer_email}</span>
                                          <span className="text-xs text-gray-500">{order.customer_phone || 'N/A'}</span>
                                          <span className={`text-xs truncate ${order?.delivery_address ? 'text-gray-400' : 'text-red-500 font-semibold'}`} title={getOrderLocationDisplay(order)}>📍 {getOrderLocationDisplay(order)}</span>
                                        </div>
                                      </td>

                                      {/* Date & Time */}
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-purple-600" />
                                            {orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Amount */}
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-purple-600 text-base">{(order.total_amount || 0).toLocaleString()} RWF</span>
                                          <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                      </td>

                                      {/* Status Badge */}
                                      <td className="px-6 py-4">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block
                                          ${order.status === 'Waiting_Proof' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'Payment_Under_Review' ? 'bg-orange-100 text-orange-800' :
                                              order.status === 'Paid' || order.status === 'Payment_Received' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Processing' ? 'bg-cyan-100 text-cyan-800' :
                                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                  order.status === 'Delivered' ? 'bg-purple-100 text-purple-800' :
                                                    order.status === 'Not_Delivered' ? 'bg-red-100 text-red-800' :
                                                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'Cancelled' ? 'bg-red-200 text-red-900' :
                                                          'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {order.status?.replace(/_/g, ' ')}
                                        </span>
                                      </td>

                                      {/* Source Badge */}
                                      <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getOrderSourceMeta(order.order_source, order.status, order.customer_email || order.email).className}`}>
                                          {getOrderSourceMeta(order.order_source, order.status, order.customer_email || order.email).label}
                                        </span>
                                      </td>

                                      {/* Actions */}
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 min-w-[150px] sm:min-w-[180px]">
                                          {/* Blue Buttons Row */}
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => setExpandedOrderItems(prev => ({ ...prev, [oId]: !prev[oId] }))}
                                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                              title="View Order Details"
                                            >
                                              <Eye className="w-4 h-4" />
                                              View
                                            </button>
                                          </div>

                                          {/* Green Buttons Row */}
                                          {(canApprove || canDeliver) && (
                                            <div className="flex gap-2">
                                              {canApprove && (
                                                <button
                                                  onClick={() => {
                                                    setVerifyingOrder(order);
                                                    setCompactVerifyModal(true);
                                                    setShowVerifyModal(true);
                                                  }}
                                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                  title="Approve Payment"
                                                >
                                                  <CheckCircle className="w-4 h-4" />
                                                  Approve
                                                </button>
                                              )}
                                              {canDeliver && (
                                                <button
                                                  onClick={() => deliverOrder(oId)}
                                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                  title="Deliver Order"
                                                >
                                                  <Truck className="w-4 h-4" />
                                                  Deliver
                                                </button>
                                              )}
                                            </div>
                                          )}

                                          {/* Red Buttons Row 2 - Cancel */}
                                          {canCancel && (
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => cancelOrder(oId)}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                title="Cancel Order"
                                              >
                                                <Ban className="w-4 h-4" />
                                                Cancel
                                              </button>
                                            </div>
                                          )}

                                          {/* Comment Button */}
                                          <button
                                            onClick={() => {
                                              if (expandedOrderComments[oId]) {
                                                setExpandedOrderComments(prev => ({ ...prev, [oId]: false }));
                                              } else {
                                                loadOrderComments(oId);
                                                setExpandedOrderComments(prev => ({ ...prev, [oId]: true }));
                                              }
                                            }}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                          >
                                            <MessageSquare className="w-4 h-4" />
                                            Comment
                                          </button>

                                          {user?.role === 'admin' && (
                                            <div className="pt-2 border-t border-amber-200 bg-amber-50 rounded-lg p-2">
                                              <p className="text-[10px] font-bold text-amber-800 mb-2 text-center">Add transport fee</p>
                                              <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={receiptTransportDraft[oId] ?? String(Number(order.receipt_transport || 0))}
                                                    onChange={(e) => setReceiptTransportDraft((prev) => ({ ...prev, [oId]: e.target.value }))}
                                                    className="flex-1 px-2 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-gray-800"
                                                    placeholder="Transport RWF"
                                                  />
                                                  <button
                                                    onClick={() => updateReceiptSettings(oId)}
                                                    disabled={receiptUpdatingOrderId === oId}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 shrink-0"
                                                  >
                                                    {receiptUpdatingOrderId === oId ? '...' : 'Save'}
                                                  </button>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setReceiptTransportDraft((prev) => ({ ...prev, [oId]: '0' }));
                                                    updateReceiptSettings(oId, { forceAmount: 0 });
                                                  }}
                                                  disabled={receiptUpdatingOrderId === oId}
                                                  className="w-full bg-white border border-amber-400 text-amber-900 py-1.5 rounded-lg text-[10px] font-bold hover:bg-amber-100 disabled:opacity-60"
                                                >
                                                  Add transport fee to receipt (0 RWF)
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Receipt Buttons - Show when BOTH payment verified AND delivered/completed */}
                                          {((order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid') &&
                                            (order.status === 'Delivered' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'completed' || order.status === 'Shipped')) && (
                                            <>
                                              <div className="pt-2 border-t border-gray-200">
                                                <p className="text-xs font-bold text-center text-indigo-700 mb-2">📄 Receipt</p>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      const token = localStorage.getItem('token');
                                                      const res = await fetch(`http://localhost:5000/api/orders/${oId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                                      if (!res.ok) { showToast('Receipt not available yet', 'error'); return; }
                                                      const blob = await res.blob();
                                                      const url = URL.createObjectURL(blob);
                                                      window.open(url, '_blank');
                                                    } catch (e) { console.error(e); showToast('Failed to load receipt', 'error'); }
                                                  }}
                                                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                  View
                                                </button>
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      const token = localStorage.getItem('token');
                                                      const res = await fetch(`http://localhost:5000/api/orders/${oId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                                      if (!res.ok) { showToast('Receipt not available yet', 'error'); return; }
                                                      const blob = await res.blob();
                                                      const url = URL.createObjectURL(blob);
                                                      const a = document.createElement('a');
                                                      a.href = url;
                                                      a.download = `AVATA-Receipt-Order-${oId}.pdf`;
                                                      document.body.appendChild(a);
                                                      a.click();
                                                      a.remove();
                                                      URL.revokeObjectURL(url);
                                                      showToast('📥 Receipt downloaded!', 'success');
                                                    } catch (e) { console.error(e); showToast('Failed to download receipt', 'error'); }
                                                  }}
                                                  className="flex-1 bg-white border-2 border-indigo-300 hover:bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  PDF
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Items Section */}
                                    {expandedOrderItems[oId] && (
                                      <tr className="bg-gray-50">
                                        <td colSpan="7" className="px-6 py-6">
                                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                              <Package className="w-5 h-5 text-purple-600" />
                                              Order Items ({items.length})
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                              {items.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer bg-white"
                                                  onClick={() => {
                                                    // Could open image in modal
                                                    if (item.image_url || item.image) {
                                                      window.open(getFullImageUrl(item.image_url || item.image), '_blank');
                                                    }
                                                  }}
                                                >
                                                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                    {item.image_url || item.image ? (
                                                      <img
                                                        src={getFullImageUrl(item.image_url || item.image)}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                                                      />
                                                    ) : (
                                                      <Package className="w-10 h-10 text-gray-400 m-auto mt-5" />
                                                    )}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm mb-1">{item.product_name}</p>
                                                    {item.selected_size && (
                                                      <p className="text-xs text-indigo-600 font-semibold mb-1">📏 Size: {item.selected_size}</p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                      <p className="text-sm text-purple-600 font-bold">{item.price?.toLocaleString()} RWF</p>
                                                      <p className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                        Qty: {item.quantity}
                                                      </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      Subtotal: {(item.price * item.quantity).toLocaleString()} RWF
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}

                                    {/* Expanded Comments Section */}
                                    {expandedOrderComments[oId] && (
                                      <tr className="bg-gray-50">
                                        <td colSpan="7" className="px-6 py-6">
                                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                              <MessageSquare className="w-5 h-5 text-purple-600" />
                                              Order Comments
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                              <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                                                {orderComments[oId]?.length > 0 ? (
                                                  orderComments[oId].map((c, i) => (
                                                    <div key={i} className={`flex flex-col ${(c.author_role || c.role) === 'customer' ? 'items-start' : 'items-end'}`}>
                                                      <div className={`max-w-[75%] px-4 py-3 rounded-xl shadow-sm ${(c.author_role || c.role) === 'customer'
                                                        ? 'bg-white text-gray-800 border border-gray-200'
                                                        : 'bg-purple-600 text-white'
                                                        }`}>
                                                        <p className="text-sm">{c.comment}</p>
                                                      </div>
                                                      <div className="text-[10px] text-gray-400 mt-1 px-2 font-medium">
                                                        {(c.author_role || c.role || 'user')} • {new Date(c.created_at).toLocaleString()}
                                                      </div>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="text-center py-8 text-gray-400">
                                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">No comments yet</p>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="p-3 border-t bg-white flex gap-2">
                                                <textarea
                                                  value={newComment[oId] || ''}
                                                  onChange={e => setNewComment(prev => ({ ...prev, [oId]: e.target.value }))}
                                                  placeholder="Type message..."
                                                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none text-xs resize-none h-10 transition-all"
                                                />
                                                <button
                                                  onClick={() => sendOrderComment(oId)}
                                                  disabled={sendingComment === oId || !(newComment[oId] || '').trim()}
                                                  className="px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all font-bold text-xs flex items-center gap-1"
                                                >
                                                  {sendingComment === oId ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <>
                                                      <Send className="w-3 h-3" />
                                                      Send
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="7" className="px-6 py-20 text-center">
                                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                  <p className="text-gray-400 font-bold text-lg">No orders found</p>
                                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {renderPaginationControls({
                      currentPage,
                      totalPages,
                      onPageChange: setOrdersPage,
                      totalItems: filteredOrders.length,
                      label: 'orders'
                    })}
                  </div>
                );
              })()}
              {activeView === 'messages' && <MessagesView />}
              {activeView === 'analytics' && <AnalyticsView />}
              {activeView === 'reports' && <ReportsView />}
              {activeView === 'payment-options' && renderPaymentOptionsView()}
              {activeView === 'profile' && <ProfileView />}
              {activeView === 'special-offer' && <SpecialOfferManager key="special-offer" darkMode={darkMode} onNotify={showToast} />}
              {activeView === 'hero-media' && <HeroVideoManager key="hero-media" darkMode={darkMode} onNotify={showToast} />}
              {activeView === 'advertisement' && <AdvertisementManager key="advertisement" darkMode={darkMode} onNotify={showToast} />}
            </div>
          </main>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && reportData && <AdminPdfPreviewModal />}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button onClick={closeUserModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="+250 XXX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={closeUserModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button onClick={closeProductModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  placeholder="DUSTMASK VIC 824 FLAT CERTIFIED"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({
                    ...productForm,
                    category_id: e.target.value,
                    subcategory_id: ''
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory (Optional)</label>
                <select
                  value={productForm.subcategory_id}
                  onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                >
                  <option value="">Select Subcategory</option>
                  {getNestedChildrenForCategory(productForm.category_id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{getCategoryOptionLabel(cat)}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (RWF)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="12000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size Type</label>
                  <select
                    value={productForm.size_type}
                    onChange={(e) => setProductForm((prev) => ({
                      ...prev,
                      size_type: e.target.value,
                      size_options_text: e.target.value === 'none' ? '' : prev.size_options_text
                    }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  >
                    <option value="none">No size options</option>
                    <option value="clothes">Clothes (S, M, L, XL...)</option>
                    <option value="shoes">Shoes (numeric)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size Options</label>
                  <input
                    type="text"
                    value={productForm.size_options_text}
                    onChange={(e) => setProductForm({ ...productForm, size_options_text: e.target.value })}
                    disabled={productForm.size_type === 'none'}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="e.g. 40:25000, 41:26000 OR XL:18000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use comma-separated values. Add optional price after colon.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Type</label>
                  <select
                    value={productForm.color_type}
                    onChange={(e) => setProductForm((prev) => ({
                      ...prev,
                      color_type: e.target.value,
                      color_options_text: e.target.value === 'none' ? '' : prev.color_options_text
                    }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  >
                    <option value="none">No color options</option>
                    <option value="basic">Basic Colors (Red, Blue, Green...)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Options</label>
                  <input
                    type="text"
                    value={productForm.color_options_text}
                    onChange={(e) => setProductForm({ ...productForm, color_options_text: e.target.value })}
                    disabled={productForm.color_type === 'none'}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="e.g. Red:25000, Blue:25000, Black:26000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use comma-separated values. Add optional price after colon.</p>
                </div>
              </div>

              {/* Variant Preview */}
              {((productForm.size_type !== 'none' && parseSizeOptions(productForm.size_options_text, productForm.size_type).length > 0) || 
                (productForm.color_type !== 'none' && parseColorOptions(productForm.color_options_text, productForm.color_type).length > 0)) && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Eye size={16} /> Available Variants Preview
                  </h4>
                  
                  {productForm.color_type !== 'none' && parseColorOptions(productForm.color_options_text, productForm.color_type).length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-blue-800 mb-2">Colors:</h5>
                      <div className="flex flex-wrap gap-2">
                        {parseColorOptions(productForm.color_options_text, productForm.color_type).map((color, idx) => (
                          <div key={idx} className="bg-white border border-blue-300 rounded px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800">{color.value}</span>
                            {color.price && <span className="text-blue-600 ml-2">RWF {Number(color.price).toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {productForm.size_type !== 'none' && parseSizeOptions(productForm.size_options_text, productForm.size_type).length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-blue-800 mb-2">Sizes:</h5>
                      <div className="flex flex-wrap gap-2">
                        {parseSizeOptions(productForm.size_options_text, productForm.size_type).map((size, idx) => (
                          <div key={idx} className="bg-white border border-blue-300 rounded px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800">{size.value}</span>
                            {size.price && <span className="text-blue-600 ml-2">RWF {Number(size.price).toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {productForm.color_type !== 'none' && productForm.size_type !== 'none' && 
                    parseColorOptions(productForm.color_options_text, productForm.color_type).length > 0 &&
                    parseSizeOptions(productForm.size_options_text, productForm.size_type).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h5 className="text-xs font-medium text-blue-800 mb-2">Color × Size Combinations:</h5>
                      <div className="text-xs text-blue-700 bg-white rounded p-2 max-h-32 overflow-y-auto">
                        {parseColorOptions(productForm.color_options_text, productForm.color_type).map((color) => 
                          parseSizeOptions(productForm.size_options_text, productForm.size_type).map((size) => {
                            const colorPrice = color.price ? Number(color.price) : null;
                            const sizePrice = size.price ? Number(size.price) : null;
                            const finalPrice = colorPrice || sizePrice || Number(productForm.price) || 'N/A';
                            return (
                              <div key={`${color.value}-${size.value}`} className="py-1">
                                {color.value} - {size.value}: RWF {typeof finalPrice === 'number' ? finalPrice.toLocaleString() : finalPrice}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Product Media (Images / Videos)</label>
                <MultipleImageUpload
                  images={editingProduct?.media || editingProduct?.images || []}
                  onChange={setImageFiles}
                />

                {editingProduct && (editingProduct.media || editingProduct.images) && (editingProduct.media?.length || editingProduct.images?.length) > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {(editingProduct.media || editingProduct.images.map((url) => ({ type: 'image', url }))).map((mediaItem, idx) => (
                      <div key={idx} className="border rounded-lg p-2 bg-gray-50 relative">
                        {mediaItem.type === 'video' ? (
                          <video src={mediaItem.url.startsWith('/uploads') ? `http://localhost:5000${mediaItem.url}` : mediaItem.url} className="w-full h-24 object-cover rounded" controls muted />
                        ) : (
                          <img src={mediaItem.url.startsWith('/uploads') ? `http://localhost:5000${mediaItem.url}` : mediaItem.url} alt={`img-${idx}`} className="w-full h-24 object-cover rounded" />
                        )}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleSetMainImage(editingProduct.id, mediaItem.url)} className="flex-1 text-xs px-2 py-1 bg-white border rounded">Set Main</button>
                          <button onClick={() => handleRemoveExistingImage(editingProduct.id, mediaItem.url)} className="flex-1 text-xs px-2 py-1 bg-red-600 text-white rounded">Remove</button>
                        </div>
                        {editingProduct.image === mediaItem.url && <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Main</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={closeProductModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={closeCategoryModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category (Optional)</label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="">None (Top-level category)</option>
                  {getSelectableParentCategories()
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{getCategoryOptionLabel(cat)}</option>
                    ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">You can create unlimited nested levels by selecting any existing category as parent.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Dust Masks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Category description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image (Optional)</label>
                {categoryForm.categoryImage && !categoryImageFile && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-2">Current image:</p>
                    <img src={categoryForm.categoryImage} alt="Category" className="h-24 w-24 object-cover rounded-lg" />
                  </div>
                )}
                {categoryImageFile && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-2">New image preview:</p>
                    <img src={URL.createObjectURL(categoryImageFile)} alt="New" className="h-24 w-24 object-cover rounded-lg" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCategoryImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setCategoryForm({ ...categoryForm, categoryImage: event.target?.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Upload an image for the category card on the home page</p>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button
                onClick={closeCategoryModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Modal - Fully Responsive */}
      {showVerifyModal && verifyingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-3 sm:p-4">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'} rounded-2xl sm:rounded-3xl shadow-2xl max-h-[88vh] ${compactVerifyModal ? 'max-w-sm sm:max-w-md' : 'max-w-sm sm:max-w-xl'} w-full border relative overflow-hidden`}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200/60 dark:border-gray-700">
              <div>
                <h3 className={`text-lg sm:text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verify Asset Transfer</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Financial Audit Protocol</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompactVerifyModal(prev => !prev)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {compactVerifyModal ? 'Expand' : 'Compact'}
                </button>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerifyingOrder(null);
                    setReceiptUrl('');
                    setCompactVerifyModal(true);
                  }}
                  className={`p-2 rounded-2xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(88vh-84px)] p-4 sm:p-5 space-y-4">
            <div className="space-y-4 mb-5">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-purple-50/50 border-purple-100'}`}>
                <div className="grid grid-cols-2 gap-4 text-xs font-black uppercase tracking-widest">
                  <div className="text-gray-400">Order ID</div>
                  <div className="text-right text-purple-600">#{verifyingOrder.id || verifyingOrder.orderId}</div>
                  <div className="text-gray-400">Merchant Total</div>
                  <div className="text-right text-green-600">{(verifyingOrder.total_amount || verifyingOrder.total || 0).toLocaleString()} RWF</div>
                </div>
              </div>

              {(verifyingOrder.payment_proof || verifyingOrder.payment_proof_file) ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-gray-400 ml-2">Payment Proof Evidence</p>
                  <div className={`relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 ${compactVerifyModal ? 'aspect-[16/10]' : 'aspect-video'} flex items-center justify-center`}>
                    {verifyingOrder.payment_proof_file ? (
                      <img
                        src={getFullImageUrl(verifyingOrder.payment_proof_file)}
                        alt="Payment Proof"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-[10px] font-bold text-gray-400 break-all">{verifyingOrder.payment_proof}</p>
                      </div>
                    )}
                    <a
                      href={verifyingOrder.payment_proof_file ? getFullImageUrl(verifyingOrder.payment_proof_file) : verifyingOrder.payment_proof}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-white text-xs uppercase"
                    >
                      Open Full Size
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-bold text-red-900 text-sm">No Payment Proof Uploaded</p>
                      <p className="text-xs text-red-700 mt-1">Customer must upload payment proof before approval</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              verifyPayment(verifyingOrder.id || verifyingOrder.orderId);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-2">Verification Receipt Code</label>
                <input
                  type="text"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-bold text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                  placeholder="Enter MTCN or Receipt Ref..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!verifyingOrder.payment_proof && !verifyingOrder.payment_proof_file}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-black text-xs sm:text-sm uppercase tracking-[0.15em] shadow-xl hover:shadow-green-100 dark:hover:shadow-green-900/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <CheckCircle className="w-5 h-5" /> {(!verifyingOrder.payment_proof && !verifyingOrder.payment_proof_file) ? 'No Proof - Cannot Approve' : 'Confirm Payment'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

