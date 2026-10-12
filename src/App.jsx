import React, { useState, useEffect } from 'react';
import complaintService from './services/complaintService';
import authService from './services/authService';
import { 
  Building2, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Layers, 
  Check, 
  X,
  UserCheck,
  Wrench,
  GraduationCap,
  ShieldCheck,
  Send,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  Play,
  RotateCcw,
  LogIn,
  UserPlus,
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  FileText
} from 'lucide-react';

const CATEGORIES = [
  'Electrical',
  'Plumbing & Water',
  'Wi-Fi & Internet',
  'Room Cleaning',
  'Furniture & Carpentry',
  'Air Conditioning',
  'Other Facilities'
];

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'PG Hostel', 'Girls Hostel'];

const STAFF_LIST = [
  'Ramesh (Electrician)',
  'Suresh (Plumber)',
  'Anand (Carpenter)',
  'Vinay (Wi-Fi & IT)',
  'Sunitha (Housekeeping Supervisor)',
  'Rajesh (General Maintenance)'
];

function App() {
  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  
  // Auth Form State (Login / Register)
  const [authTab, setAuthTab] = useState('LOGIN');
  const [authRole, setAuthRole] = useState('STUDENT');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    rollNo: '',
    hostelBlock: 'Block A',
    roomNo: '',
    phone: ''
  });
  const [authError, setAuthError] = useState('');

  // General App State
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  // Warden controls
  const [wardenViewMode, setWardenViewMode] = useState('KANBAN');
  const [wardenSearch, setWardenSearch] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');

  // Student complaint form input (Category, Priority, Description)
  const [category, setCategory] = useState('Electrical');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  // Modals for Warden
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveItem, setResolveItem] = useState(null);
  const [assignedStaffInput, setAssignedStaffInput] = useState('');
  const [statusInput, setStatusInput] = useState('In Progress');
  const [remarksInput, setRemarksInput] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Complaints from Spring Boot
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getAll();
      setComplaints(data);
      setConnected(true);

      try {
        const statsData = await complaintService.getStats();
        setStats(statsData);
      } catch {
        const total = data.length;
        const pending = data.filter(c => c.status === 'Pending').length;
        const inProgress = data.filter(c => c.status === 'In Progress').length;
        const resolved = data.filter(c => c.status === 'Resolved').length;
        setStats({ total, pending, inProgress, resolved });
      }
    } catch (err) {
      console.error(err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, []);

  // ----------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const user = await authService.login(loginForm.email, loginForm.password);
      setCurrentUser(user);
      showToast(`Welcome, ${user.name}!`);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      setAuthError(msg);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const payload = {
        ...registerForm,
        role: authRole
      };
      const user = await authService.register(payload);
      setCurrentUser(user);
      showToast(`Account created! Welcome, ${user.name}`);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      setAuthError(msg);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Logged out.');
  };

  // Fast Demo Logins for Viva
  const handleQuickDemoLogin = (role) => {
    if (role === 'STUDENT') {
      const demoStudent = {
        name: 'Amrutha',
        email: 'amrutha@hostel.edu',
        role: 'STUDENT',
        rollNo: '24EG104D49',
        hostelBlock: 'Block C',
        roomNo: '303',
        phone: '9876543210'
      };
      localStorage.setItem('hostel_user', JSON.stringify(demoStudent));
      setCurrentUser(demoStudent);
      showToast('Logged in as Student: Amrutha');
    } else {
      const demoWarden = {
        name: 'Warden Sharma',
        email: 'warden@hostel.edu',
        role: 'WARDEN'
      };
      localStorage.setItem('hostel_user', JSON.stringify(demoWarden));
      setCurrentUser(demoWarden);
      showToast('Logged in as Hostel Warden');
    }
  };

  // ----------------------------------------------------------------
  // STUDENT ACTIONS (Raise & Track only)
  // ----------------------------------------------------------------
  const handleStudentRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please describe the maintenance issue.', 'error');
      return;
    }

    const payload = {
      studentName: currentUser.name,
      rollNo: currentUser.rollNo || 'N/A',
      studentEmail: currentUser.email,
      studentPhone: currentUser.phone || '',
      hostelBlock: currentUser.hostelBlock || 'Block A',
      roomNo: currentUser.roomNo || 'N/A',
      category: category,
      priority: priority,
      description: description.trim(),
      status: 'Pending'
    };

    try {
      const created = await complaintService.create(payload);
      showToast(`Complaint #${created.id} submitted! Status: Pending.`);
      setDescription('');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit complaint.', 'error');
    }
  };

  // Student sees ONLY their own complaints
  const myComplaints = complaints.filter(c => {
    if (!currentUser) return false;
    const matchEmail = c.studentEmail && c.studentEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchRoll = currentUser.rollNo && c.rollNo && c.rollNo.toLowerCase() === currentUser.rollNo.toLowerCase();
    const matchName = currentUser.name && c.studentName && c.studentName.toLowerCase() === currentUser.name.toLowerCase();
    return matchEmail || matchRoll || matchName;
  });

  // ----------------------------------------------------------------
  // WARDEN ACTIONS (View all & Update status only)
  // ----------------------------------------------------------------
  const handleQuickStartRepair = async (comp) => {
    let defaultStaff = STAFF_LIST[0];
    if (comp.category.includes('Plumbing')) defaultStaff = 'Suresh (Plumber)';
    else if (comp.category.includes('Wi-Fi')) defaultStaff = 'Vinay (Wi-Fi & IT)';
    else if (comp.category.includes('Cleaning')) defaultStaff = 'Sunitha (Housekeeping Supervisor)';
    else if (comp.category.includes('Furniture')) defaultStaff = 'Anand (Carpenter)';

    const staff = comp.assignedStaff || defaultStaff;

    try {
      await complaintService.assignStaff(comp.id, staff);
      await complaintService.updateStatus(comp.id, 'In Progress', 'Staff dispatched to inspect issue');
      showToast(`Complaint #${comp.id} moved to IN PROGRESS! Assigned to ${staff}`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleOpenSolveModal = (comp) => {
    setResolveItem(comp);
    setAssignedStaffInput(comp.assignedStaff || STAFF_LIST[0]);
    setStatusInput('Resolved');
    setRemarksInput(comp.resolutionRemarks || 'Issue inspected, repaired and verified.');
    setIsResolveModalOpen(true);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!resolveItem) return;

    try {
      if (assignedStaffInput) {
        await complaintService.assignStaff(resolveItem.id, assignedStaffInput);
      }
      await complaintService.updateStatus(resolveItem.id, statusInput, remarksInput);

      showToast(`Complaint #${resolveItem.id} marked as "${statusInput.toUpperCase()}"!`);
      setIsResolveModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error saving resolution', 'error');
    }
  };

  const handleReopenTask = async (id) => {
    try {
      await complaintService.updateStatus(id, 'In Progress', 'Task reopened for further check');
      showToast(`Complaint #${id} reopened to In Progress`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to reopen task', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Complaint #${id}?`)) return;
    try {
      await complaintService.delete(id);
      showToast(`Complaint #${id} deleted.`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete complaint.', 'error');
    }
  };

  const handleOpenEdit = (comp) => {
    setEditItem({ ...comp });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await complaintService.update(editItem.id, editItem);
      showToast(`Complaint #${editItem.id} details saved!`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update details.', 'error');
    }
  };

  // Warden Filtered List
  const wardenFilteredComplaints = complaints.filter(comp => {
    const matchesStaff = selectedStaffFilter === 'ALL' || 
      (comp.assignedStaff && comp.assignedStaff.includes(selectedStaffFilter));
    const term = wardenSearch.toLowerCase();
    const matchesSearch = 
      comp.studentName.toLowerCase().includes(term) ||
      comp.rollNo.toLowerCase().includes(term) ||
      comp.roomNo.toLowerCase().includes(term) ||
      comp.hostelBlock.toLowerCase().includes(term) ||
      comp.category.toLowerCase().includes(term) ||
      (comp.assignedStaff && comp.assignedStaff.toLowerCase().includes(term));
    return matchesStaff && matchesSearch;
  });

  const pendingTasks = wardenFilteredComplaints.filter(c => c.status === 'Pending');
  const inProgressTasks = wardenFilteredComplaints.filter(c => c.status === 'In Progress');
  const resolvedTasks = wardenFilteredComplaints.filter(c => c.status === 'Resolved');

  // ================================================================
  // 1. SCREEN: LOGIN / REGISTER (IF NOT AUTHENTICATED)
  // ================================================================
  if (!currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Building2 size={30} />
            </div>
            <h2>Hostel Maintenance System</h2>
            <p>Please login or register to continue</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${authTab === 'LOGIN' ? 'active' : ''}`}
              onClick={() => { setAuthTab('LOGIN'); setAuthError(''); }}
            >
              <LogIn size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${authTab === 'REGISTER' ? 'active' : ''}`}
              onClick={() => { setAuthTab('REGISTER'); setAuthError(''); }}
            >
              <UserPlus size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Create Account
            </button>
          </div>

          <div className="auth-body">
            {authError && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB A: LOGIN */}
            {authTab === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="e.g. amrutha@hostel.edu"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  <LogIn size={16} />
                  Sign In
                </button>

                {/* Quick Demo Access */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                    QUICK DEMO ACCESS (FOR DEMO/VIVA)
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => handleQuickDemoLogin('STUDENT')}
                    >
                      🎓 Student Demo
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => handleQuickDemoLogin('WARDEN')}
                    >
                      🔑 Warden Demo
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB B: REGISTER */}
            {authTab === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit}>
                <div className="role-pill-group">
                  <button
                    type="button"
                    className={`role-pill ${authRole === 'STUDENT' ? 'active' : ''}`}
                    onClick={() => setAuthRole('STUDENT')}
                  >
                    <GraduationCap size={16} />
                    Register as Student
                  </button>
                  <button
                    type="button"
                    className={`role-pill ${authRole === 'WARDEN' ? 'active warden' : ''}`}
                    onClick={() => setAuthRole('WARDEN')}
                  >
                    <ShieldCheck size={16} />
                    Register as Warden
                  </button>
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Amrutha"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address * (Unique)</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="e.g. amrutha@hostel.edu"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Create Password *</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>

                {authRole === 'STUDENT' && (
                  <>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Roll Number *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. 24EG104D49"
                          value={registerForm.rollNo}
                          onChange={(e) => setRegisterForm({ ...registerForm, rollNo: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="9876543210"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Hostel Block *</label>
                        <select 
                          className="form-control"
                          value={registerForm.hostelBlock}
                          onChange={(e) => setRegisterForm({ ...registerForm, hostelBlock: e.target.value })}
                        >
                          {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Room Number *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. 303"
                          value={registerForm.roomNo}
                          onChange={(e) => setRegisterForm({ ...registerForm, roomNo: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  <UserPlus size={16} />
                  Complete Registration
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // 2. SCREEN: LOGGED IN APPLICATION (STRICTLY ROLE-BASED)
  // ================================================================
  const isStudent = currentUser.role === 'STUDENT';

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          {toast.message}
        </div>
      )}

      {/* Top Navbar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={24} />
          </div>
          <div>
            <h1>Hostel Maintenance Management System</h1>
            <p>
              {isStudent 
                ? '🎓 Student Portal — Raise & Track Your Maintenance Issues'
                : '🛡️ Warden & Maintenance Authority Desk — Manage & Solve Complaints'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* User Badge */}
          <div className="user-badge">
            {isStudent ? <GraduationCap size={16} color="#4f46e5" /> : <ShieldCheck size={16} color="#d97706" />}
            <span>
              <strong>{currentUser.name}</strong>
              <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '6px' }}>
                ({isStudent ? `Student • Room ${currentUser.roomNo}, ${currentUser.hostelBlock}` : 'Warden / Staff'})
              </span>
            </span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* A. STRICT STUDENT VIEW: ONLY RAISE & TRACK STATUS         */}
      {/* ======================================================== */}
      {isStudent && (
        <div className="student-layout">
          {/* Left Column: Raise Maintenance Request */}
          <div className="card">
            <div className="card-title">
              <Send size={18} color="#4f46e5" />
              <span>Raise Maintenance Complaint</span>
            </div>

            {/* Read-Only Student Info Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.84rem'
            }}>
              <div><strong>Student Name:</strong> {currentUser.name} ({currentUser.rollNo})</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>
                <strong>Assigned Room:</strong> {currentUser.hostelBlock} • Room #{currentUser.roomNo}
              </div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>
                <strong>Registered Email:</strong> {currentUser.email}
              </div>
            </div>

            <form onSubmit={handleStudentRaiseComplaint}>
              <div className="form-group">
                <label>Problem Category *</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select 
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low (Can wait 2-3 days)</option>
                  <option value="Medium">Medium (Fix within 24 hours)</option>
                  <option value="High">High (Immediate / Urgent repair needed)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Detailed Issue Description *</label>
                <textarea 
                  rows="4" 
                  className="form-control" 
                  placeholder="Describe your room maintenance issue clearly (e.g. tube light is flickering, tap is leaking, fan not working)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                <Send size={15} />
                Submit Complaint to Hostel Office
              </button>
            </form>
          </div>

          {/* Right Column: Track My Complaints (Student can ONLY see their own) */}
          <div className="card">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#4f46e5" />
                <span>My Complaints & Solution Status</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {myComplaints.length} Submitted
              </span>
            </div>

            {myComplaints.length === 0 ? (
              <div className="empty-state">
                <FileText size={38} color="#94a3b8" />
                <h4>No Complaints Raised Yet</h4>
                <p>Fill out the form on the left to submit your first maintenance request.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
                {myComplaints.map(comp => (
                  <div key={comp.id} className="timeline-item">
                    <div className="timeline-header">
                      <div>
                        <span style={{ fontWeight: 800, color: '#4f46e5', marginRight: '6px' }}>
                          #{comp.id}
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{comp.category}</strong>
                      </div>
                      <span className={`badge badge-${comp.status.toLowerCase().replace(' ', '-')}`}>
                        {comp.status === 'Resolved' ? '✅ SOLVED' : comp.status === 'In Progress' ? '⏳ WORKING' : '🔴 PENDING'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#334155', margin: '4px 0 10px 0' }}>
                      {comp.description}
                    </p>

                    {/* 3-Stage Progress Timeline */}
                    <div className="timeline-steps">
                      <div className="timeline-progress-line" />
                      
                      <div className="timeline-step">
                        <div className="step-circle active">✓</div>
                        <span>1. Raised</span>
                      </div>

                      <div className="timeline-step">
                        <div className={`step-circle ${comp.status === 'In Progress' || comp.status === 'Resolved' ? 'active' : ''}`}>
                          {comp.status === 'In Progress' || comp.status === 'Resolved' ? '✓' : '2'}
                        </div>
                        <span>2. Assigned</span>
                      </div>

                      <div className="timeline-step">
                        <div className={`step-circle ${comp.status === 'Resolved' ? 'resolved' : ''}`}>
                          {comp.status === 'Resolved' ? '✓' : '3'}
                        </div>
                        <span>3. Resolved</span>
                      </div>
                    </div>

                    {/* Staff Assigned Details */}
                    {comp.assignedStaff && (
                      <div className="staff-assigned-box">
                        <Wrench size={14} />
                        <span><strong>Assigned Staff:</strong> {comp.assignedStaff}</span>
                      </div>
                    )}

                    {/* Solution Remarks from Warden/Staff */}
                    {comp.status === 'Resolved' && comp.resolutionRemarks && (
                      <div className="resolution-box">
                        <CheckCircle2 size={16} />
                        <div>
                          <strong>Problem Solved!</strong>
                          <div style={{ marginTop: '2px' }}>{comp.resolutionRemarks}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* B. STRICT WARDEN VIEW: VIEW ALL & UPDATE STATUS ONLY     */}
      {/* ======================================================== */}
      {!isStudent && (
        <div>
          {/* KPI Stats Bar */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <p>Total Complaints</p>
                <h3>{stats.total}</h3>
              </div>
              <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <Layers size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>Pending Action</p>
                <h3>{stats.pending}</h3>
              </div>
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <AlertCircle size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>Active Work (In Progress)</p>
                <h3>{stats.inProgress}</h3>
              </div>
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Wrench size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>Solved & Verified</p>
                <h3>{stats.resolved}</h3>
              </div>
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          {/* Warden Controls Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search student, roll no, room, or issue..."
                value={wardenSearch}
                onChange={(e) => setWardenSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select 
                className="staff-select-filter"
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
              >
                <option value="ALL">👷 All Staff Tasks</option>
                {STAFF_LIST.map(st => (
                  <option key={st} value={st.split(' ')[0]}>{st}</option>
                ))}
              </select>

              <div className="view-mode-toggle">
                <button 
                  className={`view-mode-btn ${wardenViewMode === 'KANBAN' ? 'active' : ''}`}
                  onClick={() => setWardenViewMode('KANBAN')}
                >
                  <LayoutGrid size={15} />
                  Task Board
                </button>
                <button 
                  className={`view-mode-btn ${wardenViewMode === 'TABLE' ? 'active' : ''}`}
                  onClick={() => setWardenViewMode('TABLE')}
                >
                  <TableIcon size={15} />
                  Table View
                </button>
              </div>
            </div>
          </div>

          {/* 3-COLUMN KANBAN TASK BOARD */}
          {wardenViewMode === 'KANBAN' && (
            <div className="kanban-board">
              {/* 1. PENDING */}
              <div className="kanban-column pending-col">
                <div className="kanban-col-header">
                  <h4>
                    <AlertCircle size={18} color="#dc2626" />
                    1. Pending Review
                  </h4>
                  <span className="kanban-count-pill count-pending">
                    {pendingTasks.length} New
                  </span>
                </div>

                <div className="kanban-card-list">
                  {pendingTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>No pending complaints 🎉</p>
                    </div>
                  ) : (
                    pendingTasks.map(comp => (
                      <div key={comp.id} className="kanban-task-card">
                        <div className="card-top-row">
                          <span className="card-task-id">#{comp.id}</span>
                          <span className={`badge badge-priority priority-${comp.priority.toLowerCase()}`}>
                            {comp.priority}
                          </span>
                        </div>

                        <div className="card-student-details">
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {comp.studentName} ({comp.rollNo})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {comp.hostelBlock} • Room {comp.roomNo}
                          </div>
                          {comp.studentPhone && (
                            <div style={{ fontSize: '0.75rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                              <Phone size={11} /> {comp.studentPhone}
                            </div>
                          )}
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '4px' }}>
                          Category: {comp.category}
                        </div>
                        <p className="card-issue-text">{comp.description}</p>

                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-start-work"
                            onClick={() => handleQuickStartRepair(comp)}
                          >
                            <Play size={14} />
                            Start Repair ➔
                          </button>
                          <button 
                            className="btn-icon"
                            onClick={() => handleOpenSolveModal(comp)}
                            title="Assign staff & update"
                          >
                            <Wrench size={14} />
                          </button>
                          <button 
                            className="btn-icon delete"
                            onClick={() => handleDelete(comp.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. IN PROGRESS */}
              <div className="kanban-column progress-col">
                <div className="kanban-col-header">
                  <h4>
                    <Wrench size={18} color="#d97706" />
                    2. In Progress (Active Repair)
                  </h4>
                  <span className="kanban-count-pill count-progress">
                    {inProgressTasks.length} Working
                  </span>
                </div>

                <div className="kanban-card-list">
                  {inProgressTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>No active repair jobs</p>
                    </div>
                  ) : (
                    inProgressTasks.map(comp => (
                      <div key={comp.id} className="kanban-task-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div className="card-top-row">
                          <span className="card-task-id">#{comp.id}</span>
                          <span className="badge-staff">
                            {comp.assignedStaff || 'Technician Working'}
                          </span>
                        </div>

                        <div className="card-student-details">
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {comp.studentName} ({comp.rollNo})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {comp.hostelBlock} • Room {comp.roomNo}
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '4px' }}>
                          Issue: {comp.category}
                        </div>
                        <p className="card-issue-text">{comp.description}</p>

                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-mark-solved"
                            onClick={() => handleOpenSolveModal(comp)}
                          >
                            <CheckCircle2 size={14} />
                            Mark Issue as Solved ✅
                          </button>
                          <button 
                            className="btn-icon delete"
                            onClick={() => handleDelete(comp.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. RESOLVED */}
              <div className="kanban-column resolved-col">
                <div className="kanban-col-header">
                  <h4>
                    <CheckCircle2 size={18} color="#16a34a" />
                    3. Solved & Completed
                  </h4>
                  <span className="kanban-count-pill count-resolved">
                    {resolvedTasks.length} Solved
                  </span>
                </div>

                <div className="kanban-card-list">
                  {resolvedTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>No resolved tasks yet</p>
                    </div>
                  ) : (
                    resolvedTasks.map(comp => (
                      <div key={comp.id} className="kanban-task-card" style={{ borderLeft: '4px solid #22c55e', background: '#fcfdfc' }}>
                        <div className="card-top-row">
                          <span className="card-task-id">#{comp.id}</span>
                          <span className="badge badge-resolved">
                            ✓ FIXED
                          </span>
                        </div>

                        <div className="card-student-details">
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {comp.studentName} ({comp.rollNo})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {comp.hostelBlock} • Room {comp.roomNo}
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                          Category: {comp.category}
                        </div>

                        {comp.resolutionRemarks && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: '#166534', margin: '8px 0' }}>
                            <strong>Solution Note:</strong> {comp.resolutionRemarks}
                          </div>
                        )}

                        {comp.assignedStaff && (
                          <div style={{ fontSize: '0.76rem', color: '#6d28d9', fontWeight: 600 }}>
                            Solved by: {comp.assignedStaff}
                          </div>
                        )}

                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-reopen"
                            onClick={() => handleReopenTask(comp.id)}
                          >
                            <RotateCcw size={13} />
                            Reopen
                          </button>
                          <button 
                            className="btn-icon delete"
                            onClick={() => handleDelete(comp.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TABLE VIEW */}
          {wardenViewMode === 'TABLE' && (
            <div className="table-card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student Info</th>
                      <th>Hostel & Room</th>
                      <th>Category & Problem</th>
                      <th>Priority</th>
                      <th>Assigned Staff</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardenFilteredComplaints.map(comp => (
                      <tr key={comp.id}>
                        <td><strong>#{comp.id}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{comp.studentName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{comp.rollNo}</div>
                        </td>
                        <td>
                          <div>{comp.hostelBlock}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Room #{comp.roomNo}</div>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <div style={{ fontWeight: 600 }}>{comp.category}</div>
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>{comp.description}</div>
                        </td>
                        <td>
                          <span className={`badge badge-priority priority-${comp.priority.toLowerCase()}`}>
                            {comp.priority}
                          </span>
                        </td>
                        <td>
                          {comp.assignedStaff ? (
                            <span className="badge-staff">{comp.assignedStaff}</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${comp.status.toLowerCase().replace(' ', '-')}`}>
                            {comp.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-icon resolve"
                              onClick={() => handleOpenSolveModal(comp)}
                              title="Update Status & Remarks"
                            >
                              <Wrench size={14} />
                              Solve
                            </button>
                            <button 
                              className="btn-icon"
                              onClick={() => handleOpenEdit(comp)}
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className="btn-icon delete"
                              onClick={() => handleDelete(comp.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESOLUTION MODAL FOR WARDEN */}
      {isResolveModalOpen && resolveItem && (
        <div className="modal-overlay" onClick={() => setIsResolveModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔧 Solve Task: Complaint #{resolveItem.id}</h3>
              <button className="btn-close" onClick={() => setIsResolveModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResolution}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {resolveItem.studentName} ({resolveItem.rollNo}) - Room {resolveItem.roomNo}, {resolveItem.hostelBlock}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                    <strong>Problem:</strong> {resolveItem.description}
                  </div>
                </div>

                <div className="form-group">
                  <label>Assign Maintenance Staff / Technician *</label>
                  <select 
                    className="form-control"
                    value={assignedStaffInput}
                    onChange={(e) => setAssignedStaffInput(e.target.value)}
                  >
                    {STAFF_LIST.map(st => <option key={st} value={st}>{st}</option>)}
                    <option value="Hostel Caretaker">Hostel Caretaker</option>
                    <option value="External Vendor">External Vendor / Specialist</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Update Status to *</label>
                  <select 
                    className="form-control"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                  >
                    <option value="Pending">🔴 Pending (Needs Action)</option>
                    <option value="In Progress">🟡 In Progress (Technician Working)</option>
                    <option value="Resolved">🟢 Resolved (Work Complete & Fixed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Done Note / Resolution Remarks *</label>
                  <textarea 
                    rows="3" 
                    className="form-control" 
                    placeholder="Describe what repair was done..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsResolveModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} />
                  Confirm Status & Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL FOR WARDEN */}
      {isEditModalOpen && editItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Complaint #{editItem.id}</h3>
              <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Student Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.studentName}
                      onChange={(e) => setEditItem({...editItem, studentName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Roll Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.rollNo}
                      onChange={(e) => setEditItem({...editItem, rollNo: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Hostel Block</label>
                    <select 
                      className="form-control"
                      value={editItem.hostelBlock}
                      onChange={(e) => setEditItem({...editItem, hostelBlock: e.target.value})}
                    >
                      {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Room Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editItem.roomNo}
                      onChange={(e) => setEditItem({...editItem, roomNo: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      className="form-control"
                      value={editItem.category}
                      onChange={(e) => setEditItem({...editItem, category: e.target.value})}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select 
                      className="form-control"
                      value={editItem.priority}
                      onChange={(e) => setEditItem({...editItem, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea 
                      rows="3" 
                      className="form-control" 
                      value={editItem.description}
                      onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
