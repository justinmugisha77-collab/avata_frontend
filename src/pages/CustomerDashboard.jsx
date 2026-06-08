import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Package, Clock, CheckCircle, Upload, Eye, ArrowLeft, AlertCircle,
    ShoppingBag, Phone, Mail, User as UserIcon, LayoutDashboard,
    History, CreditCard, Settings, LogOut, ChevronRight, MessageSquare,
    Send, Truck, Star, RefreshCw, FileText, Lock, Edit3, Save, X, Trash2, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useDashboardNavigationGuard from '../utils/useDashboardNavigationGuard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import getFullImageUrl from '../utils/getFullImageUrl';

const API = 'http://localhost:5000';

const STEPS = [
    { id: 1, label: 'Order Placed', icon: Package },
    { id: 2, label: 'Payment Submitted', icon: Upload },
    { id: 3, label: 'Payment Verified', icon: CheckCircle },
    { id: 4, label: 'Order Confirmed', icon: Star },
    { id: 5, label: 'Delivered', icon: Truck },
    { id: 6, label: 'Completed', icon: CheckCircle },
];

function ScrollToTopComponent() {
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return null;
}

function getOrderStepState(order) {
    const status = String(order.status || '').toLowerCase();
    const paymentStatus = String(order.payment_status || '').toLowerCase();
    const verificationStatus = String(order.verification_status || '').toLowerCase();
    const hasSubmittedProof = Boolean(order.payment_proof || order.payment_proof_file || paymentStatus === 'awaiting_verification');
    const paymentVerified = paymentStatus === 'verified' || paymentStatus === 'paid' || verificationStatus === 'approved';

    if (status === 'not_delivered') {
        return { current: 5, failed: 5 };
    }

    if (status === 'cancelled') {
        return { current: 1, failed: 1 };
    }

    if (status === 'completed') {
        return { current: 6, completed: true };
    }

    if (status === 'delivered') {
        return { current: 5 };
    }

    if (status === 'processing' || status === 'shipped') {
        return { current: 4 };
    }

    if (status === 'paid') {
        return { current: 3 };
    }

    if (paymentVerified) {
        return { current: 3 };
    }

    if (hasSubmittedProof) {
        return { current: 2 };
    }

    return { current: 1 };
}

function StatusBadge({ order }) {
    const s = order.payment_status;
    const os = order.status;
    const vs = order.verification_status;

    if (os === 'Completed' || os === 'completed') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-300 shadow-md">✅ COMPLETED</span>;
    if (os === 'Not_Delivered') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border-2 border-red-300 animate-pulse shadow-md">❌ NOT DELIVERED</span>;
    if (os === 'Delivered' || os === 'delivered') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-2 border-indigo-300 animate-pulse shadow-md">🚚 DELIVERED - Confirm Below</span>;
    if (os === 'Shipped') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-300 shadow-md">📦 SHIPPED</span>;
    if (os === 'Processing') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-800 border-2 border-violet-300 shadow-md">🛠️ ORDER CONFIRMED</span>;
    if (os === 'Paid' || vs === 'approved' || s === 'verified') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 shadow-md">🟢 PAYMENT CONFIRMED</span>;
    if (vs === 'rejected') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-300 animate-pulse shadow-md">❌ PROOF REJECTED</span>;
    if (os === 'Payment_Under_Review' || vs === 'pending' || s === 'awaiting_verification') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300 shadow-md">⏳ UNDER REVIEW</span>;
    if (os === 'Waiting_Proof' || s === 'pending') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-2 border-orange-300 shadow-md">⏰ UPLOAD PROOF</span>;
    if (os === 'Cancelled') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-2 border-gray-300 shadow-md">🚫 CANCELLED</span>;
    if (os === 'sent') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-2 border-blue-300 shadow-md">📱 SENT VIA WHATSAPP</span>;

    return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-2 border-orange-300 shadow-md">⏰ UPLOAD PROOF</span>;
}

function ProgressBar({ order }) {
    const { current, failed, completed } = getOrderStepState(order);
    const stepPalette = {
        1: 'bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-200',
        2: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200',
        3: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200',
        4: 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200',
        5: 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-200',
        6: 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200',
    };

    return (
        <div className="flex items-center justify-between w-full">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const stepNumber = idx + 1;
                const done = completed ? stepNumber <= current : stepNumber < current;
                const active = stepNumber === current && !completed && !failed;
                const isFailed = failed === stepNumber;
                const isLast = idx === STEPS.length - 1;
                const circleClass = isFailed
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                    : done
                        ? (stepPalette[stepNumber] || 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200')
                        : active
                            ? `${stepPalette[stepNumber] || 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'} animate-pulse`
                            : 'bg-gray-100 border-gray-300 text-gray-400';
                const labelClass = isFailed
                    ? 'text-red-600'
                    : done || active
                        ? 'text-gray-900'
                        : 'text-gray-400';
                const connectorClass = failed && stepNumber < failed
                    ? 'bg-red-400'
                    : done
                        ? (stepPalette[stepNumber]?.split(' ')[0] || 'bg-green-500')
                        : 'bg-gray-200';

                return (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${circleClass}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className={`mt-1.5 text-xs font-medium text-center max-w-[72px] leading-tight ${labelClass}`}>{step.label}</p>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${connectorClass}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function OrderComments({ orderId, token }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [commentSuccess, setCommentSuccess] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        if (!orderId || !token) return;
        fetch(`${API}/api/orders/${orderId}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(d => { if (d.success) setComments(d.comments || []); });
    }, [orderId, token]);

    const sendComment = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const r = await fetch(`${API}/api/orders/${orderId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ comment: newComment.trim() })
            });
            const d = await r.json();
            if (d.success) {
                setComments(d.comments || []);
                setNewComment('');
                setCommentSuccess('Message sent successfully.');
                setTimeout(() => setCommentSuccess(''), 2200);
            } else {
                alert(d.message || 'Failed to send comment. Please try again.');
            }
        } catch (_error) {
            alert('Failed to send comment. Please check your connection and try again.');
        } finally { setSending(false); }
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Messages & Comments
            </h5>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No messages yet.</p>
                ) : comments.map(c => (
                    <div key={c.id} className={`flex gap-2 ${c.author_role !== 'customer' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-xl text-xs shadow-sm ${c.author_role !== 'customer'
                                ? 'bg-blue-50 border border-blue-100 text-blue-900'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            <p className="font-semibold text-xs mb-0.5 opacity-70">
                                {c.author_role !== 'customer' ? `${c.author_name} (Staff)` : 'You'}
                            </p>
                            <p>{c.comment}</p>
                            <p className="text-xs opacity-50 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendComment()}
                    placeholder="Write a message..."
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <button
                    onClick={sendComment}
                    disabled={sending}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            {commentSuccess && (
                <p className="mt-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                    {commentSuccess}
                </p>
            )}
        </div>
    );
}

function PaymentProofUpload({ order, token, onRefresh }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState(null); // 'file' | 'url' | null
    const [paymentOptions, setPaymentOptions] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        const loadPaymentOptions = async () => {
            try {
                const response = await fetch(`${API}/api/payments/options`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json().catch(() => ({}));
                if (response.ok && data?.success && data?.options) {
                    setPaymentOptions(data.options);
                }
            } catch (error) {
                console.error('Failed to load payment options:', error);
            }
        };

        if (token) {
            loadPaymentOptions();
        }
    }, [token]);

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('payment_proof_file', file);
        try {
            const r = await fetch(`${API}/api/orders/${order.id}/payment-proof-upload`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
            });
            const d = await r.json().catch(() => ({}));
            if (d.success) { onRefresh(); setMode(null); setFile(null); }
            else alert(d.message || 'Upload failed');
        } catch { alert('Upload failed. Please try again.'); }
        finally { setUploading(false); }
    };

    // URL-based proof submission removed; only file uploads supported.

    const removeProof = async () => {
        if (!window.confirm('Remove this proof? You can upload a new one after removing.')) return;
        setUploading(true);
        try {
            const r = await fetch(`${API}/api/orders/${order.id}/payment-proof`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await r.json().catch(() => ({}));
            if (d.success) {
                setMode(null);
                setFile(null);
                onRefresh();
            } else {
                alert(d.message || 'Failed to remove proof');
            }
        } catch {
            alert('Failed to remove proof. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const hasSubmittedProof = Boolean(
        order.payment_proof_file ||
        order.payment_proof ||
        order.payment_status === 'awaiting_verification' ||
        order.status === 'Payment_Under_Review'
    );

    const proofLocked =
        order.status === 'Paid' ||
        order.status === 'Delivered' ||
        order.status === 'Completed' ||
        order.status === 'Cancelled' ||
        order.status === 'Not_Delivered' ||
        order.payment_status === 'Paid' ||
        order.payment_status === 'verified' ||
        order.verification_status === 'approved';
    const transportConfigured = Boolean(order.receipt_updated_at);
    const transportAmount = Number(order.receipt_transport || 0);
    const canUploadProof = !proofLocked;

    if (hasSubmittedProof && !mode) {
        // Already submitted - show proof
        const proof = order.payment_proof_file || order.payment_proof;
        return (
            <div className="mt-4 border-t pt-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" /> Payment Proof
                </h5>
                {proof ? (
                    <a
                        href={proof.startsWith('/uploads') ? `${API}${proof}` : proof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm hover:bg-green-100 transition font-medium"
                    >
                        <Eye className="w-4 h-4" /> View Submitted Proof
                    </a>
                ) : <p className="text-xs text-gray-400">Proof on file</p>}

                {!proofLocked && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => setMode('file')}
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            Upload New Proof
                        </button>
                        <button
                            onClick={removeProof}
                            disabled={uploading}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition inline-flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" /> Remove Proof
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-4 border-t pt-4">
            {transportConfigured ? (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs uppercase tracking-wider font-black text-emerald-700 mb-1">Frais de transport (reçu)</p>
                    <p className="text-sm text-emerald-900 font-medium">
                        Transport : {transportAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                        Montant enregistré sur votre reçu PDF. Vous pouvez envoyer votre preuve de paiement à tout moment.
                    </p>
                </div>
            ) : (
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wider font-black text-slate-600 mb-1">Frais de transport</p>
                    <p className="text-sm text-slate-800 font-medium">
                        Les frais de livraison seront ajoutés sur votre reçu par l&apos;administration si besoin. Vous pouvez déjà téléverser votre preuve de paiement.
                    </p>
                </div>
            )}
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs uppercase tracking-wider font-black text-blue-700 mb-2">Where to upload your proof of payment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-800">
                    <p><span className="font-semibold">BK:</span> {paymentOptions?.bank_bk_account || 'Not set'}</p>
                    <p><span className="font-semibold">Equity:</span> {paymentOptions?.bank_equity_account || 'Not set'}</p>
                    <p><span className="font-semibold">MTN:</span> {paymentOptions?.mobile_mtn_number || 'Not set'}</p>
                    <p><span className="font-semibold">Airtel:</span> {paymentOptions?.mobile_airtel_number || 'Not set'}</p>
                    <p><span className="font-semibold">TIN NUMBER:</span> {paymentOptions?.tin_number || 'Not set'}</p>
                    <p><span className="font-semibold">BPR PLC:</span> {paymentOptions?.ebm_number || 'Not set'}</p>
                </div>
                {paymentOptions?.notes && <p className="text-xs text-blue-700 mt-2">{paymentOptions.notes}</p>}
            </div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" /> Upload your proof of payment
            </h5>
            {!mode ? (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setMode('file')}
                        disabled={!canUploadProof}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Upload className="w-4 h-4" /> Upload proof file
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <input
                        ref={fileRef} type="file" accept=".jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.tiff,.heic,.heif,.pdf,image/*" className="hidden"
                        onChange={e => setFile(e.target.files[0])}
                    />
                    {!file ? (
                        <button
                            onClick={() => fileRef.current.click()}
                            className="w-full border-2 border-dashed border-blue-300 rounded-lg p-4 text-sm text-blue-600 hover:bg-blue-50 transition"
                        >
                            Click to select your proof of payment
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={uploadFile}
                            disabled={!file || uploading}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                        >
                            {uploading ? 'Uploading...' : 'Upload proof of payment'}
                        </button>
                        <button onClick={() => { setMode(null); setFile(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrderCard({ order, token, onRefresh, confirmDelivery, cancelMyOrder, autoExpand = false }) {
    const [expanded, setExpanded] = useState(autoExpand);
    const [receiptBlobUrl, setReceiptBlobUrl] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const statusLower = String(order.status || '').toLowerCase();
    const paymentStatusLower = String(order.payment_status || '').toLowerCase();
    const verificationLower = String(order.verification_status || '').toLowerCase();
    const canCancel = !(
        ['delivered', 'completed', 'cancelled', 'not_delivered', 'paid'].includes(statusLower)
        || ['paid', 'verified'].includes(paymentStatusLower)
        || verificationLower === 'approved'
    );

    const canUseReceipt = (
        (order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid')
        && (order.status === 'Delivered' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'completed' || order.status === 'Shipped')
    );

    const handleViewReceipt = async () => {
        try {
            const res = await fetch(`${API}/api/orders/${order.id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                alert('Receipt not available yet. Please try again in a moment.');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setReceiptBlobUrl(url);
            setShowReceiptModal(true);
        } catch (e) {
            console.error(e);
            alert('Failed to load receipt. Please try again.');
        }
    };

    const handleDownloadReceipt = async () => {
        try {
            const res = await fetch(`${API}/api/orders/${order.id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                alert('Receipt not available yet. Please try again in a moment.');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AVATA-Receipt-Order-${order.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            alert('Receipt downloaded successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to download receipt. Please try again.');
        }
    };

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white">Order #{order.id}</h3>
                            <p className="text-blue-100 text-[10px] sm:text-xs">
                                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right w-full sm:w-auto">
                        <p className="text-lg sm:text-xl font-bold text-white">{(order.total_amount || 0).toLocaleString()} RWF</p>
                        <StatusBadge order={order} />
                        <div className="mt-2">
                            <button onClick={() => setExpanded(true)} className="px-3 py-1 text-xs bg-white/20 text-white rounded-md border border-white/30 hover:bg-white/30 transition">View & Upload</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-3 sm:px-5 py-3 sm:py-4">
                {/* Progress Bar - Responsive */}
                <div className="mb-4 overflow-x-auto">
                    <ProgressBar order={order} />
                </div>

                {/* Items summary */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3">
                    <span>{order.items?.length || 0} item(s)</span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        {expanded ? 'Hide' : 'Details & Payment'}
                        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                </div>

                {expanded && (
                    <div className="border-t pt-3 sm:pt-4 space-y-3">
                        {/* Order items */}
                        <div className="space-y-2">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    {item.image ? (
                                        <img
                                            src={getFullImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{item.name || item.product_name}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Qty: {item.quantity} × {(item.price || 0).toLocaleString()} RWF</p>
                                    </div>
                                    <p className="font-bold text-blue-600 text-sm break-words">
                                        {((item.price || 0) * (item.quantity || 1)).toLocaleString()} RWF
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Payment Proof Upload */}
                        <PaymentProofUpload order={order} token={token} onRefresh={onRefresh} />

                        {canCancel && (
                                <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-xl">
                                    <button
                                        onClick={() => cancelMyOrder(order.id)}
                                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                                    >
                                        Cancel This Order
                                    </button>
                                </div>
                            )}

                        {/* Receipt actions (view/download) - Show when BOTH payment verified AND delivered/completed */}
                        {canUseReceipt && (
                            <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl shadow-md">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
                                    <h4 className="text-lg font-bold text-blue-900">📄 Order Receipt Available</h4>
                                </div>
                                <p className="text-sm text-gray-600 text-center mb-4">
                                    Your official order receipt is ready. View it online or download as PDF.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleViewReceipt}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-5 h-5" /> View Receipt
                                    </button>
                                    <button
                                        onClick={handleDownloadReceipt}
                                        className="flex-1 px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-5 h-5" /> Download PDF
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Delivery Confirmation Buttons - Only show if payment is approved */}
                        {String(order.status || '').toLowerCase() === 'delivered' && (
                            <div className="mt-4 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-2xl shadow-lg">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Package className="w-7 h-7 text-indigo-600 animate-bounce" />
                                    <p className="text-xl font-bold text-indigo-900">Confirm Delivery Status</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl mb-4">
                                    <p className="text-sm text-gray-700 text-center font-medium">
                                        Confirm only when you have received your order.
                                    </p>
                                    <p className="text-xs text-gray-600 text-center mt-2">
                                        Click <strong>Yes, I Received It</strong> to update the order to <strong>COMPLETED</strong>.
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => confirmDelivery(order.id, true)}
                                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-xl hover:shadow-green-500/50 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-105 border-2 border-green-400"
                                    >
                                        <CheckCircle className="w-6 h-6" /> ✅ Yes, I Received It
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Show message if order is shipped but payment not approved */}
                        {String(order.status || '').toLowerCase() === 'shipped' &&
                         !(order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid') &&
                         order.status !== 'Completed' && 
                         order.status !== 'Not_Delivered' && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <p className="text-sm font-medium text-yellow-800">
                                        Delivery confirmation will be available once your payment is approved by admin.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Completion Status Messages */}
                        {order.status === 'Completed' && (
                            <div className="mt-4 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-400 rounded-2xl shadow-lg">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <CheckCircle className="w-9 h-9 text-green-600 animate-pulse" />
                                    <p className="text-xl font-bold text-green-900">🎉 Order Completed Successfully!</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl mb-4">
                                    <p className="text-sm text-green-800 text-center font-semibold mb-2">
                                        Status: <span className="px-3 py-1 bg-green-200 rounded-full">COMPLETED</span>
                                    </p>
                                    <p className="text-sm text-gray-700 text-center">
                                        Thank you for confirming delivery! Your order receipt is available above.
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch(`${API}/api/orders/${order.id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                                if (!res.ok) { alert('Receipt not available yet. Please try again in a moment.'); return; }
                                                const blob = await res.blob();
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `AVATA-Receipt-Order-${order.id}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                                URL.revokeObjectURL(url);
                                                alert('Receipt downloaded successfully! 📥');
                                            } catch (e) { console.error(e); alert('Failed to download receipt. Please try again.'); }
                                        }}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl hover:shadow-green-500/50 transform hover:-translate-y-1 flex items-center gap-2"
                                    >
                                        <FileText className="w-5 h-5" /> Download Receipt
                                    </button>
                                </div>
                            </div>
                        )}

                        {order.status === 'Not_Delivered' && (
                            <div className="mt-4 p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-300 rounded-2xl shadow-lg">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <AlertCircle className="w-8 h-8 text-red-600 animate-pulse" />
                                    <p className="text-xl font-bold text-red-900">⚠️ Order Not Delivered - Issue Reported</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl mt-3">
                                    <p className="text-sm text-red-800 text-center font-semibold mb-2">
                                        Status: <span className="px-3 py-1 bg-red-200 rounded-full">NOT DELIVERED</span>
                                    </p>
                                    <p className="text-sm text-gray-700 text-center">
                                        Our support team has been notified and will contact you shortly to resolve this issue.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <OrderComments orderId={order.id} token={token} />
                    </div>
                )}
            </div>

            {/* Receipt Modal - Enhanced */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6" />
                                <div>
                                    <h4 className="font-bold text-lg">Order Receipt</h4>
                                    <p className="text-xs text-blue-100">Order #{order.id} • AVATA Trading</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={receiptBlobUrl} 
                                    download={`AVATA-Receipt-Order-${order.id}.pdf`}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Download PDF
                                </a>
                                <button 
                                    onClick={() => { 
                                        setShowReceiptModal(false); 
                                        if (receiptBlobUrl) { 
                                            URL.revokeObjectURL(receiptBlobUrl); 
                                            setReceiptBlobUrl(null); 
                                        } 
                                    }} 
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Close
                                </button>
                            </div>
                        </div>

                        {/* Receipt Content */}
                        <div className="h-[calc(100%-4rem)] bg-gray-50">
                            {receiptBlobUrl ? (
                                <iframe 
                                    src={receiptBlobUrl} 
                                    className="w-full h-full border-0" 
                                    title="Order Receipt PDF"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-600 font-medium">Loading receipt...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileSection({ user, token, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' });
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const save = async () => {
        setSaving(true);
        setMsg('');
        try {
            const body = { ...form };
            if (pwForm.new_password) {
                if (pwForm.new_password !== pwForm.confirm_password) {
                    setMsg('New passwords do not match');
                    setSaving(false);
                    return;
                }
                body.current_password = pwForm.current_password;
                body.new_password = pwForm.new_password;
            }
            const r = await fetch(`${API}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const d = await r.json();
            if (d.success) {
                setMsg('Profile updated!');
                setEditing(false);
                setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                if (onUpdate) onUpdate(d.user);
            } else {
                setMsg(d.message || 'Failed to update');
            }
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-blue-600" /> My Profile
                    </h3>
                    <button
                        onClick={() => setEditing(!editing)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                        <Edit3 className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {msg && (
                    <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${msg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {msg}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Full Name', key: 'full_name', icon: UserIcon },
                        { label: 'Email', key: 'email', icon: Mail, type: 'email' },
                        { label: 'Phone', key: 'phone', icon: Phone, type: 'tel' },
                    ].map(({ label, key, icon: Icon, type = 'text' }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                            {editing ? (
                                <div className="relative">
                                    <Icon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-lg text-sm">
                                    {form[key] || <span className="text-gray-400 italic">Not set</span>}
                                </p>
                            )}
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                        <p className="text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-lg text-sm">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{user?.role}</span>
                        </p>
                    </div>
                </div>

                {editing && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Change Password (optional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Current Password', key: 'current_password' },
                                { label: 'New Password', key: 'new_password' },
                                { label: 'Confirm New Password', key: 'confirm_password' },
                            ].map(({ label, key }) => (
                                <div key={key}>
                                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                    <input
                                        type="password"
                                        value={pwForm[key]}
                                        onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                        placeholder="••••••"
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                        >
                            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
    useDashboardNavigationGuard({
        enabled: Boolean(isAuthenticated),
        message: 'You are leaving your dashboard. Unsaved progress may be lost. Continue?'
    });
    const [activeView, setActiveView] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [notifications, setNotifications] = useState([]);
    const [replyOrderId, setReplyOrderId] = useState(null);
    const token = localStorage.getItem('token');
    const location = useLocation();

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) { navigate('/', { replace: true }); return; }
        loadOrders();
        loadNotifications();
    }, [isAuthenticated, navigate, authLoading]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const orderId = params.get('replyOrder');
        if (orderId) {
            setReplyOrderId(orderId);
            setActiveView('orders');
        }
    }, [location.search]);

    const loadNotifications = async () => {
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.notifications)) {
                // Filter to only show admin comment replies for customers
                const filteredNotifications = data.notifications.filter(notif =>
                    notif.type === 'comment' && notif.message.includes('Admin replied')
                );
                setNotifications(filteredNotifications);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const markNotificationRead = async (notifId) => {
        try {
            await fetch(`${API}/api/notifications/${notifId}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const deleteNotification = async (notifId) => {
        try {
            await fetch(`${API}/api/notifications/${notifId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/orders/myorders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) {
                setOrders(d.orders || []);
                setLastUpdated(Date.now());
            }
        } catch {
            const local = JSON.parse(localStorage.getItem('orders') || '[]');
            setOrders(local.filter(o => o.customer_email === user?.email));
            setLastUpdated(Date.now());
        } finally { setLoading(false); }
    };

    const confirmDelivery = async (orderId, confirmed) => {
        try {
            const res = await fetch(`${API}/api/orders/${orderId}/confirm-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ confirmed })
            });
            const data = await res.json();
            if (data.success) {
                // Show success message with status change info
                if (confirmed) {
                    alert('✅ Delivery Confirmed!\n\nYour order status has been updated to "COMPLETED".\nYou can now download your receipt above.\n\nThank you for shopping with AVATA Trading!');
                } else {
                    alert('⚠️ Issue Reported\n\nYour order status has been updated to "NOT DELIVERED".\nOur support team will contact you shortly to resolve this issue.');
                }
                // Reload orders to show updated status
                await loadOrders();
            } else {
                alert('Error: ' + (data.message || 'Failed to update order status. Please try again.'));
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            alert('Failed to confirm delivery. Please check your connection and try again.');
        }
    };

    const cancelMyOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            const res = await fetch(`${API}/api/orders/${orderId}/cancel-my-order`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                alert('Your order has been cancelled successfully.');
                await loadOrders();
            } else {
                alert(data.message || 'Failed to cancel order.');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
        }
    };

    const handleLogout = () => { logout(); navigate('/', { replace: true }); };

    const activeOrders = orders.filter(o => {
        const s = String(o.status || '').toLowerCase();
        return !['cancelled', 'completed', 'not_delivered'].includes(s);
    });
    const historyOrders = orders.filter(o => {
        const s = String(o.status || '').toLowerCase();
        return ['cancelled', 'completed', 'not_delivered'].includes(s);
    });
    const paidOrders = orders.filter(o => o.payment_status === 'verified');

    const navItems = [
        { id: 'orders', label: 'My Orders', icon: Package, badge: activeOrders.length },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.is_read).length },
        { id: 'history', label: 'Order History', icon: History, badge: historyOrders.length },
        { id: 'payments', label: 'Payment Status', icon: CreditCard, badge: paidOrders.length },
        { id: 'profile', label: 'My Profile', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                {/* Mobile View Selector - Visible on mobile only */}
                <div className="lg:hidden mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition text-xs font-medium ${activeView === item.id
                                            ? 'bg-blue-50 text-blue-700 border-2 border-blue-300'
                                            : 'text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mb-1" />
                                    <span>{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className={`mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeView === item.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/products')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition"
                        >
                            <ShoppingBag className="w-4 h-4" /> Shop Now
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 border-2 border-red-200 hover:bg-red-50 transition"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Desktop Sidebar - Hidden on mobile */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
                            {/* User Card */}
                            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                                    {user?.full_name?.charAt(0).toUpperCase() ||'U'}
                                </div>
                                <p className="font-bold text-base">{user?.full_name}</p>
                                <p className="text-blue-100 text-xs truncate">{user?.email}</p>
                                <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium capitalize">
                                    {user?.role}
                                </span>
                            </div>
                            {/* Nav */}
                            <nav className="p-3">
                                {navItems.map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveView(item.id)}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl mb-1 transition text-sm font-medium ${activeView === item.id
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="w-4.5 h-4.5" />
                                                <span>{item.label}</span>
                                            </div>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeView === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                <div className="border-t mt-3 pt-3">
                                    <button
                                        onClick={() => navigate('/products')}
                                        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                                    >
                                        <ShoppingBag className="w-4.5 h-4.5" /> Shop Now
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                                    >
                                        <LogOut className="w-4.5 h-4.5" /> Logout
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* ---- MY ORDERS ---- */}
                        {activeView === 'orders' && (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">My Active Orders</h2>
                                        <p className="text-gray-500 text-sm">Track and manage your current orders</p>
                                    </div>
                                    <div className="w-full sm:w-auto sm:text-right">
                                        <button 
                                            onClick={loadOrders} 
                                            className="w-full sm:w-auto justify-center sm:justify-start flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-blue-300 transition shadow-sm group"
                                            title="Refresh orders"
                                        >
                                            <RefreshCw className="w-4 h-4 text-gray-600 group-hover:text-blue-600 group-hover:rotate-180 transition-transform duration-500" />
                                            <span className="text-gray-700 group-hover:text-blue-600">Refresh</span>
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Updated {Math.floor((Date.now() - lastUpdated) / 1000)}s ago • Manual refresh
                                        </p>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
                                    </div>
                                ) : activeOrders.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Orders</h3>
                                        <p className="text-gray-500 mb-6">You don't have any active orders right now.</p>
                                        <button
                                            onClick={() => navigate('/products')}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeOrders.map(order => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                token={token}
                                                onRefresh={loadOrders}
                                                confirmDelivery={confirmDelivery}
                                                cancelMyOrder={cancelMyOrder}
                                                autoExpand={String(order.id) === String(replyOrderId)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---- ORDER HISTORY ---- */}
                        {activeView === 'history' && (
                            <div>
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                                    <p className="text-gray-500 text-sm">All your past and completed orders</p>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                        <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Order History</h3>
                                        <p className="text-gray-500">Your order history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                token={token}
                                                onRefresh={loadOrders}
                                                confirmDelivery={confirmDelivery}
                                                cancelMyOrder={cancelMyOrder}
                                                autoExpand={String(order.id) === String(replyOrderId)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---- PAYMENT STATUS ---- */}
                        {activeView === 'payments' && (
                            <div>
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Payment Status</h2>
                                    <p className="text-gray-500 text-sm">Track the status of all your payments</p>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Payments Yet</h3>
                                        <p className="text-gray-500">Payment records will appear here once you place an order.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold">Order #</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold">Proof</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {orders.map(order => {
                                                        const proof = order.payment_proof_file || order.payment_proof;
                                                        return (
                                                            <tr key={order.id} className="hover:bg-gray-50 transition">
                                                                <td className="px-4 py-3 font-semibold text-gray-900">#{order.id}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                                    {new Date(order.created_at).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3 font-bold text-blue-600">
                                                                    {(order.total_amount || 0).toLocaleString()} RWF
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <StatusBadge order={order} />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {proof ? (
                                                                        <a
                                                                            href={proof.startsWith('/uploads') ? `${API}${proof}` : proof}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" /> View
                                                                        </a>
                                                                    ) : <span className="text-xs text-gray-400">Not submitted</span>}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---- NOTIFICATIONS ---- */}
                        {activeView === 'notifications' && (
                            <div>
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                                    <p className="text-gray-500 text-sm">Admin replies and order updates</p>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Notifications</h3>
                                        <p className="text-gray-500">You'll see notifications here when admin replies to your orders.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`rounded-xl border p-4 transition ${
                                                    notif.is_read
                                                        ? 'bg-white border-gray-200'
                                                        : 'bg-blue-50 border-blue-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {!notif.is_read && (
                                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                                            )}
                                                            <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(notif.created_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {notif.link && (
                                                            <button
                                                                onClick={() => {
                                                                    if (!notif.is_read) markNotificationRead(notif.id);
                                                                    navigate(notif.link);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> Reply Comment
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteNotification(notif.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete notification"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---- PROFILE ---- */}
                        {activeView === 'profile' && (
                            <ProfileSection user={user} token={token} />
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CustomerDashboard;
