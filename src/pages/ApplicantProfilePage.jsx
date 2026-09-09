import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { supabase } from '../lib/supabase';
import { PatternBackground } from '../components/PatternBackground'; // ADD THIS IMPORT
import Loader from '../components/Loader';
import { CircularCheckSuccessIcon } from "../components/icons/CustomIcons";

function ApplicantProfilePage() {
const [profileSuccessMessage, setProfileSuccessMessage] = useState(null);

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    firstName: "",
    surname: "",
    phoneNumber: "",
    email: "",
    age: "",
    gender: "",
    address: ""
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      const metadata = user.user_metadata || {};
      
      setProfile({
        firstName: metadata.first_name || "",
        surname: metadata.surname || "",
        phoneNumber: metadata.phone_number || "",
        email: user.email || "",
        age: metadata.age || "",
        gender: metadata.gender || "",
        address: metadata.address || ""
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Error loading profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

 const handleSave = async () => {
  setIsEditing(false);
  setLoading(true);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        first_name: profile.firstName,
        surname: profile.surname,
        phone_number: profile.phoneNumber,
        age: profile.age,
        gender: profile.gender,
        address: profile.address
      }
    });

    if (updateError) throw updateError;

    const { error: applicantError } = await supabase
      .from('applicants')
      .update({
        full_name: `${profile.firstName} ${profile.surname}`,
        phone: profile.phoneNumber,
        email: profile.email,
        address: profile.address
      })
      .eq('id', user.id);

    if (applicantError) throw applicantError;

    // Show success notification instead of alert
    setProfileSuccessMessage(' Profile saved successfully!');
    setTimeout(() => setProfileSuccessMessage(null), 5000);

  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Error saving profile: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const styles = `
    .profile-page {
      min-height: 100vh;
      background: #F5F6F8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding-top: 70px;
      position: relative;
    }

    .profile-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      position: relative;
      z-index: 1;
    }

    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .profile-header h1 {
      margin: 0;
      font-size: 28px;
      color: #1a1f36;
    }

    .edit-btn, .save-btn, .cancel-btn {
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .edit-btn {
      background: #4f46e5;
      color: white;
      border: none;
    }

    .edit-btn:hover {
      background: #4338ca;
    }

    .save-btn {
      background: #0d9488;
      color: white;
      border: none;
    }

    .save-btn:hover {
      background: #0f766e;
    }

    .cancel-btn {
      background: white;
      color: #6c757d;
      border: 1px solid #dee2e6;
      margin-left: 10px;
    }

    .cancel-btn:hover {
      background: #f8f9fa;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .card-title {
      padding: 20px 24px;
      border-bottom: 1px solid #e9ecef;
      font-size: 18px;
      font-weight: 600;
      color: #1a1f36;
      margin: 0;
    }

    .card-content {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: span 2;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 6px;
    }

    .form-group input, .form-group textarea, .form-group select {
      padding: 10px 12px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-group input:disabled, .form-group textarea:disabled, .form-group select:disabled {
      background: #f8f9fa;
      color: #1a1f36;
      cursor: not-allowed;
    }

    .loading-text {
      text-align: center;
      padding: 40px;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .profile-container { padding: 15px; }
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full-width { grid-column: span 1; }
      .profile-header { flex-direction: column; align-items: flex-start; }
    }
  `;

  if (loading) {
    return (
      <>
        <Navbar userRole="applicant" />
        <div className="profile-page">
          <style>{styles}</style>
    
          <div className="profile-container">
            <div className="loading-text"><Loader/></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="applicant" />
      <div className="profile-page">
        <style>{styles}</style>
        
        {/* Pattern Background */}
        <PatternBackground color="#aeacde" opacity={0.04} strokeOpacity={0.1} />
        
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <div>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
              ) : (
                <>
                  <button className="save-btn" onClick={handleSave}>Save Changes</button>
                  <button className="cancel-btn" onClick={() => {
                    setIsEditing(false);
                    loadUserProfile();
                  }}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="profile-card">
            <h3 className="card-title">Personal Information</h3>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    value={profile.firstName} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Surname</label>
                  <input 
                    type="text" 
                    value={profile.surname} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, surname: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={profile.phoneNumber} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled={true} 
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    value={profile.age} 
                    disabled={true}
                    onChange={(e) => setProfile({...profile, age: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    value={profile.gender} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, gender: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    rows="2" 
                    value={profile.address} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, address: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Profile Save Success Notification */}
{profileSuccessMessage && (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    background: '#0D9488',
    color: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'slideIn 0.3s ease'
  }}>
    <CircularCheckSuccessIcon size={18} style={{ color: 'white' }} />
    <span>{profileSuccessMessage}</span>
  </div>
)}
    </>
  );
}

export default ApplicantProfilePage;