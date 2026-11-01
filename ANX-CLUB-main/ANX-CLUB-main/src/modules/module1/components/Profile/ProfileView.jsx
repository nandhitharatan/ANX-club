import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileView = () => {
  const { userProfile, currentUser } = useAuth();

  if (!userProfile) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  const getBadgeClass = (role) => {
    switch(role) {
      case 'Admin': return 'badge-admin';
      case 'Premium Member': return 'badge-premium';
      case 'Mentor': return 'badge-mentor';
      case 'Member': return 'badge-member';
      default: return 'badge-visitor';
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>User Profile</h2>
        <Link to="/profile/edit" className="btn btn-primary">Edit Profile</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Full Name</div>
            <div style={{ fontSize: '1.125rem' }}>{userProfile.fullName || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Email</div>
            <div>{currentUser.email}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Phone Number</div>
            <div>{userProfile.phoneNumber || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Membership Status</div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge ${getBadgeClass(userProfile.role)}`}>
                {userProfile.role}
              </span>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Joined Date</div>
            <div>{new Date(userProfile.joinedDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">College / University</div>
            <div>{userProfile.collegeName || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Year & Branch</div>
            <div>{userProfile.yearBranch || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Skills</div>
            <div>{userProfile.skills || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Interests</div>
            <div>{userProfile.interests || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {userProfile.linkedinUrl ? <a href={userProfile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : <span style={{color: 'var(--text-secondary)'}}>No LinkedIn provided</span>}
              {userProfile.githubUrl ? <a href={userProfile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : <span style={{color: 'var(--text-secondary)'}}>No GitHub provided</span>}
              {userProfile.portfolioUrl ? <a href={userProfile.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a> : <span style={{color: 'var(--text-secondary)'}}>No Portfolio provided</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
