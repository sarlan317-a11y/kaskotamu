import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken
} from 'firebase/auth';
import { 
  Wallet, 
  History, 
  FileSpreadsheet, 
  Users, 
  UserSquare2, 
  Trophy, 
  CreditCard, 
  Settings, 
  TrendingUp,
  ArrowLeft,
  Download,
  ChevronDown,
  Check,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  Search,
  Plus,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Medal,
  ClipboardList,
  Info,
  Database,
  ShieldCheck,
  LogOut,
  Lock,
  Code,
  User,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCHmet3lnQu7QNwIk-LjWxoAPZNFXL-mc",
  authDomain: "kas-lrp.firebaseapp.com",
  projectId: "kas-lrp",
  storageBucket: "kas-lrp.firebasestorage.app",
  messagingSenderId: "993658249504",
  appId: "1:993658249504:web:bb0a4ce9e3090064373745"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'kasir-mini-wash';

const CustomSelect = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
      >
        <span className={value ? "text-gray-800 font-medium" : "text-gray-400"}>{selectedLabel}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[999] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-200">
          {options.length > 0 ? options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="flex items-center justify-between p-3 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
            >
              <span className={`text-sm ${value === opt.value ? 'text-emerald-600 font-bold' : 'text-gray-700'}`}>
                {opt.label}
              </span>
              {value === opt.value && <Check size={16} className="text-emerald-600" />}
            </div>
          )) : (
            <div className="p-4 text-center text-xs text-gray-400">Tidak ada data</div>
          )}
        </div>
      )}
    </div>
  );
};

const App = () => {
  // Authentication & Session State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [iuranData, setIuranData] = useState([]);
  const [pengeluaranData, setPengeluaranData] = useState([]);
  const [anggotaData, setAnggotaData] = useState([]);
  const [arisanData, setArisanData] = useState([]);
  const [juaraData, setJuaraData] = useState([]);
  const [timData, setTimData] = useState([]); 
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showModalSuccess, setShowModalSuccess] = useState(false); 
  const [showRegModal, setShowRegModal] = useState(false);
  const [showArisanModal, setShowArisanModal] = useState(false);
  const [showJuaraModal, setShowJuaraModal] = useState(false);
  const [showTimModal, setShowTimModal] = useState(false); 
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Security PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [isExporting, setIsExporting] = useState(false);

  const [formMinggu, setFormMinggu] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formAmountDisplay, setFormAmountDisplay] = useState(""); 
  const [formExpKeterangan, setFormExpKeterangan] = useState("");
  const [formExpAmountDisplay, setFormExpAmountDisplay] = useState("");
  const [formAnggotaNama, setFormAnggotaNama] = useState("");
  const [formArisanNama, setFormArisanNama] = useState("");
  const [formArisanMinggu, setFormArisanMinggu] = useState("");
  const [formTimNama, setFormTimNama] = useState("");
  const [formJuaraTim, setFormJuaraTim] = useState("");
  const [formJuaraRank, setFormJuaraRank] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    // Check local storage for session
    const savedSession = localStorage.getItem('mini_wash_session');
    if (savedSession === 'true') {
      setIsLoggedIn(true);
    }

    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script1.async = true;
    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
    script2.async = true;
    document.head.appendChild(script1);
    script1.onload = () => document.head.appendChild(script2);

    const initAuth = async () => {
  await signInAnonymously(auth);
};
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isLoggedIn) return;
    const unsubTrans = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));
    const unsubIuran = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'iuran'), (snapshot) => {
      setIuranData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));
    const unsubExp = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'pengeluaran'), (snapshot) => {
      setPengeluaranData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));
    const unsubAnggota = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (snapshot) => {
      setAnggotaData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.nama.localeCompare(b.nama)));
    }, (err) => console.error(err));
    const unsubArisan = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'arisan'), (snapshot) => {
      setArisanData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));
    const unsubJuara = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'juara'), (snapshot) => {
      setJuaraData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));
    const unsubTim = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (snapshot) => {
      setTimData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.nama.localeCompare(b.nama)));
    }, (err) => console.error(err));
    return () => { unsubTrans(); unsubIuran(); unsubExp(); unsubAnggota(); unsubArisan(); unsubJuara(); unsubTim(); };
  }, [user, isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "Admin" && password === "admin125") {
      setIsLoggedIn(true);
      setLoginError("");
      localStorage.setItem('mini_wash_session', 'true');
    } else {
      setLoginError("Username atau Password salah!");
      setTimeout(() => setLoginError(""), 3000);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('dashboard');
    localStorage.removeItem('mini_wash_session');
  };

  const totalMasuk = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalKeluar = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalKas = totalMasuk - totalKeluar;
  
  const formatNumberWithDots = (value) => {
    if (!value) return "";
    const numberString = value.replace(/[^0-9]/g, "");
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (inputPin === "0000") {
      setPinError(false);
      setInputPin("");
      setShowPinModal(false);
      setShowResetConfirm(true); 
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleSaveIuran = async (e) => {
    e.preventDefault();
    if (!user || !formMinggu || !formNama || !formAmountDisplay) return;
    const numericAmount = parseInt(formAmountDisplay.replace(/\./g, "")) || 0;
    const formData = new FormData(e.target);
    const selectedDate = formData.get('tanggal');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'iuran'), { minggu: formMinggu, tanggal: selectedDate, nama: formNama, amount: numericAmount, timestamp: serverTimestamp(), userId: user.uid });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), { category: 'Iuran', description: `Iuran ${formNama} (Minggu ${formMinggu})`, amount: numericAmount, type: 'income', date: selectedDate, timestamp: serverTimestamp() });
      setFormNama(""); setFormAmountDisplay(""); setShowModalSuccess(true); 
    } catch (error) { console.error(error); }
  };

  const handleSavePengeluaran = async (e) => {
    e.preventDefault();
    if (!user || !formExpKeterangan || !formExpAmountDisplay) return;
    const numericAmount = parseInt(formExpAmountDisplay.replace(/\./g, "")) || 0;
    const formData = new FormData(e.target);
    const selectedDate = formData.get('tanggal');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'pengeluaran'), { keterangan: formExpKeterangan, tanggal: selectedDate, amount: numericAmount, timestamp: serverTimestamp(), userId: user.uid });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), { category: 'Pengeluaran', description: formExpKeterangan, amount: numericAmount, type: 'expense', date: selectedDate, timestamp: serverTimestamp() });
      setFormExpKeterangan(""); setFormExpAmountDisplay(""); setShowModalSuccess(true); 
    } catch (error) { console.error(error); }
  };

  const handleSaveAnggota = async (e) => {
    e.preventDefault();
    if (!user || !formAnggotaNama) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), { nama: formAnggotaNama, joinDate: new Date().toISOString().split('T')[0], timestamp: serverTimestamp(), userId: user.uid });
      setFormAnggotaNama(""); setShowRegModal(false); setShowModalSuccess(true);
    } catch (error) { console.error(error); }
  };

  const handleSaveTim = async (e) => {
    e.preventDefault();
    if (!user || !formTimNama) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), { nama: formTimNama, createdDate: new Date().toISOString().split('T')[0], timestamp: serverTimestamp(), userId: user.uid });
      setFormTimNama(""); setShowTimModal(false); setShowModalSuccess(true);
    } catch (error) { console.error(error); }
  };

  const handleSaveArisan = async (e) => {
    e.preventDefault();
    if (!user || !formArisanNama || !formArisanMinggu) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'arisan'), { nama: formArisanNama, minggu: formArisanMinggu, tanggal: new Date().toISOString().split('T')[0], timestamp: serverTimestamp(), userId: user.uid });
      setFormArisanNama(""); setFormArisanMinggu(""); setShowArisanModal(false); setShowModalSuccess(true);
    } catch (error) { console.error(error); }
  };

  const handleSaveJuara = async (e) => {
    e.preventDefault();
    if (!user || !formJuaraTim || !formJuaraRank) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'juara'), { tim: formJuaraTim, juara: parseInt(formJuaraRank), tanggal: new Date().toISOString().split('T')[0], timestamp: serverTimestamp(), userId: user.uid });
      setFormJuaraTim(""); setFormJuaraRank(""); setShowJuaraModal(false); setShowModalSuccess(true);
    } catch (error) { console.error(error); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user) return;
    let col = activePage === 'iuran' ? 'iuran' : activePage === 'pengeluaran' ? 'pengeluaran' : activePage === 'anggota' ? 'members' : activePage === 'tim' ? 'teams' : activePage === 'arisan' ? 'arisan' : activePage === 'juara' ? 'juara' : 'transactions';
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) { console.error(error); }
  };

  const handleResetData = async () => {
    if (!user) return;
    const collections = ['transactions', 'iuran', 'pengeluaran', 'arisan', 'juara'];
    try {
      for (const colName of collections) {
        const q = collection(db, 'artifacts', appId, 'public', 'data', colName);
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      setShowResetConfirm(false);
      setActivePage('dashboard');
    } catch (error) { console.error(error); }
  };

  const getRekapJuara = () => {
    const rekap = {};
    juaraData.forEach(item => {
      if (!rekap[item.tim]) rekap[item.tim] = { tim: item.tim, j1: 0, j2: 0, j3: 0, j4: 0, total: 0 };
      const rankKey = `j${item.juara}`;
      if (rekap[item.tim][rankKey] !== undefined) {
        rekap[item.tim][rankKey] += 1;
        rekap[item.tim].total += 1;
      }
    });
    return Object.values(rekap).filter(t => t.tim.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => b.j1 - a.j1 || b.total - a.total);
  };

  const getRekapIuran = () => {
    const rekap = anggotaData.map(m => {
      const records = iuranData.filter(i => i.nama === m.nama);
      const total = records.reduce((a, c) => a + (Number(c.amount) || 0), 0);
      const mingguList = records.map(r => `M${r.minggu}`).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
      return { nama: m.nama, total, minggu: [...new Set(mingguList)].join(', '), count: records.length };
    });
    return rekap.filter(r => r.nama.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => b.total - a.total);
  };

  const exportToPDF = (type) => {
    let dataToExport = [];
    let title = "";
    let titleColor = [0, 0, 0];

    if (type === 'riwayat') {
      dataToExport = transactions.filter(t => t.date?.startsWith(filterMonth));
      title = `LAPORAN KEUANGAN - ${filterMonth}`;
      titleColor = [20, 20, 20];
    } else if (type === 'iuran') {
      dataToExport = formMinggu ? iuranData.filter(item => item.minggu === formMinggu) : iuranData;
      title = "LAPORAN IURAN";
      titleColor = [5, 150, 105];
    } else if (type === 'arisan') {
      dataToExport = arisanData;
      title = "DAFTAR PENERIMA ARISAN";
      titleColor = [249, 115, 22];
    } else if (type === 'juara') {
      dataToExport = getRekapJuara();
      title = "REKAPITULASI JUARA UMUM";
      titleColor = [234, 179, 8];
    } else if (type === 'rekap') {
      dataToExport = getRekapIuran();
      title = "REKAPITULASI SETORAN ANGGOTA";
      titleColor = [71, 85, 105];
    } else {
      dataToExport = pengeluaranData;
      title = "LAPORAN PENGELUARAN";
      titleColor = [225, 29, 72];
    }

    if (dataToExport.length === 0) return;
    const jsPDFLib = window.jspdf?.jsPDF;
    if (!jsPDFLib) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDFLib();
      const dateNow = new Date().toLocaleDateString('id-ID');
      pdf.setFontSize(18); pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]); pdf.text(title, 14, 20);
      let tableColumn = []; let tableRows = [];

      if (type === 'riwayat') {
        tableColumn = ["No", "Tanggal", "Keterangan", "Tipe", "Jumlah"];
        tableRows = dataToExport.map((item, index) => [index + 1, item.date || "-", item.description, item.type === 'income' ? 'Masuk' : 'Keluar', formatRupiah(item.amount)]);
        const tm = dataToExport.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
        const tk = dataToExport.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
        tableRows.push(["", "", "", "TOTAL MASUK", formatRupiah(tm)], ["", "", "", "TOTAL KELUAR", formatRupiah(tk)], ["", "", "", "SISA SALDO", formatRupiah(tm - tk)]);
      } else if (type === 'arisan') {
        tableColumn = ["No", "Nama Penerima", "Minggu Ke", "Tanggal Naik"];
        tableRows = dataToExport.map((item, index) => [index+1, item.nama, `Minggu ${item.minggu}`, item.tanggal]);
      } else if (type === 'juara') {
        tableColumn = ["No", "Tim", "Juara 1", "Juara 2", "Juara 3", "Juara 4", "Total"];
        tableRows = dataToExport.map((item, index) => [index+1, item.tim, item.j1, item.j2, item.j3, item.j4, item.total]);
      } else if (type === 'rekap') {
        tableColumn = ["No", "Nama Anggota", "Minggu Dibayar", "Frekuensi", "Total Rupiah"];
        tableRows = dataToExport.map((item, index) => [index+1, item.nama, item.minggu, item.count, formatRupiah(item.total)]);
      } else {
        tableColumn = type === 'iuran' ? ["No", "Nama", "Minggu", "Tanggal", "Jumlah"] : ["No", "Keterangan", "Tanggal", "Jumlah"];
        tableRows = dataToExport.map((item, index) => type === 'iuran' ? [index+1, item.nama, `M${item.minggu}`, item.tanggal, formatRupiah(item.amount)] : [index+1, item.keterangan, item.tanggal, formatRupiah(item.amount)]);
        tableRows.push(["", "", type==='iuran'?"":"", "TOTAL", formatRupiah(dataToExport.reduce((a,c) => a+c.amount,0))]);
      }

      const config = { head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: titleColor } };
      if (typeof pdf.autoTable === 'function') pdf.autoTable(config);
      else window.jspdf.jsPDF.API.autoTable.apply(pdf, [config]);
      pdf.save(`Laporan_${type}_${dateNow}.pdf`);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  // Login Page UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-blue-600 p-10 text-center text-white">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[32px] flex items-center justify-center mx-auto mb-6 p-2">
              <img 
                src="https://sidautamatrans.id/wp-content/uploads/2026/04/kota-mu.png" 
                alt="Logo Kota Mu" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-white font-black text-2xl italic">KM</div>';
                }}
              />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter">KOTAMU 125</h1>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.3em] mt-1">Management System</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-800">Selamat Datang</h2>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1">Gunakan Akun Admin untuk Masuk</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18}/></div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nama Pengguna"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><KeyRound size={18}/></div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi"
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top">
                  <AlertTriangle size={14}/>
                  {loginError.toUpperCase()}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                MASUK SEKARANG <ArrowUpRight size={20}/>
              </button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Kotamu 125 Administrator</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const themeColors = { iuran: 'emerald', pengeluaran: 'rose', anggota: 'indigo', tim: 'teal', riwayat: 'sky', arisan: 'orange', juara: 'yellow', rekap: 'slate', pengaturan: 'gray' };
  const themeColor = themeColors[activePage];
  
  let displayData = [];
  if (activePage === 'iuran') displayData = formMinggu ? iuranData.filter(i => i.minggu === formMinggu) : iuranData;
  else if (activePage === 'pengeluaran') displayData = pengeluaranData;
  else if (activePage === 'anggota') displayData = anggotaData.filter(a => a.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  else if (activePage === 'tim') displayData = timData.filter(t => t.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  else if (activePage === 'riwayat') displayData = transactions.filter(t => t.date?.startsWith(filterMonth));
  else if (activePage === 'arisan') displayData = arisanData.filter(a => a.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  else if (activePage === 'juara') displayData = getRekapJuara();
  else if (activePage === 'rekap') displayData = getRekapIuran();

  const pageTotals = {
    masuk: (activePage === 'riwayat' || activePage === 'iuran' || activePage === 'pengeluaran') ? displayData.filter(d => d.type === 'income').reduce((a,c) => a + c.amount, 0) : 0,
    keluar: (activePage === 'riwayat' || activePage === 'iuran' || activePage === 'pengeluaran') ? displayData.filter(d => d.type === 'expense').reduce((a,c) => a + c.amount, 0) : 0
  };

  if (activePage === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-100 max-w-md mx-auto shadow-2xl pb-10">
        <div className="bg-blue-600 pt-6 pb-12 px-4 rounded-b-[40px] text-white">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
               <div className="bg-white p-1 rounded-lg">
                 <img src="https://sidautamatrans.id/wp-content/uploads/2026/04/kota-mu.png" alt="Logo" className="h-6 object-contain" />
               </div>
               <span className="font-semibold text-lg">Admin</span>
            </div>
            <button onClick={handleLogout} className="p-2 bg-orange-500 rounded-md active:scale-95 transition-transform"><LogOut size={20} /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-400/50 p-2 rounded-lg"><Wallet size={24} /></div>
            <div>
              <p className="text-xs opacity-90">Saldo Kas Sekarang</p>
              <span className="text-xl font-bold">{formatRupiah(totalKas)}</span>
            </div>
          </div>
        </div>
        <div className="px-4 -mt-6">
          <div className="flex gap-2 mb-6">
            <div className="bg-black w-10 h-10 rounded-full flex items-center justify-center text-white"><Users size={20} /></div>
            <div className="bg-orange-500 flex-1 rounded-xl h-10 flex items-center justify-center font-semibold text-white shadow-md">Dashboard Utama</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Iuran', icon: <Wallet className="text-emerald-500" />, color: 'bg-emerald-50', action: () => setActivePage('iuran') },
              { title: 'Pengeluaran', icon: <CreditCard className="text-rose-500" />, color: 'bg-rose-50', action: () => setActivePage('pengeluaran') },
              { title: 'Anggota', icon: <Users className="text-indigo-500" />, color: 'bg-indigo-50', action: () => setActivePage('anggota') },
              { title: 'Riwayat', icon: <History className="text-sky-500" />, color: 'bg-sky-50', action: () => setActivePage('riwayat') },
              { title: 'Arisan Naik', icon: <TrendingUp className="text-orange-500" />, color: 'bg-orange-50', action: () => setActivePage('arisan') },
              { title: 'Juara Umum', icon: <Trophy className="text-yellow-600" />, color: 'bg-yellow-50', action: () => setActivePage('juara') },
              { title: 'Rekap', icon: <FileSpreadsheet className="text-slate-600" />, color: 'bg-slate-50', action: () => setActivePage('rekap') },
              { title: 'Tim', icon: <UserSquare2 className="text-teal-600" />, color: 'bg-teal-50', action: () => setActivePage('tim') },
              { title: 'Pengaturan', icon: <Settings className="text-gray-400" />, color: 'bg-gray-50', action: () => setActivePage('pengaturan') },
            ].map((item, idx) => (
              <div key={idx} onClick={item.action} className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-50 aspect-square text-center active:scale-95 transition cursor-pointer hover:shadow-md">
                <div className={`p-3 rounded-2xl mb-2 ${item.color}`}>{item.icon}</div>
                <span className="text-[10px] font-bold text-gray-700">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'pengaturan') {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl pb-20 relative">
        {/* PIN Security Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {setShowPinModal(false); setInputPin("");}}></div>
            <div className="bg-white w-full max-w-xs rounded-[32px] p-6 relative z-10 animate-in zoom-in duration-200 text-center">
              <div className="bg-orange-100 p-4 rounded-full mb-4 inline-block"><Lock size={32} className="text-orange-600" /></div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Verifikasi Admin</h3>
              <p className="text-xs text-gray-500 mb-6">Masukkan PIN untuk mengakses fitur reset.</p>
              <form onSubmit={handleVerifyPin}>
                <input 
                  type="password" 
                  maxLength={4}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className={`w-full text-center tracking-[1em] text-2xl font-black p-4 bg-gray-100 rounded-2xl mb-4 outline-none focus:ring-2 ${pinError ? 'ring-rose-500 border-rose-500' : 'focus:ring-orange-500'}`}
                  placeholder="****"
                  autoFocus
                />
                {pinError && <p className="text-rose-500 text-[10px] font-bold mb-4 uppercase">PIN Salah, Silakan Coba Lagi</p>}
                <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl">Buka Kunci</button>
              </form>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}></div>
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 relative z-10 animate-in zoom-in duration-200 text-center">
              <div className="bg-rose-100 p-4 rounded-full mb-4 inline-block"><AlertTriangle size={32} className="text-rose-600" /></div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Hapus Semua Data?</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">Tindakan ini akan menghapus seluruh riwayat iuran, pengeluaran, arisan, dan juara. <br/><strong>Data anggota tidak akan dihapus.</strong></p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Batal</button>
                <button onClick={handleResetData} className="py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg text-sm">Hapus Semua</button>
              </div>
            </div>
          </div>
        )}

        {showAboutModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAboutModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 animate-in zoom-in duration-300 shadow-2xl overflow-hidden">
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl p-2">
                  <img src="https://sidautamatrans.id/wp-content/uploads/2026/04/kota-mu.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4">Tentang Aplikasi</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium mb-4">Aplikasi ini dibuat untuk memudahkan pencatatan uang masuk dan keluar secara rapi. Memungkinkan Anda memantau keuangan dengan efisien.</p>
                
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-8">
                   <div className="flex items-center justify-center gap-2 mb-2">
                     <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Code size={14}/></div>
                     <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Developed by Sarlan</p>
                   </div>
                   <p className="text-xs font-bold text-blue-600 italic">"Simple. Reliable. Efficient."</p>
                </div>

                <button onClick={() => setShowAboutModal(false)} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl">Tutup</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-6 text-white sticky top-0 z-[100] flex items-center gap-4">
          <button onClick={() => setActivePage('dashboard')} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft size={24} /></button>
          <div><h1 className="text-xl font-bold">Pengaturan</h1><p className="text-[10px] opacity-70 font-bold uppercase">Aplikasi Mini Wash</p></div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center p-2 border border-orange-100">
                 <img src="https://sidautamatrans.id/wp-content/uploads/2026/04/kota-mu.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
               <div><h3 className="font-black text-gray-800 text-lg uppercase">Kotamu 125</h3><p className="text-xs text-gray-400 font-bold flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500"/> Terverifikasi Sistem</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50"><span className="text-xs font-bold text-gray-400 uppercase">Tipe Akun</span><span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-1 rounded">ADMINISTRATOR</span></div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50"><span className="text-xs font-bold text-gray-400 uppercase">Status Aplikasi</span><span className="text-xs font-black text-emerald-600">AKTIF</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Manajemen & Data</h4>
            <button onClick={() => setShowAboutModal(true)} className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between group transition">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Info size={18}/></div>
                <div className="text-left"><p className="text-sm font-black text-gray-800">Tentang Aplikasi</p><p className="text-[10px] text-gray-400 font-bold uppercase">Developed by Sarlan</p></div>
              </div>
              <ArrowLeft size={16} className="text-gray-300 rotate-180" />
            </button>

            <button onClick={() => setShowPinModal(true)} className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between group transition">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Database size={18}/></div>
                <div className="text-left"><p className="text-sm font-black text-gray-800 text-rose-600">Reset Periode</p><p className="text-[10px] text-gray-400 font-bold uppercase">Hapus transaksi (Kecuali Anggota)</p></div>
              </div>
              <ArrowLeft size={16} className="text-gray-300 rotate-180" />
            </button>

            <button onClick={handleLogout} className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between group transition mt-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 text-gray-600 rounded-xl"><LogOut size={18}/></div>
                <div className="text-left"><p className="text-sm font-black text-gray-800">Keluar Sistem</p><p className="text-[10px] text-gray-400 font-bold uppercase">Selesaikan sesi saat ini</p></div>
              </div>
              <ArrowLeft size={16} className="text-gray-300 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Common UI Layout for other pages
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl pb-20 relative overflow-x-hidden">
      {showModalSuccess && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModalSuccess(false)}></div>
          <div className="bg-white w-full max-w-[280px] rounded-[32px] p-8 relative z-10 animate-in zoom-in duration-300 text-center shadow-2xl">
            <div className={`w-20 h-20 bg-${themeColor}-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce`}><CheckCircle2 size={48} className={`text-${themeColor}-600`} /></div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Berhasil!</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Data baru telah berhasil disimpan.</p>
            <button onClick={() => setShowModalSuccess(false)} className={`w-full py-4 bg-${themeColor}-600 text-white font-bold rounded-2xl shadow-lg`}>Oke</button>
          </div>
        </div>
      )}

      {showRegModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowRegModal(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black text-gray-900">Registrasi Anggota</h3><button onClick={() => setShowRegModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
            <form onSubmit={handleSaveAnggota} className="space-y-4">
              <input type="text" value={formAnggotaNama} onChange={(e) => setFormAnggotaNama(e.target.value)} placeholder="Masukkan nama..." className="w-full p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">Simpan Anggota</button>
            </form>
          </div>
        </div>
      )}

      {showTimModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowTimModal(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black text-gray-900 text-teal-600">Tambah Tim Baru</h3><button onClick={() => setShowTimModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
            <form onSubmit={handleSaveTim} className="space-y-4">
              <input type="text" value={formTimNama} onChange={(e) => setFormTimNama(e.target.value)} placeholder="Contoh: Tim Macan" className="w-full p-4 bg-teal-50 rounded-2xl border border-teal-100 text-sm outline-none focus:ring-2 focus:ring-teal-500" required />
              <button type="submit" className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg">Simpan Tim</button>
            </form>
          </div>
        </div>
      )}

      {showArisanModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowArisanModal(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black text-gray-900 text-orange-600">Input Arisan Naik</h3><button onClick={() => setShowArisanModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
            <form onSubmit={handleSaveArisan} className="space-y-4">
              <CustomSelect label="Nama Penerima" placeholder="Pilih Nama" value={formArisanNama} onChange={setFormArisanNama} options={anggotaData.map(m => ({ value: m.nama, label: m.nama }))} />
              <CustomSelect label="Minggu Ke Berapa" placeholder="Pilih Minggu" value={formArisanMinggu} onChange={setFormArisanMinggu} options={[...Array(48)].map((_, i) => ({ value: (i + 1).toString(), label: `Minggu ${i + 1}` }))} />
              <button type="submit" className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg">Simpan Arisan</button>
            </form>
          </div>
        </div>
      )}

      {showJuaraModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowJuaraModal(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black text-gray-900 text-yellow-600">Input Juara Baru</h3><button onClick={() => setShowJuaraModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
            <form onSubmit={handleSaveJuara} className="space-y-4">
              <CustomSelect label="Pilih Tim" placeholder="Pilih Tim" value={formJuaraTim} onChange={setFormJuaraTim} options={timData.map(t => ({ value: t.nama, label: t.nama }))} />
              <CustomSelect label="Peringkat Juara" placeholder="Pilih Juara" value={formJuaraRank} onChange={setFormJuaraRank} options={[{ value: "1", label: "Juara 1" }, { value: "2", label: "Juara 2" }, { value: "3", label: "Juara 3" }, { value: "4", label: "Juara 4" }]} />
              <button type="submit" className="w-full py-4 bg-yellow-500 text-white font-bold rounded-2xl shadow-lg">Simpan Juara</button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setDeleteTarget(null)}></div>
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 relative z-10 animate-in zoom-in text-center shadow-2xl">
            <div className="bg-rose-100 p-4 rounded-full mb-4 inline-block"><AlertTriangle size={32} className="text-rose-600" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-500 mb-6 italic">"{deleteTarget.tim || deleteTarget.nama || deleteTarget.description || deleteTarget.keterangan}"</p>
            <div className="grid grid-cols-2 gap-3 w-full"><button onClick={() => setDeleteTarget(null)} className="py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Batal</button><button onClick={handleDeleteConfirm} className="py-3 bg-rose-600 text-white font-bold rounded-xl text-sm">Hapus</button></div>
          </div>
        </div>
      )}

      <div className={`bg-${themeColor}-600 p-6 text-white sticky top-0 z-[100] flex items-center gap-4 shadow-md`}>
        <button onClick={() => setActivePage('dashboard')} className="p-2 hover:bg-black/10 rounded-full transition"><ArrowLeft size={24} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{activePage === 'riwayat' ? 'Riwayat Transaksi' : activePage === 'anggota' ? 'Daftar Anggota' : activePage === 'tim' ? 'Daftar Tim' : activePage === 'arisan' ? 'Arisan Naik' : activePage === 'juara' ? 'Juara Umum' : activePage === 'rekap' ? 'Rekap Iuran' : activePage === 'iuran' ? 'Input Iuran' : 'Input Pengeluaran'}</h1>
          <p className="text-xs opacity-80">{activePage === 'rekap' ? 'Akumulasi setoran per anggota' : 'Kelola data Kotamu 125'}</p>
        </div>
        {(activePage === 'anggota' || activePage === 'arisan' || activePage === 'juara' || activePage === 'tim') && (
          <button onClick={() => {
            if(activePage === 'anggota') setShowRegModal(true);
            else if(activePage === 'tim') setShowTimModal(true);
            else if(activePage === 'arisan') setShowArisanModal(true);
            else setShowJuaraModal(true);
          }} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center active:scale-95"><Plus size={24} /></button>
        )}
      </div>

      {(activePage !== 'anggota' && activePage !== 'tim' && activePage !== 'arisan' && activePage !== 'juara') && (
        <div className="p-4">
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{activePage === 'rekap' ? 'Total Iuran Terkumpul' : `Total ${activePage === 'riwayat' ? 'Saldo Periode Ini' : 'Dana'}`}</p>
                 <p className={`text-3xl font-black text-${themeColor}-600 tracking-tight`}>{activePage === 'riwayat' ? formatRupiah(pageTotals.masuk - pageTotals.keluar) : activePage === 'rekap' ? formatRupiah(displayData.reduce((a,c)=>a+c.total, 0)) : formatRupiah(displayData.reduce((a,c)=>a+(c.amount||0), 0))}</p>
              </div>
              <button onClick={() => exportToPDF(activePage)} disabled={isExporting || displayData.length === 0} className={`p-4 rounded-2xl flex items-center gap-2 ${isExporting || displayData.length === 0 ? 'bg-gray-100 text-gray-400' : `bg-${themeColor}-50 text-${themeColor}-600`}`}><Download size={20} /><span className="text-xs font-black uppercase">PDF</span></button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 mb-6">
        { (activePage === 'anggota' || activePage === 'tim' || activePage === 'arisan' || activePage === 'juara' || activePage === 'rekap') ? (
          <div className="flex gap-2">
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 relative z-[90]">
                <Search size={18} className="text-gray-300" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Cari Nama ${activePage === 'juara' || activePage === 'tim' ? 'Tim' : 'Anggota'}...`} className="flex-1 bg-transparent text-sm outline-none font-medium" />
            </div>
            {(activePage === 'arisan' || activePage === 'juara') && (
              <button onClick={() => exportToPDF(activePage)} className={`bg-${themeColor}-50 text-${themeColor}-600 p-4 rounded-2xl border border-${themeColor}-100`}><Download size={20}/></button>
            )}
          </div>
        ) : activePage === 'riwayat' ? (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3 z-[90]">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 mb-1"><CalendarDays size={12}/> Pilih Periode Bulan</label>
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm outline-none font-bold text-gray-700" />
          </div>
        ) : (
          <form onSubmit={activePage === 'iuran' ? handleSaveIuran : handleSavePengeluaran} className="bg-white p-5 rounded-3xl shadow-sm space-y-4 border border-gray-100 z-[90]">
             {activePage === 'iuran' && (
              <>
                <CustomSelect label="Filter Minggu" placeholder="Pilih Minggu" value={formMinggu} onChange={setFormMinggu} options={[ {value: "", label: "Semua Minggu"}, ...[...Array(48)].map((_, i) => ({ value: (i + 1).toString(), label: `Minggu ${i + 1}` })) ]} />
                <input type="date" name="tanggal" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none mb-4" required defaultValue={new Date().toISOString().split('T')[0]} />
                <CustomSelect label="Pilih Anggota" placeholder="Nama Anggota" value={formNama} onChange={setFormNama} options={anggotaData.map(m => ({ value: m.nama, label: m.nama }))} />
                <input type="text" inputMode="numeric" placeholder="Jumlah Setoran (Rp)" value={formAmountDisplay} onChange={(e) => setFormAmountDisplay(formatNumberWithDots(e.target.value))} className="w-full p-3 bg-emerald-50 text-emerald-700 font-bold text-lg rounded-xl border border-emerald-100 outline-none" required />
              </>
            )}
            {activePage === 'pengeluaran' && (
              <>
                <input type="date" name="tanggal" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none mb-4" required defaultValue={new Date().toISOString().split('T')[0]} />
                <textarea value={formExpKeterangan} onChange={(e) => setFormExpKeterangan(e.target.value)} placeholder="Keterangan Pengeluaran" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm min-h-[80px] outline-none" required />
                <input type="text" inputMode="numeric" placeholder="Jumlah (Rp)" value={formExpAmountDisplay} onChange={(e) => setFormExpAmountDisplay(formatNumberWithDots(e.target.value))} className="w-full p-3 bg-rose-50 text-rose-700 font-bold text-lg rounded-xl border border-rose-100 outline-none" required />
              </>
            )}
            <button type="submit" className={`w-full bg-${themeColor}-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition`}>Simpan Data</button>
          </form>
        )}
      </div>

      <div className="px-4 pb-10">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 uppercase text-xs text-gray-500">{activePage === 'juara' ? <Trophy size={14} /> : activePage === 'rekap' ? <ClipboardList size={14} /> : activePage === 'tim' ? <ShieldCheck size={14} /> : <History size={14} />} {activePage === 'juara' ? 'Rekap Juara Tim' : activePage === 'rekap' ? 'Akumulasi Anggota' : activePage === 'tim' ? 'Kelola Tim' : 'Data Terarsip'}</span>
          <span className={`text-[10px] bg-${themeColor}-100 px-2 py-1 rounded text-${themeColor}-600 font-bold uppercase`}>{displayData.length} Baris</span>
        </h3>
        
        {activePage === 'juara' ? (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-yellow-50 text-yellow-800 font-black uppercase text-[10px]">
                  <tr><th className="p-4">No.</th><th className="p-4">Tim</th><th className="p-4 text-center">J1</th><th className="p-4 text-center">J2</th><th className="p-4 text-center">J3</th><th className="p-4 text-center">J4</th><th className="p-4 text-center font-bold">Total</th><th className="p-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayData.map((item, index) => (
                    <tr key={item.tim} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-400 font-bold">{index + 1}</td>
                      <td className="p-4 font-black text-gray-800">{item.tim}</td>
                      <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-bold">{item.j1}</span></td>
                      <td className="p-4 text-center text-gray-600 font-medium">{item.j2}</td>
                      <td className="p-4 text-center text-gray-600 font-medium">{item.j3}</td>
                      <td className="p-4 text-center text-gray-600 font-medium">{item.j4}</td>
                      <td className="p-4 text-center font-black text-yellow-600">{item.total}</td>
                      <td className="p-4 text-right"><button onClick={() => setDeleteTarget({ tim: item.tim, id: item.tim })} className="p-2 text-gray-200 hover:text-rose-500"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activePage === 'rekap' ? (
          <div className="space-y-4">
            {displayData.map((item, index) => (
              <div key={index} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-3 relative">
                <div className="flex justify-between items-start relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-xs">{index + 1}</div>
                    <div><h4 className="font-black text-gray-800 uppercase">{item.nama}</h4><p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Check size={10}/> Aktif Menabung</p></div>
                  </div>
                  <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase">Total Setor</p><p className="text-lg font-black text-slate-700">{formatRupiah(item.total)}</p></div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase">Minggu Dibayar:</span><p className="text-xs font-medium text-slate-600 italic">{item.minggu || 'Belum ada setoran'}</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayData.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activePage === 'arisan' ? 'bg-orange-50 text-orange-600' : (item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : (activePage === 'anggota' ? 'bg-indigo-50 text-indigo-600' : (activePage === 'tim' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600')))}`}>
                    {activePage === 'arisan' ? <Star size={20} /> : (item.type === 'income' ? <ArrowUpRight size={20} /> : (activePage === 'anggota' ? <UserSquare2 size={20} /> : (activePage === 'tim' ? <ShieldCheck size={20} /> : <ArrowDownRight size={20} />)))}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{activePage === 'anggota' || activePage === 'arisan' || activePage === 'tim' ? item.nama : (item.description || item.keterangan || item.nama)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{item.date || item.tanggal || item.joinDate || item.createdDate} {item.minggu && <span className={`ml-2 px-1 rounded ${activePage === 'arisan' ? 'text-orange-600 bg-orange-50' : 'text-emerald-500 bg-emerald-50'}`}>Minggu {item.minggu}</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-black ${item.type === 'income' ? 'text-emerald-600' : (item.type === 'expense' ? 'text-rose-600' : (activePage === 'arisan' ? 'text-orange-600' : (activePage === 'tim' ? 'text-teal-600' : 'text-indigo-600')))}`}>
                      {activePage === 'anggota' || activePage === 'tim' ? 'AKTIF' : (activePage === 'arisan' ? 'NAIK' : formatRupiah(item.amount))}
                    </p>
                  </div>
                  <button onClick={() => setDeleteTarget(item)} className="p-2 text-gray-200 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {displayData.length === 0 && <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-gray-50"><p className="text-sm font-bold text-gray-400 italic">Belum ada data ditemukan.</p></div>}
      </div>
    </div>
  );
};

export default App;