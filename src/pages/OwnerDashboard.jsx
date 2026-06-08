import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Upload,
  Menu,
  X,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  Settings,
  Save,
  Lock,
  Edit3,
  RefreshCw,
  CheckCircle,
  Truck,
  AlertCircle,
  Shield,
  ShieldCheck,
  User,
  XCircle,
  RotateCcw,
  Ban,
  Clock,
  ClipboardList,
  Percent,
  FolderTree,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { motion } from 'framer-motion';
import { heroTextReveal, fadeIn } from '../utils/motionVariants';
import { useAuth } from '../contexts/AuthContext';
import useDashboardNavigationGuard from '../utils/useDashboardNavigationGuard';
import getFullImageUrl from '../utils/getFullImageUrl';
import SpecialOfferManager from '../components/SpecialOfferManager';
import CustomerReviewsView from '../components/CustomerReviewsView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const ANALYTICS_PAGE_SIZE = 10;
const MANAGEMENT_PAGE_SIZE = 10;

const OwnerDashboard = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  useDashboardNavigationGuard({
    enabled: Boolean(isAuthenticated),
    message: 'You are leaving the Owner Dashboard. Unsaved dashboard context may be lost. Continue?'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('ownerDashboardStatusFilter') || 'All');
  const [sourceFilter, setSourceFilter] = useState(() => localStorage.getItem('ownerDashboardSourceFilter') || 'All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsPage, setProductsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [recentReviews, setRecentReviews] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('ownerDashboardTimeRange') || 'monthly');
  const [activeView, setActiveView] = useState(() => localStorage.getItem('ownerDashboardActiveView') || 'dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    stock: '',
    image: ''
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [customers, setCustomers] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [topCustomersPage, setTopCustomersPage] = useState(1);
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [businessStatusPage, setBusinessStatusPage] = useState(1);
  const [productsReportPage, setProductsReportPage] = useState(1);
  // Reports
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('daily');
  const [reportGenerated, setReportGenerated] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
  // Order comments
  const [orderComments, setOrderComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [sendingComment, setSendingComment] = useState(null);
  const [expandedOrderComments, setExpandedOrderComments] = useState({});
  const [expandedOrderItems, setExpandedOrderItems] = useState({});
  // Profile
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' });
  const [profilePw, setProfilePw] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const isOwner = user?.email?.includes('owner') || user?.role === 'owner';

  const normalizeOrderSourceValue = (source, status, email) => {
    const normalized = String(source || '').trim().toLowerCase();
    if (['email', 'mail', 'e-mail'].includes(normalized)) return 'email';
    if (normalized === 'direct_no_email') return 'direct_no_email';
    if (normalized === 'whatsapp') return 'whatsapp';
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
    if (authLoading) return;
    if (!isAuthenticated || !isOwner) {
      navigate('/', { replace: true });
    } else {
      loadProducts();
      loadCategories();
      loadOrders();
      loadCustomers();
      loadReviews();
      loadAnalytics();
      loadNotifications();
      loadPaymentOptions();
      if (user) setProfileForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [authLoading, isAuthenticated, isOwner, navigate]);

  useEffect(() => {
    localStorage.setItem('ownerDashboardActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('ownerDashboardTimeRange', timeRange);
  }, [timeRange]);

  useEffect(() => {
    localStorage.setItem('ownerDashboardStatusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('ownerDashboardSourceFilter', sourceFilter);
  }, [sourceFilter]);

  useEffect(() => {
    setProductsPage(1);
    setCategoriesPage(1);
    setOrdersPage(1);
  }, [activeView, statusFilter, sourceFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Showing {label} page {currentPage} of {totalPages} ({totalItems} total)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className={`px-3 py-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{currentPage}/{totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isOwner]);

  // Load customers count and list (requires admin/owner token)
  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.users)) {
        const customerUsers = data.users.filter(u => u.role === 'customer');
        setCustomersCount(customerUsers.length);
        setCustomers(customerUsers);
      } else if (Array.isArray(data)) {
        const customerUsers = data.filter(u => u.role === 'customer');
        setCustomersCount(customerUsers.length);
        setCustomers(customerUsers);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const uniqueCustomers = new Set(localOrders.map(o => o.customer_email || o.customerEmail));
      setCustomersCount(uniqueCustomers.size || 0);
      setCustomers([]);
    }
  };

  // Compute revenue from orders (reliable source) and fallback values
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + Number(o.profit || 0), 0);
  const totalSales = orders.reduce((sum, o) => sum + (Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.quantity || i.qty || 0), 0) : 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customersCount || new Set(orders.map(o => o.customerEmail || o.customer_email)).size;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;

  const handleLogout = () => {
    localStorage.removeItem('ownerDashboardActiveView');
    localStorage.removeItem('ownerDashboardTimeRange');
    logout();
    navigate('/', { replace: true });
  };

  const topProducts = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const getCategoryLabel = (product) => {
    if (product?.category) return product.category;
    const match = categories.find((c) => Number(c.id) === Number(product?.category_id));
    return match?.name || 'Uncategorized';
  };

  const computedAnalytics = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const now = new Date();

    const productAgg = new Map();
    const customerAgg = new Map();

    const addProductRow = (name, units, revenue) => {
      const key = name || 'Unknown Product';
      const prev = productAgg.get(key) || { name: key, units: 0, revenue: 0 };
      productAgg.set(key, {
        ...prev,
        units: prev.units + units,
        revenue: prev.revenue + revenue
      });
    };

    const addCustomerRow = (order) => {
      const key = order.customer_email || order.email || `customer-${order.customer_id || order.id}`;
      const label = order.customer_name || order.full_name || order.customer_email || 'Customer';
      const total = toNumber(order.total_amount || order.total);
      const prev = customerAgg.get(key) || { name: label, email: key, orders: 0, spent: 0 };
      customerAgg.set(key, {
        ...prev,
        orders: prev.orders + 1,
        spent: prev.spent + total
      });
    };

    safeOrders.forEach((order) => {
      addCustomerRow(order);
      const orderTotal = toNumber(order.total_amount || order.total);
      const items = Array.isArray(order.items) ? order.items : [];

      if (items.length === 0) {
        addProductRow('Unmapped Product', 1, orderTotal);
        return;
      }

      const totalQty = items.reduce((sum, item) => sum + Math.max(1, toNumber(item.quantity || item.qty || 1)), 0);
      items.forEach((item) => {
        const qty = Math.max(1, toNumber(item.quantity || item.qty || 1));
        const fallbackRevenue = totalQty > 0 ? (orderTotal * qty) / totalQty : 0;
        const lineRevenue = toNumber(item.subtotal || item.total || (toNumber(item.price) * qty) || fallbackRevenue);
        addProductRow(item.product_name || item.name || `Product #${item.product_id || 'N/A'}`, qty, lineRevenue || fallbackRevenue);
      });
    });

    const bucketConfig = {
      daily: { count: 14, key: (d) => d.toISOString().slice(0, 10), label: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), step: (d, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - (13 - i)) },
      weekly: { count: 12, key: (d) => {
        const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
        return `${tmp.getUTCFullYear()}-W${weekNo}`;
      }, label: (d) => `Wk ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, step: (d, i) => {
        const result = new Date(d);
        result.setDate(d.getDate() - ((11 - i) * 7));
        return result;
      } },
      monthly: { count: 12, key: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), step: (d, i) => new Date(d.getFullYear(), d.getMonth() - (11 - i), 1) },
      yearly: { count: 5, key: (d) => `${d.getFullYear()}`, label: (d) => `${d.getFullYear()}`, step: (d, i) => new Date(d.getFullYear() - (4 - i), 0, 1) }
    };

    const range = bucketConfig[timeRange] ? timeRange : 'monthly';
    const { count, key, label, step } = bucketConfig[range];
    const buckets = [];

    for (let i = 0; i < count; i += 1) {
      const datePoint = step(now, i);
      buckets.push({
        key: key(datePoint),
        label: label(datePoint),
        revenue: 0,
        orders: 0,
        units: 0
      });
    }

    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    safeOrders.forEach((order) => {
      const orderDate = normalizeDate(order.created_at || order.date);
      const bucket = bucketMap.get(key(orderDate));
      if (!bucket) return;
      const total = toNumber(order.total_amount || order.total);
      const units = (Array.isArray(order.items) ? order.items : []).reduce((sum, item) => sum + Math.max(1, toNumber(item.quantity || item.qty || 1)), 0);
      bucket.revenue += total;
      bucket.orders += 1;
      bucket.units += units;
    });

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const summarizePeriod = (periodStart) => {
      let revenue = 0;
      let countOrders = 0;
      safeOrders.forEach((order) => {
        const orderDate = normalizeDate(order.created_at || order.date);
        if (orderDate >= periodStart) {
          revenue += toNumber(order.total_amount || order.total);
          countOrders += 1;
        }
      });
      return { revenue, orders: countOrders };
    };

    const topProductsBySales = Array.from(productAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const topCustomers = Array.from(customerAgg.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 6);

    const productCatalog = safeProducts.map((product) => {
      const current = productAgg.get(product.name) || { units: 0, revenue: 0 };
      return {
        id: product.id,
        name: product.name,
        category: getCategoryLabel(product),
        stock: toNumber(product.stock),
        unitsSold: current.units,
        revenue: current.revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      series: buckets,
      kpis: {
        daily: summarizePeriod(startOfDay),
        weekly: summarizePeriod(startOfWeek),
        monthly: summarizePeriod(startOfMonth),
        yearly: summarizePeriod(startOfYear)
      },
      topProducts: topProductsBySales,
      topCustomers,
      productCatalog,
      totalRevenue: safeOrders.reduce((sum, order) => sum + toNumber(order.total_amount || order.total), 0),
      totalOrders: safeOrders.length
    };
  }, [orders, products, categories, timeRange]);

  const businessStatusItems = useMemo(() => ([
    { label: 'Total Revenue', value: `${computedAnalytics.totalRevenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Total Orders', value: `${computedAnalytics.totalOrders}`, tone: 'indigo' },
    { label: 'Registered Customers', value: `${totalCustomers}`, tone: 'amber' },
    { label: 'Products In Catalog', value: `${products.length}`, tone: 'purple' },
    { label: 'Daily Revenue', value: `${computedAnalytics.kpis.daily.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Daily Orders', value: `${computedAnalytics.kpis.daily.orders}`, tone: 'indigo' },
    { label: 'Weekly Revenue', value: `${computedAnalytics.kpis.weekly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Weekly Orders', value: `${computedAnalytics.kpis.weekly.orders}`, tone: 'indigo' },
    { label: 'Monthly Revenue', value: `${computedAnalytics.kpis.monthly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Monthly Orders', value: `${computedAnalytics.kpis.monthly.orders}`, tone: 'indigo' },
    { label: 'Yearly Revenue', value: `${computedAnalytics.kpis.yearly.revenue.toLocaleString()} RWF`, tone: 'emerald' },
    { label: 'Yearly Orders', value: `${computedAnalytics.kpis.yearly.orders}`, tone: 'indigo' }
  ]), [computedAnalytics, totalCustomers, products.length]);

  const getTotalPages = (items) => Math.max(1, Math.ceil((items?.length || 0) / ANALYTICS_PAGE_SIZE));
  const paginateItems = (items, page) => {
    const start = (page - 1) * ANALYTICS_PAGE_SIZE;
    return (items || []).slice(start, start + ANALYTICS_PAGE_SIZE);
  };

  const renderPagination = (page, setPage, totalPages) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-xs font-semibold text-gray-500">Page {page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  useEffect(() => {
    setTopCustomersPage(1);
    setTopProductsPage(1);
    setBusinessStatusPage(1);
    setProductsReportPage(1);
  }, [timeRange, activeView]);

  // ─── Reports ──────────────────────────────────────────────────────────────
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
        const orderTotal = toNumber(order.total_amount || order.total);
        if (items.length === 0) {
          const key = 'Uncategorized Order';
          const prev = productMap.get(key) || { name: key, units: 0, revenue: 0 };
          productMap.set(key, { ...prev, units: prev.units + 1, revenue: prev.revenue + orderTotal });
          return;
        }

        const totalQty = items.reduce((s, i) => s + Math.max(1, toNumber(i.quantity || i.qty || 1)), 0);
        items.forEach(item => {
          const qty = Math.max(1, toNumber(item.quantity || item.qty || 1));
          const fallbackRev = totalQty > 0 ? (orderTotal * qty) / totalQty : 0;
          const lineRev = toNumber(item.subtotal || item.total || (toNumber(item.price) * qty) || fallbackRev);
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
    if (reportType === 'daily') return new Date(reportDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const end = new Date(reportData.endDate.getTime() - 1);
    return `${reportData.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [reportData, reportDate, reportType]);

  const downloadOwnerReportCSV = () => {
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
    a.download = `AVATA-owner-${reportType}-report-${reportDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    const generateOwnerPDF = () => {
      const exportData = reportData || buildReportData();
      if (!exportData) return;
      // eslint-disable-next-line new-cap
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      // Header bar
      doc.setFillColor(124, 58, 237);
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
      const ownerStats = [
        { label: 'Total Revenue', value: `${exportData.totalRevenue.toLocaleString()} RWF` },
        { label: 'Paid Revenue', value: `${exportData.totalPaidRevenue.toLocaleString()} RWF` },
        { label: 'Total Orders', value: String(exportData.totalOrders) },
        { label: 'Paid Orders', value: String(exportData.totalPaidOrders) },
      ];
      const ownerBoxW = (pageW - 40) / 4;
      ownerStats.forEach((s, i) => {
        const bx = 15 + i * (ownerBoxW + 5);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(bx, 58, ownerBoxW, 22, 3, 3, 'F');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237);
        doc.text(s.value, bx + ownerBoxW / 2, 68, { align: 'center' });
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
        doc.text(s.label.toUpperCase(), bx + ownerBoxW / 2, 74, { align: 'center' });
      });
      // Product breakdown table
      doc.setTextColor(30, 30, 30); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Product Sales Breakdown', 15, 92);
      const ownerProdBody = exportData.rows.map((r, i) => [
        i + 1, r.name, r.units, r.revenue.toLocaleString(),
        exportData.totalRevenue > 0 ? `${(r.revenue / exportData.totalRevenue * 100).toFixed(1)}%` : '0%',
      ]);
      ownerProdBody.push(['', 'TOTAL', exportData.totalUnits, exportData.totalRevenue.toLocaleString(), '100%']);
      autoTable(doc, {
        head: [['#', 'Product Name', 'Units Sold', 'Revenue (RWF)', '% Share']],
        body: ownerProdBody,
        startY: 96,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === ownerProdBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [233, 213, 255];
            data.cell.styles.textColor = [88, 28, 135];
          }
        },
      });
      // Paid products table
      const oyPaid = (doc.lastAutoTable?.finalY || 96) + 12;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text('Paid Products', 15, oyPaid);
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
        startY: oyPaid + 4,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [236, 253, 245] }
      });

      // Order details table
      const oy2 = (doc.lastAutoTable?.finalY || 96) + 12;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text('Order Details', 15, oy2);
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
        startY: oy2 + 4,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
      });
      // Footer
      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(170, 170, 170);
        doc.text(`AVATA Trading — Confidential | Page ${p} of ${pages}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }
      doc.save(`AVATA-owner-${reportType}-report-${reportDate}.pdf`);
      setShowPdfPreview(false);
    };

    const OwnerPdfPreviewModal = () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowPdfPreview(false)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
          {/* Toolbar */}
          <div className="sticky top-0 bg-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
            <div>
              <h3 className="font-black text-lg">PDF Preview</h3>
              <p className="text-purple-200 text-xs">{reportType === 'daily' ? 'Daily' : 'Weekly'} Report — {reportDateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={generateOwnerPDF} className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 font-black rounded-xl hover:bg-purple-50 text-sm transition-all shadow-md">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={() => setShowPdfPreview(false)} className="p-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Paper preview */}
          <div className="p-5 bg-gray-100">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Report header */}
              <div className="bg-purple-600 px-6 py-5 text-white">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1">AVATA Trading</p>
                <h2 className="text-2xl font-black tracking-tight">{reportType === 'daily' ? 'Daily' : 'Weekly'} Sales Report</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-purple-200">
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
                      { label: 'Total Orders',  value: reportData.totalOrders, color: 'text-purple-600' },
                      { label: 'Units Sold',    value: reportData.totalUnits,  color: 'text-blue-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
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
                          <tr className="bg-purple-600 text-white">
                            <th className="p-2.5 text-left font-bold">#</th>
                            <th className="p-2.5 text-left font-bold">Product Name</th>
                            <th className="p-2.5 text-right font-bold">Units</th>
                            <th className="p-2.5 text-right font-bold">Revenue (RWF)</th>
                            <th className="p-2.5 text-right font-bold">% Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                              <td className="p-2.5 text-gray-400">{i + 1}</td>
                              <td className="p-2.5 font-semibold text-gray-800">{row.name}</td>
                              <td className="p-2.5 text-right">{row.units}</td>
                              <td className="p-2.5 text-right font-bold text-green-700">{row.revenue.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-gray-600">{reportData.totalRevenue > 0 ? (row.revenue / reportData.totalRevenue * 100).toFixed(1) : 0}%</td>
                            </tr>
                          ))}
                          <tr className="bg-purple-100 font-black text-purple-900">
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
                          <tr className="bg-purple-600 text-white">
                            <th className="p-2.5 text-left font-bold">Order ID</th>
                            <th className="p-2.5 text-left font-bold">Customer</th>
                            <th className="p-2.5 text-left font-bold">Date</th>
                            <th className="p-2.5 text-left font-bold">Status</th>
                            <th className="p-2.5 text-right font-bold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.orders.slice(0, 20).map((order, i) => (
                            <tr key={order.id} className={i % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                              <td className="p-2.5 text-purple-600 font-bold">#{order.id}</td>
                              <td className="p-2.5 text-gray-700">{order.customer_name || order.full_name || order.customer_email || '—'}</td>
                              <td className="p-2.5 text-gray-500">{normalizeDate(order.created_at || order.date).toLocaleDateString()}</td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded-full font-bold ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{order.status}</span>
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

  // ─────────────────────────────────────────────────────────────────────────

  // Load products from backend or localStorage
  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      // backend returns either an array of products or an object { success: true, ... }
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && data.success && data.products) {
        setProducts(data.products);
      } else if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to localStorage
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      setProducts(localProducts);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      if (response.ok) {
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products/reviews/all', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  // Handle multiple image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Create preview URLs for the images
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setProductImages([...productImages, ...newImages]);
    }
  };

  // Remove image from the list
  const removeImage = (index) => {
    const newImages = [...productImages];
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  // Create new product
  const createProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('category_id', newProduct.category_id);
      formData.append('price', newProduct.price);
      formData.append('stock', newProduct.stock);
      formData.append('description', newProduct.description);
      formData.append('owner_id', user?.id || '');
      if (newProduct.image) {
        formData.append('image', newProduct.image); // optional single image URL
      }
      // Append all selected image files
      productImages.forEach(imgObj => {
        if (imgObj.file) {
          formData.append('images', imgObj.file);
        }
      });

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        alert('Product created successfully!');
        loadProducts();
        setShowProductModal(false);
        setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
        setProductImages([]);
      } else {
        alert(data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      // Fallback to localStorage
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const selectedCategory = categories.find((c) => Number(c.id) === Number(newProduct.category_id));
      const productWithId = {
        ...newProduct,
        category: selectedCategory?.name || 'Uncategorized',
        images: productImages.map(img => img.preview).join(','),
        id: Date.now(),
        sales: 0,
        revenue: 0,
        profit: 0,
        created_at: new Date().toISOString()
      };
      localProducts.push(productWithId);
      localStorage.setItem('products', JSON.stringify(localProducts));
      setProducts(localProducts);
      alert('Product created successfully (stored locally)!');
      setShowProductModal(false);
      setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
      setProductImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProduct = async (id, updates) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          if (key === 'category' || key === 'category_name') return;
          formData.append(key, updates[key]);
        }
      });
      // Append new image files
      productImages.forEach(imgObj => {
        if (imgObj.file) formData.append('images', imgObj.file);
      });
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        alert('Product updated successfully!');
        loadProducts();
        setShowProductModal(false);
        setEditingProduct(null);
        setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
        setProductImages([]);
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      // Fallback to localStorage
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = localProducts.map(p =>
        p.id === id ? { ...p, ...updates } : p
      );
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      alert('Product updated successfully (stored locally)!');
      setShowProductModal(false);
      setEditingProduct(null);
      setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
      setProductImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove an image from a product
  const handleRemoveExistingImage = async (productId, imageUrl) => {
    if (!confirm('Remove this image from product?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/products/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageUrl })
      });
      const data = await res.json();
      if (res.ok) { alert('Image removed'); loadProducts(); }
      else { alert(data.message || 'Failed to remove image'); }
    } catch (e) { console.error(e); alert('Error removing image'); }
  };

  // Set main image for a product
  const handleSetMainImage = async (productId, imageUrl) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/products/${productId}/image-main`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageUrl })
      });
      const data = await res.json();
      if (res.ok) { alert('Main image updated'); loadProducts(); }
      else { alert(data.message || 'Failed to update main image'); }
    } catch (e) { console.error(e); alert('Error updating main image'); }
  };

  // Delete product
  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        alert('Product deleted successfully!');
        loadProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      // Fallback to localStorage
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const filteredProducts = localProducts.filter(p => p.id !== id);
      localStorage.setItem('products', JSON.stringify(filteredProducts));
      setProducts(filteredProducts);
      alert('Product deleted successfully!');
    }
  };

  // Load all orders
  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.orders)) {
        const normalizedOrders = data.orders.map((order) => ({
          ...order,
          order_source: normalizeOrderSourceValue(order.order_source, order.status, order.customer_email || order.email)
        }));
        setOrders(normalizedOrders);
        localStorage.setItem('ownerDashboardOrdersCache', JSON.stringify(normalizedOrders));
      } else if (Array.isArray(data)) {
        const normalizedOrders = data.map((order) => ({
          ...order,
          order_source: normalizeOrderSourceValue(order.order_source, order.status, order.customer_email || order.email)
        }));
        setOrders(normalizedOrders);
        localStorage.setItem('ownerDashboardOrdersCache', JSON.stringify(normalizedOrders));
      } else {
        const cachedOrders = JSON.parse(localStorage.getItem('ownerDashboardOrdersCache') || '[]');
        setOrders(Array.isArray(cachedOrders) ? cachedOrders : []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('ownerDashboardOrdersCache') || localStorage.getItem('orders') || '[]');
      setOrders(Array.isArray(localOrders) ? localOrders : []);
    }
  };

  // Load analytics
  const loadAnalytics = async (range = timeRange) => {
    setAnalyticsLoading(true);
    try {
      const backendRangeMap = {
        daily: 'weekly',
        weekly: 'weekly',
        monthly: 'monthly',
        yearly: 'yearly'
      };
      const backendRange = backendRangeMap[range] || 'monthly';
      const token = localStorage.getItem('token');
      const r = await fetch(`http://localhost:5000/api/orders/analytics?range=${backendRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setAnalytics(d);
    } catch (e) { console.error('Analytics load error:', e); }
    finally { setAnalyticsLoading(false); }
  };

  useEffect(() => {
    if (activeView === 'analytics' || activeView === 'dashboard') {
      loadAnalytics(timeRange);
    }
  }, [timeRange]);

  // Order comments helpers
  const loadOrderComments = async (orderId) => {
    if (orderComments[orderId]) return;
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`http://localhost:5000/api/orders/${orderId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setOrderComments(prev => ({ ...prev, [orderId]: d.comments || [] }));
    } catch { }
  };

  const sendOrderComment = async (orderId) => {
    const text = (newComment[orderId] || '').trim();
    if (!text) return;
    setSendingComment(orderId);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`http://localhost:5000/api/orders/${orderId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: text })
      });
      const d = await r.json();
      if (d.success) {
        setOrderComments(prev => ({ ...prev, [orderId]: d.comments || [] }));
        setNewComment(prev => ({ ...prev, [orderId]: '' }));
      }
    } finally { setSendingComment(null); }
  };

  // Profile save
  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    if (profilePw.new_password && profilePw.new_password !== profilePw.confirm_password) {
      setProfileMsg('New passwords do not match'); return;
    }
    setProfileSaving(true); setProfileMsg('');
    try {
      const token = localStorage.getItem('token');
      const body = { ...profileForm };
      if (profilePw.new_password) {
        body.current_password = profilePw.current_password;
        body.new_password = profilePw.new_password;
      }
      const r = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if (d.success) {
        setProfileMsg('Profile updated!');
        setProfileEditing(false);
        setProfilePw({ current_password: '', new_password: '', confirm_password: '' });
      } else { setProfileMsg(d.message || 'Failed to update'); }
    } finally { setProfileSaving(false); }
  };

  const handleUpdateProfile = saveProfile;

  // Approve payment
  const approvePayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_receipt: receiptUrl })
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Approve action completed.');
        loadOrders();
        setShowVerifyModal(false);
        setVerifyingOrder(null);
        setReceiptUrl('');
      } else {
        alert(data.message || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Error approving payment');
    }
  };

  // Reject payment
  const rejectPayment = async (orderId) => {
    if (!confirm('Are you sure you want to reject this payment proof?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/reject-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('Payment rejected');
        loadOrders();
      } else {
        alert(data.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Error rejecting payment');
    }
  };

  // Deliver action: Processing -> Shipped -> Delivered
  const deliverOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/deliver`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Deliver action completed.');
        loadOrders();
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error delivering order:', error);
      alert('Error delivering order');
    }
  };

  // Deprecated: old verifyPayment method
  const verifyPayment = approvePayment;

  // Resend Order (for Not_Delivered status)
  const resendOrder = async (orderId) => {
    if (!confirm('Are you sure you want to resend this order?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/resend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('Order marked for re-shipment!');
        loadOrders();
      } else {
        alert(data.message || 'Failed to resend order');
      }
    } catch (error) {
      console.error('Error resending order:', error);
      alert('Error resending order');
    }
  };

  // Cancel Order
  const cancelOrder = async (orderId) => {
    if (!confirm('Cancel this order? If already paid, the system will mark it for refund processing.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Order cancelled.');
        loadOrders();
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order');
    }
  };

  // Delete Order (permanent deletion)
  const deleteOrder = async (orderId) => {
    if (!confirm('⚠️ PERMANENT DELETE: This will permanently delete this order from the database. This action CANNOT be undone. Are you absolutely sure?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('Order permanently deleted.');
        loadOrders();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();

      if (data.success) {
        alert(`Order ${status} successfully!`);
        loadOrders();
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = localOrders.map(o =>
        o.id === orderId || o.orderId === orderId ? { ...o, status } : o
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      alert(`Order ${status} successfully!`);
    }
  };

  // Handle update order status (wrapper for different status updates)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Order status updated successfully!');
        loadOrders();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  // Send order via WhatsApp
  const sendViaWhatsApp = (order) => {
    const phone = order.customer_phone || order.customerPhone;
    if (!phone) {
      alert('No phone number available for this order');
      return;
    }

    const message = encodeURIComponent(
      `Hello ${order.customer_name || order.customerName || 'Customer'}!\\n\\n` +
      `Your order #${order.id || order.orderId} has been confirmed!\\n` +
      `Total: ${order.total_amount || order.total} RWF\\n` +
      `Payment Number: ${order.payment_number || 'N/A'}\\n\\n` +
      `Thank you for your order from AVATA Trading!`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    updateOrderStatus(order.id || order.orderId, 'sent');
  };

  // Mark as submitted (no WhatsApp)
  const markAsSubmitted = (orderId) => {
    if (confirm('Mark this order as submitted?')) {
      updateOrderStatus(orderId, 'submitted');
    }
  };

  // Load customers when switching to customers view
  useEffect(() => {
    if (activeView === 'customers') {
      loadCustomers();
    }
  }, [activeView]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        setNotifications(d.notifications || []);
        setUnreadCount(d.notifications?.filter(n => !n.is_read).length || 0);
      }
    } catch (e) {
      // Local fallback
      setNotifications([]);
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
        alert('Payment options updated successfully.');
        await loadPaymentOptions();
      } else {
        alert(data?.message || 'Failed to update payment options.');
      }
    } catch (error) {
      console.error('Error saving payment options:', error);
      alert('Network error. Could not update payment options.');
    } finally {
      setPaymentOptionsSaving(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (e) { }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (e) { }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/backup/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Backup downloaded successfully!');
      } else {
        alert('Backup failed: ' + data.message);
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('System error during backup');
    }
  };

  const filteredOrders = orders.filter(order => matchesStatusFilter(order, statusFilter));
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const productsTotalPages = Math.max(1, Math.ceil(safeProducts.length / MANAGEMENT_PAGE_SIZE));
  const currentProductsPage = Math.min(productsPage, productsTotalPages);
  const paginatedProducts = safeProducts.slice((currentProductsPage - 1) * MANAGEMENT_PAGE_SIZE, currentProductsPage * MANAGEMENT_PAGE_SIZE);

  const categoriesTotalPages = Math.max(1, Math.ceil(safeCategories.length / MANAGEMENT_PAGE_SIZE));
  const currentCategoriesPage = Math.min(categoriesPage, categoriesTotalPages);
  const paginatedCategories = safeCategories.slice((currentCategoriesPage - 1) * MANAGEMENT_PAGE_SIZE, currentCategoriesPage * MANAGEMENT_PAGE_SIZE);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-b from-purple-600 to-purple-800'} text-white shadow-xl z-[70] transition-transform duration-300 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <img src="/logo-avata.jpeg" alt="AVATA Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
              <h1 className="text-xl font-bold">Avata Trading</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-3">Menu</h3>
            <button
              onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'dashboard' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wider mt-6 mb-3">Business</h3>
            <button
              onClick={() => { setActiveView('analytics'); setTimeRange('monthly'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition group ${activeView === 'analytics' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition" />
                <span>Revenue</span>
              </div>
              <span className="text-sm font-semibold opacity-80">{(totalRevenue / 1000).toFixed(0)}k</span>
            </button>
            <button
              onClick={() => { setActiveView('products'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'products' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <Package className="w-5 h-5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => { setActiveView('categories'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'categories' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <FolderTree className="w-5 h-5" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => { setActiveView('reviews'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'reviews' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Reviews</span>
            </button>
            <button
              onClick={() => { setActiveView('customers'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'customers' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5" />
                <span>Customers</span>
              </div>
              <span className="text-sm font-semibold opacity-80">{totalCustomers}</span>
            </button>
            <button
              onClick={() => { setActiveView('orders'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'orders' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5" />
                <span>Orders</span>
              </div>
              <span className="text-sm font-semibold opacity-80">{totalOrders}</span>
            </button>

            <button
              onClick={() => { setActiveView('profile'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'profile' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <User className="w-5 h-5" />
              <span>Full Profile</span>
            </button>

            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wider mt-6 mb-3">Analytics</h3>
            <button
              onClick={() => { setActiveView('analytics'); loadAnalytics(); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'analytics' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <PieChart className="w-5 h-5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => { setActiveView('reports'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'reports' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Reports</span>
            </button>
            <button
              onClick={() => { setActiveView('special-offer'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'special-offer' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <Percent className="w-5 h-5" />
              <span>Special Offers</span>
            </button>
            <button
              onClick={() => { setActiveView('settings'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeView === 'settings' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-purple-500/30">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold shadow-md">
                  {user?.full_name?.charAt(0) || 'O'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">Owner</p>
                  <p className="text-[10px] text-orange-100/70 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="text-white hover:text-orange-200 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen transition-all min-w-0">
        {/* Top Bar */}
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-90`}>
          <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu className="w-6 h-6 text-purple-600" />
              </button>
              <div className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex-1 min-w-0 max-w-[14rem] sm:max-w-md shadow-inner`}>
                <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search everything..."
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
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className={`relative p-2.5 rounded-xl transition-all ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${showNotificationDropdown ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotificationDropdown(false)} />
                    <div className={`absolute right-0 mt-3 w-[min(20rem,calc(100vw-1.5rem))] max-h-[480px] overflow-hidden rounded-2xl shadow-2xl border z-20 animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
                        <h4 className="font-black text-xs uppercase tracking-widest text-purple-600">Notifications</h4>
                        <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
                      </div>
                      <div className="overflow-y-auto max-h-[380px] custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b border-gray-50 dark:border-gray-700/50 flex gap-3 group transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!n.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.type === 'order' ? 'bg-green-100 text-green-600' :
                                n.type === 'alert' ? 'bg-red-100 text-red-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                {n.type === 'order' ? <ShoppingCart className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className={`text-sm font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter pt-1">{new Date(n.created_at).toLocaleString()}</p>
                                <div className="flex items-center gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!n.is_read && (
                                    <button
                                      onClick={() => markNotificationRead(n.id)}
                                      className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700"
                                    >
                                      Mark Read
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(n.id)}
                                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600"
                                  >
                                    Delete
                                  </button>
                                  {n.link && (
                                    <button
                                      onClick={() => {
                                        if (n.link === '/orders') setActiveView('orders');
                                        setShowNotificationDropdown(false);
                                      }}
                                      className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-auto"
                                    >
                                      View Details
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center">
                            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No Notifications</p>
                          </div>
                        )}
                      </div>
                      <button className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-purple-600 border-t border-gray-100 dark:border-gray-700 transition-colors">
                        View All Activity
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden sm:block h-8 w-px bg-gray-200 mx-2"></div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95 whitespace-nowrap"
              >
                Log Out
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-3 sm:p-4 lg:p-8">
          {activeView === 'dashboard' && (
            <>
              <div className="mb-6">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Business Overview
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track your business performance and insights
                </p>
              </div>

              {/* Top Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 text-left w-full transition-transform hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+24%</span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Revenue</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Number(totalRevenue || 0).toLocaleString()} RWF
                  </p>
                  <p className="text-xs text-gray-500 mt-2">vs last month</p>
                </button>

                <button
                  onClick={() => setActiveView('analytics')}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 text-left w-full transition-transform hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+18%</span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Net Profit</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Number(totalProfit || 0).toLocaleString()} RWF
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Margin: {profitMargin}%</p>
                </button>

                <button
                  onClick={() => setActiveView('orders')}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 text-left w-full transition-transform hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+32%</span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Units Sold</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {(totalSales || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{totalOrders} orders</p>
                </button>

                <button
                  onClick={() => setActiveView('customers')}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 text-left w-full transition-transform hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+12%</span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Customers</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalCustomers}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Retention: 78%</p>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Revenue Overview
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly revenue trend</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTimeRange('weekly')}
                        className={`px-3 py-1 text-sm rounded-lg ${timeRange === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setTimeRange('monthly')}
                        className={`px-3 py-1 text-sm rounded-lg ${timeRange === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => setTimeRange('yearly')}
                        className={`px-3 py-1 text-sm rounded-lg ${timeRange === 'yearly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        Year
                      </button>
                    </div>
                  </div>

                  <div className="relative h-72">
                    <div className="absolute inset-0">
                      {/* Dual Bar Chart */}
                      <div className="flex items-end justify-between h-full space-x-3">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, new Date().getMonth() + 1).map((month, idx) => {
                          const revenueHeight = 30 + Math.random() * 60;
                          const profitHeight = revenueHeight * 0.7;
                          return (
                            <div key={month} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div className="w-full flex gap-1 items-end">
                                <div
                                  className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t hover:from-purple-600 hover:to-purple-400 transition cursor-pointer"
                                  style={{ height: `${revenueHeight}%` }}
                                  title={`Revenue: ${(revenueHeight * 100).toFixed(0)}k`}
                                />
                                <div
                                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition cursor-pointer"
                                  style={{ height: `${profitHeight}%` }}
                                  title={`Profit: ${(profitHeight * 100).toFixed(0)}k`}
                                />
                              </div>
                              <span className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Profit</span>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                  <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Category Performance
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Masks', value: 35, color: 'bg-purple-500' },
                      { name: 'Gloves', value: 25, color: 'bg-blue-500' },
                      { name: 'Respirators', value: 20, color: 'bg-green-500' },
                      { name: 'Eye Protection', value: 12, color: 'bg-orange-500' },
                      { name: 'Others', value: 8, color: 'bg-gray-400' },
                    ].map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {category.name}
                          </span>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {category.value}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${category.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${category.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quick Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg. Order Value</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {totalOrders > 0 ? (totalRevenue / totalOrders / 1000).toFixed(0) : 0}k RWF
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Conversion Rate</span>
                        <span className="font-semibold text-green-500">4.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Return Rate</span>
                        <span className="font-semibold text-red-500">1.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Products Table */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Top Performing Products
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Best sellers by revenue
                    </p>
                  </div>
                  <button className="self-start sm:self-auto flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm whitespace-nowrap">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px]">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-600'} text-white`}>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Product Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Units Sold</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Revenue</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Profit</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Margin</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {topProducts.map((product, index) => {
                        const margin = ((product.profit || 0) / (product.revenue || 1) * 100).toFixed(1);
                        return (
                          <tr key={product.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition`}>
                            <td className="px-6 py-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-600' :
                                    'bg-gray-300 text-gray-700'
                                }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.name}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {getCategoryLabel(product)}
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {(product.sales || 0).toLocaleString()}
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold text-green-600`}>
                              {((product.revenue || 0) / 1000).toFixed(0)}k RWF
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold text-blue-600`}>
                              {((product.profit || 0) / 1000).toFixed(0)}k RWF
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{ width: `${margin}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {margin}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Customer Reviews */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Recent Customer Reviews
                  </h2>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    {recentReviews.length} total
                  </span>
                </div>

                {recentReviews.length === 0 ? (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentReviews.slice(0, 8).map((review) => (
                      <div key={review.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} border rounded-lg p-3`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{review.userName} • {review.productName}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{review.userEmail || 'No email provided'}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(review.date).toLocaleString()}</p>
                          </div>
                          <div className="text-sm font-bold text-amber-500">{'★'.repeat(Math.max(0, Number(review.rating || 0)))}{'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}</div>
                        </div>
                        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Customers Management View */}
          {activeView === 'reviews' && (
            <CustomerReviewsView reviews={recentReviews} darkMode={darkMode} onRefresh={loadReviews} />
          )}

          {/* Customers Management View */}
          {activeView === 'customers' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Customer Management
                  </h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View and manage your customers
                  </p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-600'} text-white`}>
                        <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {customers.length > 0 ? (
                        customers.map((customer) => (
                          <tr key={customer.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition`}>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              #{customer.id}
                            </td>
                            <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {customer.full_name || customer.name || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {customer.email || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {customer.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${customer.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                                customer.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {customer.role || 'customer'}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No customers found. Customers will appear here when they register.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Management View */}
          {activeView === 'products' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Product Management
                  </h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and manage your products
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProductModal(true);
                    setProductImages([]);
                    setEditingProduct(null);
                    setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
                  }}
                  className="self-start sm:self-auto flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition text-xs sm:text-sm"
                >
                  <Upload className="w-5 h-5" />
                  <span>Add New Product</span>
                </button>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-600'} text-white`}>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {paginatedProducts.length > 0 ? (
                        paginatedProducts.map((product) => (
                          <tr key={product.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition`}>
                            <td className="px-6 py-4">
                              {(() => {
                                // Prefer first image from images array, fallback to image
                                let imgSrc = '';
                                if (product.images) {
                                  const arr = Array.isArray(product.images) ? product.images : String(product.images).split(',');
                                  imgSrc = arr[0]?.trim();
                                }
                                if (!imgSrc && product.image) imgSrc = product.image;
                                return imgSrc ? (
                                  <img src={getFullImageUrl(imgSrc) || imgSrc} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                  </div>
                                );
                              })()}
                            </td>
                            <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.name}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {getCategoryLabel(product)}
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.price ? `${Number(product.price).toLocaleString()} RWF` : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${product.stock > 50 ? 'bg-green-100 text-green-700' :
                                product.stock > 10 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {product.stock || 0} units
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setNewProduct({
                                      name: product.name,
                                      category_id: product.category_id || '',
                                      price: product.price || '',
                                      description: product.description || '',
                                      stock: product.stock || '',
                                      image: product.image || ''
                                    });
                                    setProductImages([]);
                                    setShowProductModal(true);
                                  }}
                                  className="p-2 hover:bg-blue-100 rounded-lg transition"
                                  title="Edit Product"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
                                  className="p-2 hover:bg-red-100 rounded-lg transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No products found. Add your first product to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls({
                  currentPage: currentProductsPage,
                  totalPages: productsTotalPages,
                  onPageChange: setProductsPage,
                  totalItems: safeProducts.length,
                  label: 'products'
                })}
              </div>
            </div>
          )}

          {/* Categories Management View */}
          {activeView === 'categories' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Category Management
                  </h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Browse category structure and product allocations
                  </p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-600'} text-white`}>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Parent</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Products</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {paginatedCategories.length > 0 ? (
                        paginatedCategories.map((category) => {
                          const parent = safeCategories.find((c) => Number(c.id) === Number(category.parent_id));
                          const productsInCategory = safeProducts.filter((p) => Number(p.category_id) === Number(category.id)).length;
                          return (
                            <tr key={category.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition`}>
                              <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {category.name}
                              </td>
                              <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {category.description || 'No description'}
                              </td>
                              <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {parent?.name || 'Root'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                  {productsInCategory}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            No categories found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls({
                  currentPage: currentCategoriesPage,
                  totalPages: categoriesTotalPages,
                  onPageChange: setCategoriesPage,
                  totalItems: safeCategories.length,
                  label: 'categories'
                })}
              </div>
            </div>
          )}

          {/* Orders Management View */}
          {activeView === 'orders' && (() => {
            const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
              const src = normalizeOrderSourceValue(order.order_source, order.status, order.customer_email || order.email);
              const matchesSource =
                sourceFilter === 'All' ||
                (sourceFilter === 'WhatsApp' && src === 'whatsapp') ||
                (sourceFilter === 'Email' && src === 'email') ||
                (sourceFilter === 'DirectNoEmail' && src === 'direct_no_email') ||
                (sourceFilter === 'NoWhatsApp' && src !== 'whatsapp');

              return matchesSource && matchesStatusFilter(order, statusFilter);
            });
            const totalPages = Math.max(1, Math.ceil(filteredOrders.length / MANAGEMENT_PAGE_SIZE));
            const currentPage = Math.min(ordersPage, totalPages);
            const paginatedOrders = filteredOrders.slice((currentPage - 1) * MANAGEMENT_PAGE_SIZE, currentPage * MANAGEMENT_PAGE_SIZE);

            return (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                      <ShoppingBag className="text-purple-600 w-8 h-8" />
                      Order Management
                    </h2>
                    <p className="text-gray-500 font-medium">Verify payments and track fulfillment lifecycle</p>
                  </div>
                  <div className="w-full md:w-auto flex items-center gap-2 flex-wrap">
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status === 'All' ? 'All' : status.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <label className="text-sm font-semibold text-gray-600">Source</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                        <div key={oId} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
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
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 font-semibold mb-1">Customer</p>
                                <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                                <p className="text-xs text-gray-500">{order.customer_phone || 'N/A'}</p>
                                <p className="text-xs text-gray-400 truncate" title={getOrderLocationDisplay(order)}>📍 {getOrderLocationDisplay(order)}</p>
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
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button onClick={() => setExpandedOrderItems(prev => ({ ...prev, [oId]: !prev[oId] }))} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                <Eye className="w-4 h-4" /> View
                              </button>
                              {canApprove && (
                                <button onClick={() => {
                                  setVerifyingOrder(order);
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

                            {/* Receipt Download - Show when BOTH payment verified AND delivered/completed */}
                            {((order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid') &&
                              (order.status === 'Delivered' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'completed' || order.status === 'Shipped')) && (
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <p className="text-xs font-bold text-blue-900">📄 Order Receipt</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`http://localhost:5000/api/orders/${oId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                        if (!res.ok) { alert('Receipt not available yet'); return; }
                                        const blob = await res.blob();
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                      } catch (e) { console.error(e); alert('Failed to load receipt'); }
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
                                        if (!res.ok) { alert('Receipt not available yet'); return; }
                                        const blob = await res.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `AVATA-Receipt-Order-${oId}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                        alert('📥 Receipt downloaded!');
                                      } catch (e) { console.error(e); alert('Failed to download receipt'); }
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
                                      <div key={i} className={`flex flex-col ${c.role === 'customer' ? 'items-start' : 'items-end'}`}>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${c.role === 'customer' ? 'bg-white text-gray-800 border border-gray-200' : 'bg-purple-600 text-white'}`}>
                                          {c.comment}
                                        </div>
                                        <div className="text-[9px] text-gray-400 mt-1 px-2">{c.role} • {new Date(c.created_at).toLocaleString()}</div>
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
                                    onChange={(e) => setNewComment({ ...newComment, [oId]: e.target.value })}
                                    placeholder="Add comment..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                  <button
                                    onClick={() => sendOrderComment(oId)}
                                    disabled={sendingComment === oId}
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
                    <table className="w-full min-w-[980px]">
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
                                <tr className="hover:bg-gray-50 transition-colors">
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

                                  {renderPaginationControls({
                                    currentPage,
                                    totalPages,
                                    onPageChange: setOrdersPage,
                                    totalItems: filteredOrders.length,
                                    label: 'orders'
                                  })}
                                  </td>

                                  {/* Customer Info */}
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-gray-900 text-sm">{order.customer_name}</span>
                                      <span className="text-xs text-gray-500">{order.email || order.customer_email}</span>
                                      <span className="text-xs text-gray-500">{order.customer_phone || 'N/A'}</span>
                                      <span className="text-xs text-gray-400 truncate" title={getOrderLocationDisplay(order)}>📍 {getOrderLocationDisplay(order)}</span>
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
                                    <div className="flex flex-col gap-2 min-w-[200px]">
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
                                                  if (!res.ok) { alert('Receipt not available yet'); return; }
                                                  const blob = await res.blob();
                                                  const url = URL.createObjectURL(blob);
                                                  window.open(url, '_blank');
                                                } catch (e) { console.error(e); alert('Failed to load receipt'); }
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
                                                  if (!res.ok) { alert('Receipt not available yet'); return; }
                                                  const blob = await res.blob();
                                                  const url = URL.createObjectURL(blob);
                                                  const a = document.createElement('a');
                                                  a.href = url;
                                                  a.download = `AVATA-Receipt-Order-${oId}.pdf`;
                                                  document.body.appendChild(a);
                                                  a.click();
                                                  a.remove();
                                                  URL.revokeObjectURL(url);
                                                  alert('📥 Receipt downloaded!');
                                                } catch (e) { console.error(e); alert('Failed to download receipt'); }
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
                                                <div key={i} className={`flex flex-col ${c.role === 'customer' ? 'items-start' : 'items-end'}`}>
                                                  <div className={`max-w-[75%] px-4 py-3 rounded-xl shadow-sm ${c.role === 'customer'
                                                    ? 'bg-white text-gray-800 border border-gray-200'
                                                    : 'bg-purple-600 text-white'
                                                    }`}>
                                                    <p className="text-sm">{c.comment}</p>
                                                  </div>
                                                  <div className="text-[10px] text-gray-400 mt-1 px-2 font-medium">
                                                    {c.role} • {new Date(c.created_at).toLocaleString()}
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
              </div>
            );
          })()}

          {activeView === 'analytics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    <PieChart className="text-purple-600 w-8 h-8" />
                    Sales Analytics
                  </h2>
                  <p className="text-gray-500 font-medium">Daily, weekly, monthly, and yearly report for products, orders, and customers.</p>
                </div>
                <div className={`flex items-center p-1 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
                  {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${timeRange === range ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Daily', data: computedAnalytics.kpis.daily, icon: BarChart3 },
                  { title: 'Weekly', data: computedAnalytics.kpis.weekly, icon: TrendingUp },
                  { title: 'Monthly', data: computedAnalytics.kpis.monthly, icon: ShoppingBag },
                  { title: 'Yearly', data: computedAnalytics.kpis.yearly, icon: DollarSign }
                ].map((kpi) => (
                  <div key={kpi.title} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-500">{kpi.title} Report</p>
                      <kpi.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-black text-green-600">{kpi.data.revenue.toLocaleString()} RWF</p>
                    <p className="text-sm text-gray-500 mt-1">{kpi.data.orders} orders</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`xl:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black">Sales Trend ({timeRange})</h3>
                    <p className="text-xs font-bold text-gray-500">Revenue + Orders</p>
                  </div>
                  {computedAnalytics.series.length > 0 ? (
                    <div className="h-72 flex items-end gap-2">
                      {computedAnalytics.series.map((point) => {
                        const maxRevenue = Math.max(...computedAnalytics.series.map((s) => s.revenue), 1);
                        const maxOrders = Math.max(...computedAnalytics.series.map((s) => s.orders), 1);
                        const revenueHeight = (point.revenue / maxRevenue) * 100;
                        const ordersHeight = (point.orders / maxOrders) * 100;
                        return (
                          <div key={point.key} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                            <div className="w-full flex items-end gap-1 h-full">
                              <div
                                className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-300"
                                style={{ height: `${revenueHeight}%` }}
                                title={`Revenue: ${point.revenue.toLocaleString()} RWF`}
                              />
                              <div
                                className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-300"
                                style={{ height: `${ordersHeight}%` }}
                                title={`Orders: ${point.orders}`}
                              />
                            </div>
                            <span className="text-[10px] mt-2 text-gray-500 text-center truncate w-full">{point.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">No sales data available yet.</div>
                  )}
                  <div className="flex items-center gap-6 mt-4 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500" />Revenue</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500" />Orders</div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
                  <h3 className="text-lg font-black mb-4">Top Customers</h3>
                  <div className="space-y-3">
                    {computedAnalytics.topCustomers.length > 0 ? paginateItems(computedAnalytics.topCustomers, topCustomersPage).map((customer, index) => (
                      <div key={`${customer.email}-${index}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="font-bold text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span>{customer.orders} orders</span>
                          <span className="font-black text-purple-600">{customer.spent.toLocaleString()} RWF</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-500">No customer purchase data yet.</p>}
                  </div>
                  {renderPagination(topCustomersPage, setTopCustomersPage, getTotalPages(computedAnalytics.topCustomers))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black">Best Selling Products</h3>
                    <button onClick={() => setActiveView('products')} className="text-xs font-bold text-purple-600">Open Products</button>
                  </div>
                  <div className="space-y-3">
                    {computedAnalytics.topProducts.length > 0 ? paginateItems(computedAnalytics.topProducts, topProductsPage).map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm truncate pr-2">{((topProductsPage - 1) * ANALYTICS_PAGE_SIZE) + idx + 1}. {item.name}</p>
                          <p className="text-xs font-black text-green-600">{item.revenue.toLocaleString()} RWF</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Units sold: {item.units}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">No product sales data yet.</p>}
                  </div>
                  {renderPagination(topProductsPage, setTopProductsPage, getTotalPages(computedAnalytics.topProducts))}
                </div>

                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
                  <h3 className="text-lg font-black mb-4">Overall Business Status</h3>
                  <div className="space-y-4">
                    {paginateItems(businessStatusItems, businessStatusPage).map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between p-3 rounded-xl ${item.tone === 'emerald' ? 'bg-emerald-50 border border-emerald-100' : item.tone === 'indigo' ? 'bg-indigo-50 border border-indigo-100' : item.tone === 'amber' ? 'bg-amber-50 border border-amber-100' : 'bg-purple-50 border border-purple-100'}`}
                      >
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className={`font-black ${item.tone === 'emerald' ? 'text-emerald-700' : item.tone === 'indigo' ? 'text-indigo-700' : item.tone === 'amber' ? 'text-amber-700' : 'text-purple-700'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {renderPagination(businessStatusPage, setBusinessStatusPage, getTotalPages(businessStatusItems))}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
                <h3 className="text-lg font-black mb-4">All Products Sales Report</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-3 pr-3">Product</th>
                        <th className="py-3 pr-3">Category</th>
                        <th className="py-3 pr-3">Units Sold</th>
                        <th className="py-3 pr-3">Revenue</th>
                        <th className="py-3">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computedAnalytics.productCatalog.length > 0 ? paginateItems(computedAnalytics.productCatalog, productsReportPage).map((row) => (
                        <tr key={row.id || row.name} className="border-b last:border-b-0">
                          <td className="py-3 pr-3 font-semibold">{row.name}</td>
                          <td className="py-3 pr-3">{row.category}</td>
                          <td className="py-3 pr-3">{row.unitsSold}</td>
                          <td className="py-3 pr-3 font-black text-green-600">{row.revenue.toLocaleString()} RWF</td>
                          <td className="py-3">{row.stock}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500">No product data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(productsReportPage, setProductsReportPage, getTotalPages(computedAnalytics.productCatalog))}
              </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div>
                <h2 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <ClipboardList className="text-purple-600 w-8 h-8" />
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
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all capitalize ${reportType === type ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : `border-gray-200 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}`}
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
                      className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none font-bold transition-all ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500'}`}
                    />
                  </div>

                  {/* Quick Select */}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Quick Select</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Today',     fn: () => new Date().toISOString().slice(0, 10), type: 'daily' },
                        { label: 'Yesterday', fn: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }, type: 'daily' },
                        { label: 'This Week', fn: () => new Date().toISOString().slice(0, 10), type: 'weekly' },
                        { label: 'Last Week', fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }, type: 'weekly' },
                      ].map(q => (
                        <button
                          key={q.label}
                          onClick={() => { setReportDate(q.fn()); setReportType(q.type); setReportGenerated(false); }}
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
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-200/60"
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
                      { label: 'Total Orders', value: reportData.totalOrders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
                      { label: 'Paid Orders', value: reportData.totalPaidOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    ].map(s => (
                      <div key={s.label} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-5 flex items-center gap-4 shadow-sm`}>
                        <div className={`p-3 rounded-xl border ${s.bg}`}>
                          <s.icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
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
                          {reportType === 'daily' ? 'Daily' : 'Weekly'} Sales — <span className="text-purple-600">{reportDateRangeLabel}</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{reportData.rows.length} product(s) sold in this period</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setShowPdfPreview(true)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-purple-200/60"
                        >
                          <FileText className="w-4 h-4" />
                          Preview & PDF
                        </button>
                        <button
                          onClick={downloadOwnerReportCSV}
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
                                  <td className={`py-3 pr-4 font-semibold ${darkMode ? 'text-white' : ''}`}>{row.name}</td>
                                  <td className="py-3 pr-4">{row.units}</td>
                                  <td className="py-3 pr-4 font-black text-green-600">{row.revenue.toLocaleString()} RWF</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`flex-1 rounded-full h-1.5 max-w-[80px] ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pct.toFixed(0)}%` }} />
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
                      <h3 className={`font-black text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Order Details <span className="text-purple-600">({reportData.orders.length})</span>
                      </h3>
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
                                <td className="py-3 pr-4 font-bold text-purple-600">#{order.id}</td>
                                <td className={`py-3 pr-4 ${darkMode ? 'text-gray-300' : ''}`}>{order.customer_name || order.full_name || order.customer_email || '—'}</td>
                                <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{normalizeDate(order.created_at || order.date).toLocaleDateString()}</td>
                                <td className="py-3 pr-4">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' || order.status === 'Not_Delivered' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
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
          )}

          {activeView === 'special-offer' && (
            <SpecialOfferManager darkMode={darkMode} onNotify={(message) => alert(message)} />
          )}

          {activeView === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Owner Settings</h2>
                <p className="text-gray-500">Manage dashboard behavior, session security, and account access.</p>
              </div>
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border p-6 space-y-5`}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-bold">Theme Mode</p>
                    <p className="text-sm text-gray-500">Switch between light and dark dashboard mode.</p>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold"
                  >
                    {darkMode ? 'Use Light' : 'Use Dark'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-4">
                  <div>
                    <p className="font-bold text-blue-800">Payment Options for Customers</p>
                    <p className="text-sm text-blue-700">These values are shown to customers when uploading payment proof.</p>
                  </div>

                  {paymentOptionsLoading ? (
                    <p className="text-sm text-blue-700">Loading payment options...</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={paymentOptions.bank_bk_account}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, bank_bk_account: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="BK account number"
                        />
                        <input
                          type="text"
                          value={paymentOptions.bank_equity_account}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, bank_equity_account: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Equity account number"
                        />
                        <input
                          type="text"
                          value={paymentOptions.mobile_mtn_number}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, mobile_mtn_number: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="MTN number"
                        />
                        <input
                          type="text"
                          value={paymentOptions.mobile_airtel_number}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, mobile_airtel_number: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Airtel number"
                        />
                        <input
                          type="text"
                          value={paymentOptions.tin_number}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, tin_number: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Company TIN number"
                        />
                        <input
                          type="text"
                          value={paymentOptions.ebm_number}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, ebm_number: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Company EBM number"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={paymentOptions.reference_prefix}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, reference_prefix: e.target.value.toUpperCase() }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Reference prefix (e.g. PAY)"
                        />
                        <input
                          type="text"
                          value={paymentOptions.notes}
                          onChange={(e) => setPaymentOptions(prev => ({ ...prev, notes: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-blue-200 text-sm"
                          placeholder="Extra payment note"
                        />
                      </div>

                      <button
                        onClick={savePaymentOptions}
                        disabled={paymentOptionsSaving}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold disabled:opacity-50"
                      >
                        {paymentOptionsSaving ? 'Saving...' : 'Save Payment Options'}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                  <div>
                    <p className="font-bold text-red-700">Secure Logout</p>
                    <p className="text-sm text-red-600">Logout and clear local session data from this browser.</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {
            activeView === 'profile' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="text-center">
                  <h2 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Owner Profile</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Manage your personal information and security credentials</p>
                </div>

                <div className={`p-8 rounded-[2rem] shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}>
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-purple-500 uppercase tracking-[0.2em]">Full Name</label>
                        <div className="relative group">
                          <User className={`absolute left-4 top-4 w-5 h-5 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-purple-400' : 'text-gray-400 group-focus-within:text-purple-500'}`} />
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-purple-500 uppercase tracking-[0.2em]">Phone Number</label>
                        <div className="relative group">
                          <Truck className={`absolute left-4 top-4 w-5 h-5 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-purple-400' : 'text-gray-400 group-focus-within:text-purple-500'}`} />
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Email Address (Static)</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={profileForm.email}
                            disabled
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed font-bold"
                          />
                        </div>
                        <p className="text-xs text-gray-400 italic px-2">Account email is tied to your business license and cannot be modified.</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <h4 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Change Password
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="password"
                          placeholder="Current Password"
                          className={`w-full px-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                          value={profilePw.current_password}
                          onChange={e => setProfilePw({ ...profilePw, current_password: e.target.value })}
                        />
                        <div className="hidden md:block"></div>
                        <input
                          type="password"
                          placeholder="New Password"
                          className={`w-full px-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                          value={profilePw.new_password}
                          onChange={e => setProfilePw({ ...profilePw, new_password: e.target.value })}
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className={`w-full px-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                          value={profilePw.confirm_password}
                          onChange={e => setProfilePw({ ...profilePw, confirm_password: e.target.value })}
                        />
                      </div>
                    </div>

                    {profileMsg && (
                      <div className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 ${profileMsg.includes('updated') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {profileMsg.includes('updated') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {profileMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full py-5 rounded-3xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-lg shadow-xl hover:shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {profileSaving ? 'Synchronizing...' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                {/* Maintenance & Backup Section */}
                <div className={`p-8 rounded-[2rem] shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">System Maintenance</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Database & Asset Protection</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-[1.5rem] border-2 border-dashed ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="max-w-md">
                        <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Full Database Export</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          Generate a comprehensive JSON backup of your products, orders, customers, and configuration.
                          Store this file securely to ensure business continuity.
                        </p>
                      </div>
                      <button
                        onClick={handleBackup}
                        className="whitespace-nowrap px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm border-2 border-gray-200 dark:border-gray-600 hover:border-purple-600 dark:hover:border-purple-500 transition-all hover:scale-[1.05] active:scale-95 shadow-sm flex items-center gap-3"
                      >
                        <Download className="w-5 h-5" />
                        Backup Database
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        </main >
      </div >

      {/* PDF Preview Modal */}
      {showPdfPreview && reportData && <OwnerPdfPreviewModal />}

      {/* Create/Edit Product Modal - Elite Design */}
      {
        showProductModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'} rounded-[2.5rem] shadow-2xl p-10 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border relative`}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {editingProduct ? 'Update Unit' : 'Deploy New Unit'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Inventory Management Protocol</p>
                </div>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
                    setProductImages([]);
                  }}
                  className={`p-2 rounded-2xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingProduct) {
                  updateProduct(editingProduct.id, newProduct);
                } else {
                  createProduct();
                }
              }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] ml-2">Product Designation</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                      required
                      placeholder="e.g. AVATA High-Performance Respirator"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] ml-2">Category Sector</label>
                    <select
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 cursor-pointer'}`}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] ml-2">Market Price (RWF)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                      required
                      placeholder="10000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] ml-2">Initial Stock Count</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                      required
                      placeholder="50"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] ml-2">Product Images</label>
                    
                    {/* File Upload Input */}
                    <div className="relative">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-gray-700 bg-gray-900 hover:bg-gray-800 hover:border-purple-500' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-600'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className={`w-10 h-10 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <p className={`mb-2 text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="text-purple-600">Click to upload</span> or drag and drop
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            PNG, JPG, WEBP (multiple files allowed)
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Optional URL Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                        placeholder="Or paste image URL: https://..."
                      />
                    </div>

                    {/* Preview Selected Images */}
                      {productImages.length > 0 && (
                        <div className="mt-4">
                          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Selected Images ({productImages.length}):</p>
                          <div className="grid grid-cols-4 gap-2">
                            {productImages.map((img, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={img.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Existing product images (when editing) */}
                      {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <p className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Current Product Images:
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {editingProduct.images.map((img, idx) => (
                              <div key={idx} className={`border rounded-lg p-2 relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <img 
                                  src={img.startsWith('/uploads') ? `http://localhost:5000${img}` : img} 
                                  alt={`img-${idx}`} 
                                  className="w-full h-20 object-cover rounded" 
                                />
                                <div className="flex gap-1 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSetMainImage(editingProduct.id, img)}
                                    className={`flex-1 text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    Set Main
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(editingProduct.id, img)}
                                    className="flex-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                                {editingProduct.image === img && (
                                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                    Main
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 transition ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'}`}
                      rows="4"
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      setNewProduct({ name: '', category_id: '', price: '', description: '', stock: '', image: '' });
                      setProductImages([]);
                    }}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black uppercase tracking-widest shadow-xl hover:shadow-purple-200 dark:hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {editingProduct ? <RefreshCw className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        {editingProduct ? 'Commit Changes' : 'Execute Deploy'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )
      }

      {/* Payment Verification Modal - Elite Upgrade */}
      {
        showVerifyModal && verifyingOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'} rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full mx-4 border relative`}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verify Asset Transfer</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Financial Audit Protocol</p>
                </div>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerifyingOrder(null);
                    setReceiptUrl('');
                  }}
                  className={`p-2 rounded-2xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-purple-50/50 border-purple-100'}`}>
                  <div className="grid grid-cols-2 gap-4 text-xs font-black uppercase tracking-widest">
                    <div className="text-gray-400">Order ID</div>
                    <div className="text-right text-purple-600">#{verifyingOrder.id || verifyingOrder.orderId}</div>
                    <div className="text-gray-400">Merchant Total</div>
                    <div className="text-right text-green-600">{(verifyingOrder.total_amount || verifyingOrder.total || 0).toLocaleString()} RWF</div>
                  </div>
                </div>

                {(verifyingOrder.payment_proof || verifyingOrder.payment_proof_file) && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-gray-400 ml-2">Digital Signature/Evidence</p>
                    <div className="relative group rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 aspect-video flex items-center justify-center">
                      {verifyingOrder.payment_proof_file ? (
                        <img
                          src={getFullImageUrl(verifyingOrder.payment_proof_file)}
                          alt="Proof"
                          className="w-full h-full object-cover"
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
                        Inspect Full Asset
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                verifyPayment(verifyingOrder.id || verifyingOrder.orderId);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-2">Verification Receipt Code</label>
                  <input
                    type="text"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600'}`}
                    placeholder="Enter MTCN or Receipt Ref..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-green-500 to-green-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-green-100 dark:hover:shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle className="w-6 h-6" /> Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )
      }
    </div >
  );
};

export default OwnerDashboard;
