import React, { useState, useEffect } from 'react';
import complaintService from './services/complaintService';
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
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Play,
  RotateCcw
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
  // Navigation Role: 'STUDENT' or 'WARDEN'
  const [activePortal, setActivePortal] = useState('STUDENT');

  // Warden Display: 'KANBAN' or 'TABLE'
  const [wardenViewMode, setWardenViewMode] = useState('KANBAN');

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Student portal tracking state
  const [studentSearchRoll, setStudentSearchRoll] = useState('');

  // Warden portal filters
  const [wardenSearch, setWardenSearch] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');

  // Toast
  const [toast, setToast] = useState(null);

  // Student / General Form Data
  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    studentPhone: '',
    hostelBlock: 'Block A',
    roomNo: '',
    category: 'Electrical',
    priority: 'Medium',
    description: '',
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Warden Resolution & Staff Assign Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveItem, setResolveItem] = useState(null);
  const [assignedStaffInput, setAssignedStaffInput] = useState('');
  const [statusInput, setStatusInput] = useState('In Progress');
  const [remarksInput, setRemarksInput] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  // 1. CREATE: Student Submits New Complaint
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentName || !formData.rollNo || !formData.roomNo || !formData.description) {
      showToast('Please fill in all mandatory fields (*)', 'error');
      return;
    }

    try {
      const created = await complaintService.create(formData);
      showToast(`Complaint #${created.id} submitted! Status is Pending.`);
      setFormData({
        studentName: '',
        rollNo: '',
        studentPhone: '',
        hostelBlock: 'Block A',
        roomNo: '',
        category: 'Electrical',
        priority: 'Medium',
        description: '',
      });
      setStudentSearchRoll(formData.rollNo);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit complaint. Backend may be offline.', 'error');
    }
  };

  // 2. QUICK ACTION: Start Repair (Pending -> In Progress)
  const handleQuickStartRepair = async (comp) => {
    // If no staff assigned, default based on category
    let defaultStaff = STAFF_LIST[0];
    if (comp.category.includes('Plumbing')) defaultStaff = 'Suresh (Plumber)';
    else if (comp.category.includes('Wi-Fi')) defaultStaff = 'Vinay (Wi-Fi & IT)';
    else if (comp.category.includes('Cleaning')) defaultStaff = 'Sunitha (Housekeeping Supervisor)';
    else if (comp.category.includes('Furniture')) defaultStaff = 'Anand (Carpenter)';

    const staff = comp.assignedStaff || defaultStaff;

    try {
      await complaintService.assignStaff(comp.id, staff);
      await complaintService.updateStatus(comp.id, 'In Progress', 'Staff dispatched to inspect issue');
      showToast(`Task #${comp.id} is now IN PROGRESS! Assigned to ${staff}`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to start repair', 'error');
    }
  };

  // 3. QUICK ACTION: Open Solve Modal
  const handleOpenSolveModal = (comp) => {
    setResolveItem(comp);
    setAssignedStaffInput(comp.assignedStaff || STAFF_LIST[0]);
    setStatusInput('Resolved');
    setRemarksInput(comp.resolutionRemarks || 'Issue fixed and verified successfully.');
    setIsResolveModalOpen(true);
  };

  // 4. QUICK ACTION: Reopen Task
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

  // 5. UPDATE: Save Resolution from Modal
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

  // 6. DELETE: Delete Complaint
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

  // 7. Full Edit
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

  // Quick Seed Sample Data
  const handleSeedSamples = async () => {
    const samples = [
      {
        studentName: 'Rahul Sharma',
        rollNo: '21CS101',
        studentPhone: '9876543210',
        hostelBlock: 'Block A',
        roomNo: '204',
        category: 'Electrical',
        priority: 'High',
        description: 'Ceiling fan regulator broken and sparks on switch.',
        status: 'In Progress',
        assignedStaff: 'Ramesh (Electrician)',
        resolutionRemarks: 'Inspection done, new switchboard ordered.'
      },
      {
        studentName: 'Priya Patel',
        rollNo: '22IT045',
        studentPhone: '9123456780',
        hostelBlock: 'Girls Hostel',
        roomNo: '112',
        category: 'Plumbing & Water',
        priority: 'High',
        description: 'Washbasin pipe has major water leakage. Need urgent fix.',
        status: 'Pending',
        assignedStaff: null,
        resolutionRemarks: null
      },
      {
        studentName: 'Vikas Kumar',
        rollNo: '21ME088',
        studentPhone: '9988776655',
        hostelBlock: 'Block B',
        roomNo: '305',
        category: 'Wi-Fi & Internet',
        priority: 'Medium',
        description: 'Wi-Fi router in 3rd floor corridor has no internet signal.',
        status: 'Resolved',
        assignedStaff: 'Vinay (Wi-Fi & IT)',
        resolutionRemarks: 'Optical fiber patch cable re-spliced and tested OK.'
      }
    ];

    try {
      for (const s of samples) {
        await complaintService.create(s);
      }
      showToast('Sample hostel complaints loaded!');
      fetchData();
    } catch {
      showToast('Could not load samples', 'error');
    }
  };

  // Filtered list for student tracking
  const studentFilteredComplaints = complaints.filter(comp => {
    if (!studentSearchRoll.trim()) return true;
    const term = studentSearchRoll.toLowerCase();
    return comp.rollNo.toLowerCase().includes(term) ||
           comp.studentName.toLowerCase().includes(term) ||
           comp.roomNo.toLowerCase().includes(term);
  });

  // Filtered list for Warden / Staff
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

  // Split into Kanban columns
  const pendingTasks = wardenFilteredComplaints.filter(c => c.status === 'Pending');
  const inProgressTasks = wardenFilteredComplaints.filter(c => c.status === 'In Progress');
  const resolvedTasks = wardenFilteredComplaints.filter(c => c.status === 'Resolved');

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

      {/* Main Top Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={26} />
          </div>
          <div>
            <h1>Hostel Maintenance Management System</h1>
            <p>Smart Campus Maintenance Tracking (React + Spring Boot + MySQL)</p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`api-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className={`dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? 'Spring Boot Connected' : 'Connecting Backend...'}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh Data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          {complaints.length === 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleSeedSamples}>
              + Load Sample Data
            </button>
          )}
        </div>
      </header>

      {/* Dual Portal Switcher Tabs */}
      <div className="portal-switcher">
        <button 
          className={`portal-tab ${activePortal === 'STUDENT' ? 'active' : ''}`}
          onClick={() => setActivePortal('STUDENT')}
        >
          <GraduationCap size={20} />
          🎓 Student Portal (Raise & Track Issues)
        </button>

        <button 
          className={`portal-tab ${activePortal === 'WARDEN' ? 'active warden' : ''}`}
          onClick={() => setActivePortal('WARDEN')}
        >
          <ShieldCheck size={20} />
          🔑 Warden & Staff Desk (View Tasks & Update Status: Pending ➔ In Progress ➔ Resolved)
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. STUDENT PORTAL VIEW                                   */}
      {/* ======================================================== */}
      {activePortal === 'STUDENT' && (
        <div className="student-layout">
          {/* Left Column: Complaint Submission Form */}
          <div className="card">
            <div className="card-title">
              <Send size={20} color="#4f46e5" />
              <span>Raise Maintenance Complaint</span>
            </div>

            <form onSubmit={handleStudentSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Student Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rahul Sharma"
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Roll Number / ID *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 24EG104D49"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="e.g. 9876543210"
                    value={formData.studentPhone}
                    onChange={(e) => setFormData({...formData, studentPhone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Hostel Block *</label>
                  <select 
                    className="form-control"
                    value={formData.hostelBlock}
                    onChange={(e) => setFormData({...formData, hostelBlock: e.target.value})}
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
                    value={formData.roomNo}
                    onChange={(e) => setFormData({...formData, roomNo: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Problem Category *</label>
                  <select 
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Priority Level</label>
                  <select 
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="Low">Low (Can wait 2-3 days)</option>
                    <option value="Medium">Medium (Fix within 24 hours)</option>
                    <option value="High">High (Immediate / Urgent repair needed)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Detailed Issue Description *</label>
                  <textarea 
                    rows="3" 
                    className="form-control" 
                    placeholder="Describe the issue clearly (e.g. fan is not running, tap is leaking, wi-fi router not working)..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                <Send size={16} />
                Submit Complaint to Hostel Office
              </button>
            </form>
          </div>

          {/* Right Column: Track My Complaints with Live Progress Bar */}
          <div className="card">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#4f46e5" />
                <span>Track Issues & Solution Status</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {studentFilteredComplaints.length} Complaints
              </span>
            </div>

            {/* Search Input */}
            <div className="search-box" style={{ maxWidth: '100%', marginBottom: '16px' }}>
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by Roll No (e.g. 24eg104d49), Name, or Room..."
                value={studentSearchRoll}
                onChange={(e) => setStudentSearchRoll(e.target.value)}
              />
              {studentSearchRoll && (
                <button 
                  onClick={() => setStudentSearchRoll('')} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {studentFilteredComplaints.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={36} color="#94a3b8" />
                <h4>No Requests Found</h4>
                <p>Fill out the form on the left to submit a maintenance complaint.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '4px' }}>
                {studentFilteredComplaints.map(comp => (
                  <div key={comp.id} className="timeline-item">
                    <div className="timeline-header">
                      <div>
                        <span style={{ fontWeight: 800, color: '#4f46e5', marginRight: '6px' }}>
                          #{comp.id}
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{comp.category}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                          ({comp.hostelBlock} - Room {comp.roomNo})
                        </span>
                      </div>
                      <span className={`badge badge-${comp.status.toLowerCase().replace(' ', '-')}`}>
                        {comp.status === 'Resolved' ? '✅ SOLVED' : comp.status === 'In Progress' ? '⏳ WORKING' : '🔴 PENDING'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: '#334155', margin: '4px 0 10px 0' }}>
                      {comp.description}
                    </p>

                    {/* Visual 3-Stage Progress Timeline */}
                    <div className="timeline-steps">
                      <div className="timeline-progress-line" />
                      
                      {/* Step 1: Raised */}
                      <div className="timeline-step">
                        <div className="step-circle active">✓</div>
                        <span>1. Raised</span>
                      </div>

                      {/* Step 2: In Progress / Assigned */}
                      <div className="timeline-step">
                        <div className={`step-circle ${comp.status === 'In Progress' || comp.status === 'Resolved' ? 'active' : ''}`}>
                          {comp.status === 'In Progress' || comp.status === 'Resolved' ? '✓' : '2'}
                        </div>
                        <span>2. Assigned</span>
                      </div>

                      {/* Step 3: Resolved */}
                      <div className="timeline-step">
                        <div className={`step-circle ${comp.status === 'Resolved' ? 'resolved' : ''}`}>
                          {comp.status === 'Resolved' ? '✓' : '3'}
                        </div>
                        <span>3. Resolved</span>
                      </div>
                    </div>

                    {/* Assigned Technician Info */}
                    {comp.assignedStaff && (
                      <div className="staff-assigned-box">
                        <Wrench size={15} />
                        <span><strong>Assigned Staff:</strong> {comp.assignedStaff}</span>
                      </div>
                    )}

                    {/* Resolution Remark from Warden/Staff */}
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
      {/* 2. WARDEN & MAINTENANCE STAFF TASK BOARD                 */}
      {/* ======================================================== */}
      {activePortal === 'WARDEN' && (
        <div>
          {/* Top KPI Stats Bar */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <p>Total Tasks</p>
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
                placeholder="Search task, student, room, block, or problem..."
                value={wardenSearch}
                onChange={(e) => setWardenSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              {/* Staff Member Filter */}
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

              {/* View Switcher: Task Board (Kanban) vs Table */}
              <div className="view-mode-toggle">
                <button 
                  className={`view-mode-btn ${wardenViewMode === 'KANBAN' ? 'active' : ''}`}
                  onClick={() => setWardenViewMode('KANBAN')}
                >
                  <LayoutGrid size={15} />
                  Task Board (Columns)
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

          {/* ---------------------------------------------------- */}
          {/* VIEW OPTION A: KANBAN TASK BOARD (DEFAULT)          */}
          {/* ---------------------------------------------------- */}
          {wardenViewMode === 'KANBAN' && (
            <div className="kanban-board">
              {/* COLUMN 1: PENDING TASKS */}
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

                        {/* Action: Start Work / Assign Technician */}
                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-start-work"
                            onClick={() => handleQuickStartRepair(comp)}
                            title="Assign technician and mark In Progress"
                          >
                            <Play size={14} />
                            Start Repair ➔
                          </button>
                          <button 
                            className="btn-icon"
                            onClick={() => handleOpenSolveModal(comp)}
                            title="Assign specific staff"
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

              {/* COLUMN 2: IN PROGRESS TASKS */}
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
                            {comp.assignedStaff || 'Technician Assigned'}
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

                        {/* Action: Mark as Solved / Resolved */}
                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-mark-solved"
                            onClick={() => handleOpenSolveModal(comp)}
                            title="Mark issue as solved and add work note"
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

              {/* COLUMN 3: RESOLVED TASKS */}
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

                        {/* Work Done Note */}
                        {comp.resolutionRemarks ? (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: '#166534', margin: '8px 0' }}>
                            <strong>Solution Note:</strong> {comp.resolutionRemarks}
                          </div>
                        ) : (
                          <p className="card-issue-text">{comp.description}</p>
                        )}

                        {comp.assignedStaff && (
                          <div style={{ fontSize: '0.76rem', color: '#6d28d9', fontWeight: 600 }}>
                            Solved by: {comp.assignedStaff}
                          </div>
                        )}

                        {/* Reopen or Delete Actions */}
                        <div className="card-actions-row">
                          <button 
                            className="card-action-btn btn-reopen"
                            onClick={() => handleReopenTask(comp.id)}
                            title="Reopen if student reports problem again"
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

          {/* ---------------------------------------------------- */}
          {/* VIEW OPTION B: TABLE VIEW                            */}
          {/* ---------------------------------------------------- */}
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
                    {wardenFilteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan="8">
                          <div className="empty-state">
                            <AlertCircle size={36} color="#94a3b8" />
                            <h4>No Complaints Found</h4>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      wardenFilteredComplaints.map(comp => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. WARDEN RESOLUTION & STAFF ASSIGN MODAL                */}
      {/* ======================================================== */}
      {isResolveModalOpen && resolveItem && (
        <div className="modal-overlay" onClick={() => setIsResolveModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                🔧 Solve Task: Complaint #{resolveItem.id}
              </h3>
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
                    placeholder="Describe what repair was done (e.g. 'Ceiling fan capacitor replaced and regulator rewired by Ramesh', 'Tap leakage fixed by replacing washer')..."
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

      {/* ======================================================== */}
      {/* 4. GENERAL EDIT COMPLAINT DETAILS MODAL                   */}
      {/* ======================================================== */}
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
