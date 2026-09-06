import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import "../styles/InterviewSchedulePage.css";
import { sendInterviewEmail, sendRescheduleEmail  } from '../services/emailService';
import { CalendarMarkBlueIcon } from "../components/icons/CustomIcons";
import calendarminimalLogo from '../assets/calendar-minimal-icon.png';
import mailblackLogo from '../assets/mail-black-icon.png';
import calendarplumpLogo from '../assets/calendar-plump-icon.png';
import locationplumpLogo from '../assets/location-plump-icon.png';
import noteplumpLogo from '../assets/note-plump-icon.png';
import phoneLogo from '../assets/phone-icon.png';
import Loader from "../components/Loader";
import {  StatusIcon, AlarmClockIcon, ReverseTabArrowIcon,
CircleIcon, CheckInterviewIcon, UserBookIcon, CalendarRefreshIcon,CheckSquareIcon,
CheckMarkSquareInterviewIcon
    } from "../components/icons/CustomIcons";

import { 
  getJobInterviews, 
  batchScheduleInterviews, 
  markInterviewCompleted,
  markNoShow,
  updateInterviewStatus,
  cancelInterview,
  rescheduleInterview
} from "../services/interviewService";

export default function InterviewSchedulePage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [sortBy, setSortBy] = useState("date");
  
  // Selection state for batch scheduling
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    duration: 20,
    location: "CHRMO Office, Room 301",
    description: "",
  });

  const [rescheduling, setRescheduling] = useState(false);


// bulkReschedule state 
const [showBulkRescheduleModal, setShowBulkRescheduleModal] = useState(false);
const [bulkRescheduleForm, setBulkRescheduleForm] = useState({
  date: "",
  time: "",
  duration: 20,
  location: "CHRMO Office, Room 301",
  description: "",
  reason: "",
});
const [bulkRescheduling, setBulkRescheduling] = useState(false);



// Open bulk reschedule modal
const openBulkRescheduleModal = () => {
  if (selectedApplicants.length === 0) {
    alert('Please select at least one applicant to reschedule.');
    return;
  }
  setShowBulkRescheduleModal(true);
};


// Handle bulk rescheduling with email notifications
const handleBulkReschedule = async () => {
  if (!bulkRescheduleForm.date || !bulkRescheduleForm.time) {
    alert('Please select both date and time.');
    return;
  }

  setBulkRescheduling(true);

  try {
    const selectedData = interviews.filter(i => selectedApplicants.includes(i.id));
    
    // Generate time slots
    const startTime = new Date(`${bulkRescheduleForm.date}T${bulkRescheduleForm.time}`);
    const duration = bulkRescheduleForm.duration;
    
    const emailResults = [];

    for (let i = 0; i < selectedData.length; i++) {
      const interview = selectedData[i];
      const slotTime = new Date(startTime.getTime() + (i * duration * 60000));
      
      const applicantName = getApplicantName(interview);
      const applicantEmail = getApplicantEmail(interview);
      
      // 1. Reschedule in database
      const result = await rescheduleInterview(
        interview.id,
        slotTime.toISOString().split('T')[0],
        slotTime.toTimeString().slice(0, 5),
        duration,
        bulkRescheduleForm.reason || 'Bulk Rescheduled by HR'
      );

      if (result.error) {
        console.error('Error rescheduling interview:', result.error);
        continue;
      }

      // 2. Send email notification
      if (applicantEmail && applicantEmail !== 'No email') {
        const emailResult = await sendRescheduleEmail({
          to: applicantEmail,
          name: applicantName,
          title: job?.position_title || 'Interview',
          date: slotTime.toISOString().split('T')[0],
          time: slotTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          location: bulkRescheduleForm.location || 'CHRMO Office, Room 301',
          notes: bulkRescheduleForm.description || '',
          reason: bulkRescheduleForm.reason || 'Bulk Rescheduled by HR',
        });

        emailResults.push({
          name: applicantName,
          email: applicantEmail,
          sent: emailResult.success,
          error: emailResult.error,
        });
      }
    }

    // Refresh data
    await loadData();
    setSelectedApplicants([]);
    setShowBulkRescheduleModal(false);
    setBulkRescheduleForm({
      date: "",
      time: "",
      duration: 20,
      location: "CHRMO Office, Room 301",
      description: "",
      reason: "",
    });

    const totalRescheduled = selectedData.length;
    const emailsSent = emailResults.filter(r => r.sent).length;
    const emailsFailed = emailResults.filter(r => !r.sent).length;

    let message = `✅ ${totalRescheduled} interview(s) rescheduled successfully!`;
    if (emailsSent > 0) {
      message += `\n📧 ${emailsSent} email(s) sent.`;
    }
    if (emailsFailed > 0) {
      message += `\n⚠️ ${emailsFailed} email(s) failed to send.`;
    }
    alert(message);

  } catch (error) {
    console.error('Error bulk rescheduling:', error);
    alert('Error bulk rescheduling: ' + error.message);
  } finally {
    setBulkRescheduling(false);
  }
};

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    time: "",
    duration: 20,
    location: "",
    description: "",
    reason: "",
  });

  //Gmail notif state
  const [scheduling, setScheduling] = useState(false);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [selectedInterview, setSelectedInterview] = useState(null);

  const returnPath = location.state?.from || `/hr/jobs/${jobId}/candidates`;

  // Load data
  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading data for jobId:', jobId);
      
      // Load job details
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('❌ Job error:', jobError);
        throw jobError;
      }
      console.log('✅ Job data:', jobData);
      setJob(jobData);

      // Load interviews using the service
      const result = await getJobInterviews(jobId);
      console.log('📊 Full result from getJobInterviews:', result);
      console.log('📊 Data from getJobInterviews:', result.data);
      console.log('📊 Error from getJobInterviews:', result.error);
      console.log('📊 Data length:', result.data?.length || 0);
      
      if (result.error) {
        console.error('❌ Error loading interviews:', result.error);
        throw result.error;
      }
      
      setInterviews(result.data || []);
      console.log('✅ Interviews set in state:', result.data || []);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Error loading interviews: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: { bg: "#E3F2FD", color: "#1565C0", label: "Scheduled" },
      COMPLETED: { bg: "#E8F5E9", color: "#2E7D32", label: "Completed" },
      CANCELLED: { bg: "#FFEBEE", color: "#C62828", label: "Cancelled" },
      NO_SHOW: { bg: "#FCE4EC", color: "#880E4F", label: "No Show" },
      RESCHEDULED: { bg: "#FFF3E0", color: "#E65100", label: "Rescheduled" },
    };
    return colors[status] || colors["SCHEDULED"];
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'SCHEDULED': return '';
      case 'COMPLETED': return '';
      case 'CANCELLED': return '';
      case 'NO_SHOW': return '';
      case 'RESCHEDULED': return '';
      default: return '⏳';
    }
  };

  // Check if interview needs scheduling
  const needsScheduling = (interview) => {
    return interview.needs_scheduling === true || !interview.scheduled_date;
  };

  // Helper to get applicant name from either nested or flat structure
  const getApplicantName = (interview) => {
    return interview.applicants?.full_name || 
           interview.applicant_name || 
           'Unknown';
  };

  // Helper to get applicant email from either nested or flat structure
  const getApplicantEmail = (interview) => {
    return interview.applicants?.email || 
           interview.applicant_email || 
           'No email';
  };

  // Helper to get applicant phone from either nested or flat structure
  const getApplicantPhone = (interview) => {
    return interview.applicants?.phone || 
           interview.applicant_phone || 
           'N/A';
  };

  // Helper to get AI score from either nested or flat structure
  const getAIScore = (interview) => {
    return interview.applications?.ai_match_score || 
           interview.ai_match_score || 
           0;
  };

  // Helper to get applicant avatar letter
  const getAvatarLetter = (interview) => {
    const name = getApplicantName(interview);
    return name.charAt(0) || '?';
  };

  // Filter and sort
  const filteredAndSortedInterviews = interviews
    .filter(interview => {
      // ACTIVE filter: Show only SCHEDULED and COMPLETED (hide RESCHEDULED, CANCELLED, NO_SHOW)
      if (filterStatus === "ACTIVE") {
        return interview.status === 'SCHEDULED' || interview.status === 'COMPLETED';
      }
      if (filterStatus !== "ALL" && interview.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Put TBD interviews at the top
      const aNeedsScheduling = needsScheduling(a);
      const bNeedsScheduling = needsScheduling(b);
      
      if (aNeedsScheduling && !bNeedsScheduling) return -1;
      if (!aNeedsScheduling && bNeedsScheduling) return 1;
      
      if (sortBy === "date") {
        // If both have dates, sort by date
        if (a.scheduled_date && b.scheduled_date) {
          return new Date(a.scheduled_date) - new Date(b.scheduled_date);
        }
        return 0;
      } else if (sortBy === "score") {
        return getAIScore(b) - getAIScore(a);
      }
      return 0;
    });

  // Toggle selection for batch scheduling
  const toggleSelection = (interviewId) => {
    setSelectedApplicants(prev => {
      if (prev.includes(interviewId)) {
        return prev.filter(id => id !== interviewId);
      } else {
        return [...prev, interviewId];
      }
    });
  };

  // Toggle select all (only selectable ones)
  const toggleSelectAll = () => {
  const selectable = filteredAndSortedInterviews.filter(i => i.status === 'SCHEDULED');
  const selectableIds = selectable.map(i => i.id);
  
  if (selectableIds.length === 0) return;
  
  const allSelected = selectableIds.every(id => selectedApplicants.includes(id));
  
  if (allSelected) {
    setSelectedApplicants(prev => prev.filter(id => !selectableIds.includes(id)));
  } else {
    const newSelections = selectableIds.filter(id => !selectedApplicants.includes(id));
    setSelectedApplicants([...selectedApplicants, ...newSelections]);
  }
};

  // Check if all selectable are selected
  const allSelectableSelected = () => {
  const selectable = filteredAndSortedInterviews.filter(i => i.status === 'SCHEDULED');
  const selectableIds = selectable.map(i => i.id);
  return selectableIds.length > 0 && selectableIds.every(id => selectedApplicants.includes(id));
};

  // Open schedule modal
  const openScheduleModal = () => {
    if (selectedApplicants.length === 0) {
      alert('Please select at least one applicant to schedule.');
      return;
    }
    setShowScheduleModal(true);
  };

  // Handle batch scheduling
 // Handle batch scheduling with email notifications
const handleBatchSchedule = async () => {
  if (!scheduleForm.date || !scheduleForm.time) {
    alert('Please select a date and time.');
    return;
  }

  setScheduling(true);

  try {
    const selectedData = interviews.filter(i => selectedApplicants.includes(i.id));
    
    // Generate time slots
    const startTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    const duration = scheduleForm.duration;
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;
    
    const interviewsData = selectedData.map((interview, index) => {
      const interviewTime = new Date(startTime.getTime() + (index * duration * 60000));
      
      return {
        application_id: interview.application_id,
        applicant_id: interview.applicant_id,
        job_id: jobId,
        scheduled_date: interviewTime.toISOString(),
        duration_minutes: duration,
        location: scheduleForm.location || interview.location || 'CHRMO Office, Room 301',
        description: scheduleForm.description || interview.description || '',
        scheduled_by: userId,
      };
    });

    const { data, error } = await batchScheduleInterviews(interviewsData);
    
    if (error) {
      alert('Error scheduling interviews: ' + error.message);
      return;
    }

    // ---- NEW: Send emails to all scheduled applicants ----
    const emailResults = [];
    for (let i = 0; i < selectedData.length; i++) {
      const interview = selectedData[i];
      const slotTime = new Date(startTime.getTime() + (i * duration * 60000));
      
      const applicantEmail = getApplicantEmail(interview);
      const applicantName = getApplicantName(interview);
      
      if (applicantEmail && applicantEmail !== 'No email') {
        const result = await sendInterviewEmail({
          to: applicantEmail,
          name: applicantName,
          title: job?.position_title || 'Interview',
          date: slotTime.toISOString().split('T')[0],
          time: slotTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          location: scheduleForm.location || 'CHRMO Office, Room 301',
          notes: scheduleForm.description || 'Please arrive 15 minutes before your scheduled time.',
        });
        
        emailResults.push({
          name: applicantName,
          email: applicantEmail,
          sent: result.success,
          error: result.error,
        });
      } else {
        emailResults.push({
          name: applicantName,
          email: 'No email',
          sent: false,
          error: 'No email address found',
        });
      }
    }

    // Refresh the list
    await loadData();
    setSelectedApplicants([]);
    setShowScheduleModal(false);
    setScheduleForm({
      date: "",
      time: "",
      duration: 20,
      location: "CHRMO Office, Room 301",
      description: "",
    });
    
    // Show success message with email status
    const totalScheduled = selectedData.length;
    const emailsSent = emailResults.filter(r => r.sent).length;
    const emailsFailed = emailResults.filter(r => !r.sent).length;
    
    let message = `✅ ${totalScheduled} interview(s) scheduled successfully!`;
    if (emailsSent > 0) {
      message += `\n📧 ${emailsSent} email(s) sent.`;
    }
    if (emailsFailed > 0) {
      message += `\n⚠️ ${emailsFailed} email(s) failed to send.`;
    }
    alert(message);
    
  } catch (error) {
    console.error('Error scheduling:', error);
    alert('Error scheduling interviews: ' + error.message);
  } finally {
    setScheduling(false);
  }
};

  // Navigate back to candidates
  const goBackToCandidates = () => {
    navigate(returnPath);
  };

  // ============================================
  // RESCHEDULE FUNCTIONS
  // ============================================

  // Open reschedule modal
  const openRescheduleModal = (interview) => {
    setRescheduleData(interview);
    setRescheduleForm({
      date: interview.scheduled_date ? new Date(interview.scheduled_date).toISOString().split('T')[0] : "",
      time: interview.scheduled_date ? new Date(interview.scheduled_date).toTimeString().slice(0, 5) : "",
      duration: interview.duration_minutes || 20,
      location: interview.location || "CHRMO Office, Room 301",
      description: interview.description || "",
      reason: "",
    });
    setShowRescheduleModal(true);
  };

// Handle reschedule with email notification
const handleReschedule = async () => {
  if (!rescheduleData) return;
  
  if (!rescheduleForm.date || !rescheduleForm.time) {
    alert('Please select both date and time.');
    return;
  }

  setRescheduling(true);

  const applicantName = getApplicantName(rescheduleData);
  const applicantEmail = getApplicantEmail(rescheduleData);
  const jobTitle = job?.position_title || 'Interview';

  try {
    const result = await rescheduleInterview(
      rescheduleData.id,
      rescheduleForm.date,
      rescheduleForm.time,
      rescheduleForm.duration,
      rescheduleForm.reason || 'Rescheduled by HR'
    );

    if (result.error) {
      alert('Error rescheduling: ' + result.error.message);
      setRescheduling(false);
      return;
    }

    // Send email notification about reschedule - USING NEW FUNCTION
    if (applicantEmail && applicantEmail !== 'No email') {
      const emailResult = await sendRescheduleEmail({
        to: applicantEmail,
        name: applicantName,
        title: jobTitle,
        date: rescheduleForm.date,
        time: rescheduleForm.time,
        location: rescheduleForm.location || 'CHRMO Office, Room 301',
        notes: rescheduleForm.description || '',
        reason: rescheduleForm.reason || 'Rescheduled by HR',
      });

      if (emailResult.success) {
        console.log('📧 Reschedule email sent to:', applicantEmail);
      } else {
        console.error('❌ Failed to send reschedule email:', emailResult.error);
      }
    }

    await loadData();
    setShowRescheduleModal(false);
    setRescheduleData(null);
    setRescheduleForm({
      date: "",
      time: "",
      duration: 20,
      location: "CHRMO Office, Room 301",
      description: "",
      reason: "",
    });
    
    alert(`✅ Interview successfully rescheduled!${applicantEmail && applicantEmail !== 'No email' ? ' 📧 Email sent.' : ''}`);
  } catch (error) {
    console.error('Error rescheduling:', error);
    alert('Error rescheduling interview: ' + error.message);
  } finally {
    setRescheduling(false);
  }
};

// Handle individual actions (Complete, No Show, Cancel)
const handleAction = (interview, action) => {
  setSelectedInterview(interview);
  setConfirmAction(action);
  
  const messages = {
    complete: `Mark "${getApplicantName(interview)}" as completed?`,
    noshow: `Mark "${getApplicantName(interview)}" as NO SHOW?`,
    cancel: `Cancel interview for "${getApplicantName(interview)}"?`,
  };
  setConfirmMessage(messages[action]);
  setShowConfirmModal(true);
};

  // Confirm action
  const confirmActionHandler = async () => {
    if (!selectedInterview) return;

    try {
      if (confirmAction === 'complete') {
        await markInterviewCompleted(selectedInterview.id);
        alert('✅ Interview marked as completed!');
      } else if (confirmAction === 'noshow') {
        await markNoShow(selectedInterview.id);
        alert('🚫 Applicant marked as NO SHOW. Application status changed to REJECTED.');
      } else if (confirmAction === 'cancel') {
        await cancelInterview(selectedInterview.id);
        alert('❌ Interview cancelled. Applicant status changed to QUALIFIED.');
      }
      await loadData();
      setShowConfirmModal(false);
      setSelectedInterview(null);
      setConfirmAction(null);
    } catch (error) {
      alert('Error updating interview: ' + error.message);
    }
  };
  // View candidate profile
  const viewCandidateProfile = (interview) => {
    setSelectedApplicant(interview);
    setShowProfileModal(true);
  };
  // Get stats
  const stats = {
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === 'SCHEDULED').length,
    completed: interviews.filter(i => i.status === 'COMPLETED').length,
    noshow: interviews.filter(i => i.status === 'NO_SHOW').length,
    cancelled: interviews.filter(i => i.status === 'CANCELLED').length,
    rescheduled: interviews.filter(i => i.status === 'RESCHEDULED').length,
    needsScheduling: interviews.filter(i => needsScheduling(i)).length,
  };
  return (
    <>
      <Navbar userRole="hr" />
      
      <div className="interview-schedule-page">
        <div className="page-header" >
          <div>
            <button 
              className="back-btn"
              onClick={goBackToCandidates}
               style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1px',
    cursor: 'pointer',
     textDecoration: 'none'
  }}>
              <ReverseTabArrowIcon/> <span> Back </span>
            </button>
           <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <img src={calendarminimalLogo} alt="Calendar" style={{ width: 24, height: 24,
     filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
   }} />
  Interview Schedule
</h1>
            <p className="subtitle">
              {job?.position_title || 'Loading...'} • {interviews.length} total interviews
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#1565C0' }}>{stats.scheduled}</span>
            <span className="stat-label">Scheduled</span>
          </div>
          {stats.rescheduled > 0 && (
            <div className="stat-item">
              <span className="stat-number" style={{ color: '#E65100' }}>{stats.rescheduled}</span>
              <span className="stat-label">🔄 Rescheduled</span>
            </div>
          )}
          {stats.cancelled > 0 && (
            <div className="stat-item">
              <span className="stat-number" style={{ color: '#C62828' }}>{stats.cancelled}</span>
              <span className="stat-label">❌ Cancelled</span>
            </div>
          )}
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#2E7D32' }}>{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#880E4F' }}>{stats.noshow}</span>
            <span className="stat-label">No Show</span>
          </div>
          {stats.needsScheduling > 0 && (
            <div className="stat-item needs-scheduling-stat">
              <span className="stat-number" style={{ color: '#856404' }}>{stats.needsScheduling}</span>
              <span className="stat-label" style={{ color: '#856404' }}>⚠️ Needs Schedule</span>
            </div>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="controls-section">
          <div className="controls-left">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="ACTIVE">  Active (Scheduled)</option>
                <option value="ALL"> All Status</option>
                <option value="SCHEDULED"> Scheduled</option>
                <option value="COMPLETED"> Completed</option>
                <option value="NO_SHOW"> No Show</option>
                <option value="CANCELLED"> Cancelled</option>
                <option value="RESCHEDULED"> Rescheduled (History)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date"> Date (Soonest)</option>
                <option value="score"> Score (Highest)</option>
              </select>
            </div>
          </div>

          <div className="controls-right">
            {selectedApplicants.length > 0 && (
              <span className="selection-count">
                {selectedApplicants.length} selected
              </span>
            )}
            <button 
              className="btn-schedule-batch"
              onClick={openScheduleModal}
              disabled={selectedApplicants.length === 0}
               style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  }}>
              <img src={calendarminimalLogo} alt="Calendar" style={{ width: 16, height: 16,
     filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
         
   }} /> Schedule Selected ({selectedApplicants.length})
            </button>

   
{/* Bulk Reschedule Modal */}
{showBulkRescheduleModal && (
  <div className="modal-overlay" onClick={() => setShowBulkRescheduleModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
      <div className="modal-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={calendarminimalLogo} alt="Calendar" style={{ width: 19, height: 19, filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} /> 
          Bulk Reschedule Interviews
        </h3>
        <button className="close-modal" onClick={() => setShowBulkRescheduleModal(false)}>×</button>
      </div>
      <div className="modal-body">
        <p className="schedule-info">
          Rescheduling <strong>{selectedApplicants.length}</strong> applicant(s)
        </p>

        <div className="schedule-form">
          <div className="form-group">
            <label>New Date *</label>
            <input
              type="date"
              value={bulkRescheduleForm.date}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>New Time *</label>
            <input
              type="time"
              value={bulkRescheduleForm.time}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, time: e.target.value})}
              min="08:00"
              max="17:00"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes) *</label>
            <select
              value={bulkRescheduleForm.duration}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, duration: parseInt(e.target.value)})}
              className="form-select"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={bulkRescheduleForm.location}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, location: e.target.value})}
              placeholder="e.g., CHRMO Office, Room 301"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              value={bulkRescheduleForm.description}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, description: e.target.value})}
              placeholder="Add any special instructions..."
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Reason for Reschedule</label>
            <select
              value={bulkRescheduleForm.reason}
              onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, reason: e.target.value})}
              className="form-select"
            >
              <option value="">Select a reason...</option>
              <option value="Weather Disturbance">🌧️ Weather Disturbance</option>
              <option value="Panel Unavailable">👥 Panel Unavailable</option>
              <option value="Applicant Request">📞 Applicant Request</option>
              <option value="HR Scheduling Conflict">📋 HR Scheduling Conflict</option>
              <option value="Technical Issues">💻 Technical Issues</option>
              <option value="Bulk Reschedule">📝 Bulk Reschedule</option>
              <option value="Other">📝 Other</option>
            </select>
            {bulkRescheduleForm.reason === 'Other' && (
              <input
                type="text"
                placeholder="Please specify..."
                className="form-input"
                style={{ marginTop: '8px' }}
                onChange={(e) => setBulkRescheduleForm({...bulkRescheduleForm, reason: e.target.value})}
              />
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-secondary" 
            onClick={() => setShowBulkRescheduleModal(false)}
          >
            Cancel
          </button>
          <button 
             className="btn-primary"
  onClick={handleBulkReschedule}
  disabled={!bulkRescheduleForm.date || !bulkRescheduleForm.time || bulkRescheduling}
  style={{ 
    background: '#E65100',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
   
    opacity: (!bulkRescheduleForm.date || !bulkRescheduleForm.time || bulkRescheduling) ? 0.6 : 1
  }}
>
  {bulkRescheduling ? ('Rescheduling...') : 
  (<>  <span > <CalendarRefreshIcon size={22}  /> </span>
    <span style={{ marginRight: '40px' }}>  Reschedule All </span>
    </>
  )}
</button>
        </div>
      </div>
    </div>
  </div>
)}



          </div>
        </div>
        {/* Table */}
      {loading ? (
   <div className="loading-state">
    <p>Loading interviews...</p>
</div>
) : (
          <div className="table-container">
            
            {filteredAndSortedInterviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
  <img src={calendarminimalLogo} alt="Calendar" style={{ width: 50, height: 50,
     filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
         
   }} />
                </div>
                <h3>No interviews found</h3>
                <p>
                  {filterStatus !== "ACTIVE" && filterStatus !== "ALL"
                    ? "Try adjusting your filters" 
                    : filterStatus === "ACTIVE" 
                      ? "No active interviews. Try changing the filter to see all statuses." 
                      : "No interviews have been scheduled yet"}
                </p>
                {filterStatus === "ALL" && (
                  <button 
                    className="btn-schedule"
                    onClick={goBackToCandidates}
                  >
                    Go to Candidates to Schedule Interviews
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="interviews-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={allSelectableSelected()}
                          onChange={toggleSelectAll}
                        disabled={filteredAndSortedInterviews.filter(i => i.status === 'SCHEDULED').length === 0}
                        />
                      </th>
                      <th>#</th>
                      <th>Applicant</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedInterviews.map((interview, index) => {
                      const statusStyle = getStatusColor(interview.status || 'SCHEDULED');
                      const isSelected = selectedApplicants.includes(interview.id);
                      const isTBD = needsScheduling(interview);
                      const isSelectable = interview.status === 'SCHEDULED' && isTBD;
                      const applicantName = getApplicantName(interview);
                      const applicantEmail = getApplicantEmail(interview);
                      const aiScore = getAIScore(interview);
                      const avatarLetter = getAvatarLetter(interview);
                      const isScheduled = interview.status === 'SCHEDULED' && !isTBD;

                      return (
                        <tr key={interview.id} className={isTBD ? 'tbd-row' : ''}>
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(interview.id)}
                              disabled={interview.status !== 'SCHEDULED'}
                            />
                          </td>
                          <td>{index + 1}</td>
                          <td>
                            <div className="applicant-cell">
                              <div className="applicant-avatar">
                                {avatarLetter}
                              </div>
                              <div>
                                <div className="applicant-name">{applicantName}</div>
                                <div className="applicant-email">{applicantEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isTBD ? (
                              <div className="datetime-cell tbd">
                                <span className="tbd-badge">⚠️ Needs Scheduling</span>
                              </div>
                            ) : (
                              <div className="datetime-cell">
                                <div>{formatDate(interview.scheduled_date)}</div>
                                <div className="time" >{formatTime(interview.scheduled_date)}</div>
                                {interview.duration_minutes && (
                                  <div className="duration" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlarmClockIcon size={16} style={{ color: 'blue' }} /> {interview.duration_minutes} min</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {isTBD ? (
                              <span className="tbd-text">TBD</span>
                            ) : (
                              <div className="location-cell">
                                {interview.location || '—'}
                                {interview.description && (
                                  <div className="notes-cell">{interview.description}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="score-badge">
                              {aiScore}%
                            </span>
                          </td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                              }}
                            >
                              {getStatusIcon(interview.status)} {statusStyle.label}
                            </span>
                          </td>
                          <td className="actions-col">
                            <div className="action-buttons">
                              <button 
                                className="btn-view"
                                onClick={() => viewCandidateProfile(interview)}
                                title="View profile"
                              >
                                👤
                              </button>
                              {isScheduled && (
                                <>
                                  <button 
                                    className="btn-complete"
                                    onClick={() => handleAction(interview, 'complete')}
                                    title="Complete"
                                  >
                                    <CheckMarkSquareInterviewIcon size={18} />
                                  </button>
                                  <button 
                                    className="btn-noshow"
                                    onClick={() => handleAction(interview, 'noshow')}
                                    title="No Show"
                                  >
                                    🚫
                                  </button>
                                  <button 
                                    className="btn-reschedule"
                                    onClick={() => openRescheduleModal(interview)}
                                    title="Reschedule"
                                  >
                                    <img src={calendarminimalLogo} alt="Calendar" style={{ width: 14, height: 14,
     filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
                                    }}
                                    />         

                                  </button>
                                  <button 
                                    className="btn-cancel"
                                    onClick={() => handleAction(interview, 'cancel')}
                                    title="Cancel"
                                  >
                                    ❌
                                  </button>
                                </>
                              )}
                              {isTBD && (
                                <span className="status-label-tbd"> Pending Schedule</span>
                              )}
                              {interview.status !== 'SCHEDULED' && interview.status !== undefined && !isTBD && (
                                <span className="status-label-done">
                                  {interview.status === 'COMPLETED' ? '✓ Done' : 
                                   interview.status === 'NO_SHOW' ? '✗ Missed' : 
                                   interview.status === 'CANCELLED' ? '✕ Cancelled' :
                                   interview.status === 'RESCHEDULED' ? '🔄 Rescheduled' : 
                                   '✓ Done'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      
      {/* Bottom section with Reschedule Button */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'flex-end',  // ← Pushes content to the right
    padding: '10px 0',  // ← REDUCED from 10px to 4px
  marginTop: '-16px'  // ← ADD: Pull it up closer to the table
}}>
          {/* NEW: Bulk Reschedule Button */}
  <button 
    className="btn-reschedule-batch"
    onClick={openBulkRescheduleModal}
    disabled={selectedApplicants.length === 0}
    style={{
      cursor: selectedApplicants.length === 0 ? 'not-allowed' : 'pointer',
      opacity: selectedApplicants.length === 0 ? 0.5 : 1
    }}
  >
    <img src={calendarminimalLogo} alt="Calendar" style={{ width: 16, height: 16,
      filter: 'brightness(0) saturate(100%) invert(100%) brightness(200%)'
    }} /> 
    Reschedule Selected ({selectedApplicants.length})
  </button>

</div>


      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }} >   <img src={calendarminimalLogo} alt="Calendar" style={{ width: 19, height: 19,
     filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
         
   }} /> Schedule Interview</h3>
              <button className="close-modal" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="schedule-info">
                Scheduling <strong>{selectedApplicants.length}</strong> applicant(s)
              </p>

              <div className="schedule-form">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    min="08:00"
                    max="17:00"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <select
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
                    className="form-select"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({...scheduleForm, location: e.target.value})}
                    placeholder="e.g., CHRMO Office, Room 301"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description / Notes</label>
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                    placeholder="Add any special instructions..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>

              {/* Preview time slots */}
              {scheduleForm.date && scheduleForm.time && selectedApplicants.length > 0 && (
                <div className="preview-slots">
                  <h4>Preview Time Slots:</h4>
                  {selectedApplicants.slice(0, 5).map((id, idx) => {
                    const applicant = interviews.find(i => i.id === id);
                    const startTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
                    const slotTime = new Date(startTime.getTime() + (idx * scheduleForm.duration * 60000));
                    return (
                      <div key={id} className="slot-preview">
                        {formatTime(slotTime.toISOString())} - {getApplicantName(applicant || {})}
                      </div>
                    );
                  })}
                  {selectedApplicants.length > 5 && (
                    <div className="slot-preview more">
                      +{selectedApplicants.length - 5} more applicants
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
              <button 
  className="btn-primary"
  onClick={handleBatchSchedule}
  disabled={!scheduleForm.date || !scheduleForm.time || scheduling}
>
  {scheduling ? 'Scheduling...' : 'Schedule All'}
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleData && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }} ><img src={calendarminimalLogo} alt="Calendar" style={{ width: 19, height: 19, filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} /> Reschedule Interview</h3>
              <button className="close-modal" onClick={() => setShowRescheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="schedule-info">
                Rescheduling interview for <strong>{getApplicantName(rescheduleData)}</strong>
              </p>
              <p className="schedule-info" style={{ fontSize: '13px', color: '#6c757d' }}>
                Current: {formatDate(rescheduleData.scheduled_date)} at {formatTime(rescheduleData.scheduled_date)}
              </p>

              <div className="schedule-form">
                <div className="form-group">
                  <label>New Date *</label>
                  <input
                    type="date"
                    value={rescheduleForm.date}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>New Time *</label>
                  <input
                    type="time"
                    value={rescheduleForm.time}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, time: e.target.value})}
                    min="08:00"
                    max="17:00"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <select
                    value={rescheduleForm.duration}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, duration: parseInt(e.target.value)})}
                    className="form-select"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={rescheduleForm.location}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, location: e.target.value})}
                    placeholder="e.g., CHRMO Office, Room 301"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description / Notes</label>
                  <textarea
                    value={rescheduleForm.description}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, description: e.target.value})}
                    placeholder="Add any special instructions..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Reason for Reschedule</label>
                  <select
                    value={rescheduleForm.reason}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Weather Disturbance">🌧️ Weather Disturbance</option>
                    <option value="Panel Unavailable">👥 Panel Unavailable</option>
                    <option value="Applicant Request">📞 Applicant Request</option>
                    <option value="HR Scheduling Conflict">📋 HR Scheduling Conflict</option>
                    <option value="Technical Issues">💻 Technical Issues</option>
                    <option value="Other">📝 Other</option>
                  </select>
                  {rescheduleForm.reason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Please specify..."
                      className="form-input"
                      style={{ marginTop: '8px' }}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                    />
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Cancel
                </button>
                <button 
  className="btn-primary"
  style={{  background: '#E65100',
   
    color: 'white',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
   }}
  onClick={handleReschedule}
  disabled={!rescheduleForm.date || !rescheduleForm.time || rescheduling}
>
  {rescheduling ? ('Rescheduling...') : ( <>  <span style={{  }}> <CalendarRefreshIcon className="resched-single-btn" size={22} 
   /> </span>   <span style={{ marginRight: '40px' }}>Reschedule</span> </> )}
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><UserBookIcon size={28} style={{ color: '#1a56db' }} /> {getApplicantName(selectedApplicant)}</h3>
              <button className="close-modal" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }} >   <img 
      src={mailblackLogo} 
      alt="email" 
      style={{ 
        width: 18, 
        height: 18, 
        marginRight: '7px',
        filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
      }} 
    /> Email</span>
                  <span>{getApplicantEmail(selectedApplicant)}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }}>  <img 
      src={phoneLogo} 
      alt="phone" 
      style={{ 
        width: 17, 
        height: 17, 
        marginRight: '7px',
        filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
      }} /> Phone</span>
                  <span>{getApplicantPhone(selectedApplicant)}</span>
                </div>
               
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }}>  <img 
      src={calendarplumpLogo} 
      alt="calendar" 
      style={{ 
        width: 17, 
        height: 17, 
        marginRight: '7px',
        filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
      }} 
    /> Schedule</span>
                  <span>
                    {selectedApplicant.scheduled_date ? (
                      `${formatDate(selectedApplicant.scheduled_date)} at ${formatTime(selectedApplicant.scheduled_date)}`
                    ) : (
                      <span className="tbd-text">⚠️ Needs Scheduling</span>
                    )}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }} >   <img 
      src={locationplumpLogo} 
      alt="location" 
      style={{ 
        width: 17, 
        height: 17, 
        marginRight: '7px',
        filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
      }} 
    /> Location</span>
                  <span>{selectedApplicant.location || 'TBD'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }} >   <img 
      src={noteplumpLogo} 
      alt="notes" 
      style={{ 
        width: 17, 
        height: 17, 
        marginRight: '7px',
        filter: 'brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(800%) hue-rotate(180deg) brightness(95%) contrast(90%)'
      }} 
    /> Notes</span>
                  <span>{selectedApplicant.description || 'No notes'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label" style={{ display: 'flex', alignItems: 'center', }} > <StatusIcon size={20} /> Status</span>
                  <span className="status-badge" style={{
                    backgroundColor: getStatusColor(selectedApplicant.status).bg,
                    color: getStatusColor(selectedApplicant.status).color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    {getStatusIcon(selectedApplicant.status)} {getStatusColor(selectedApplicant.status).label}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* Confirm Modal - Lightweight */}
{showConfirmModal && (
  <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
    <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
      {/* Simple Header with Icon */}
      <div className="confirm-card-header">
        <span className="confirm-icon">
           {confirmAction === 'complete' && <span style={{ color: '#3c6741' }}>
  <CheckMarkSquareInterviewIcon size={42}  color="#43ae4d"/>
</span>}
          {confirmAction === 'noshow' && '🚫'}
          {confirmAction === 'cancel' && '❌'}
        </span>
        <h3>
          {confirmAction === 'complete' && 'Complete Interview'}
          {confirmAction === 'noshow' && 'Mark as No Show'}
          {confirmAction === 'cancel' && 'Cancel Interview'}
        </h3>
      </div>
      
      {/* Message */}
      <div className="confirm-card-body">
        <p>{confirmMessage}</p>
      </div>
      
      {/* Actions */}
      <div className="confirm-card-footer" style={{ margin: '0 -24px -24px -24px', padding: '16px 24px', borderRadius: '0 0 12px 12px' }}>
        <button 
          className="btn-cancel"
          onClick={() => setShowConfirmModal(false)}
        >
          Cancel
        </button>
        <button 
          className={`btn-confirm ${confirmAction}`}
          onClick={confirmActionHandler}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}