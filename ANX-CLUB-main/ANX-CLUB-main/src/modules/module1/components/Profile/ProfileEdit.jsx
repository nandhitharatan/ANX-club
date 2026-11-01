import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileEdit = () => {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    collegeName: userProfile?.collegeName || '',
    yearBranch: userProfile?.yearBranch || '',
    skills: userProfile?.skills || '',
    interests: userProfile?.interests || '',
    linkedinUrl: userProfile?.linkedinUrl || '',
    githubUrl: userProfile?.githubUrl || '',
    portfolioUrl: userProfile?.portfolioUrl || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfileData(formData);
      navigate('/profile');
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Edit Profile</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Left Column */}
          <div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="fullName" className="form-input" value={formData.fullName} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" name="phoneNumber" className="form-input" value={formData.phoneNumber} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">College Name</label>
              <input type="text" name="collegeName" className="form-input" value={formData.collegeName} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Year/Branch</label>
              <input type="text" name="yearBranch" className="form-input" value={formData.yearBranch} onChange={handleChange} placeholder="e.g. 3rd Year / Computer Science" />
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            <div className="form-group">
              <label className="form-label">Skills (comma separated)</label>
              <input type="text" name="skills" className="form-input" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Python" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Interests</label>
              <input type="text" name="interests" className="form-input" value={formData.interests} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input type="url" name="linkedinUrl" className="form-input" value={formData.linkedinUrl} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">GitHub URL</label>
              <input type="url" name="githubUrl" className="form-input" value={formData.githubUrl} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Portfolio URL</label>
              <input type="url" name="portfolioUrl" className="form-input" value={formData.portfolioUrl} onChange={handleChange} />
            </div>
          </div>
          
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" onClick={() => navigate('/profile')} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
