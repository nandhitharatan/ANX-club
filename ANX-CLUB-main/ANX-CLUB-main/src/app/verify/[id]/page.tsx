import React from 'react';
import { adminDb } from '@/lib/firebase/admin';
import styles from './Verify.module.css';

export const revalidate = 0; // Dynamic route

async function getCertificate(id: string) {
  const docRef = await adminDb.collection('certificates').doc(id).get();
  if (!docRef.exists) return null;
  return docRef.data();
}

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const certData = await getCertificate(params.id);

  if (!certData) {
    return (
      <div className={styles.container}>
        <div className={styles.invalidCard}>
          <div className={styles.iconError}>❌</div>
          <h2>Invalid Credential</h2>
          <p>We could not find a certificate matching the ID: <strong>{params.id}</strong></p>
          <p className={styles.helpText}>Please ensure the URL is correct or contact the issuer.</p>
        </div>
      </div>
    );
  }

  const issueDateStr = certData.issueDate ? new Date(certData.issueDate._seconds * 1000).toLocaleDateString() : 'Unknown Date';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Credential Verification</h1>
        <p className={styles.subtitle}>Cryptographically verified by the A.N.X Platform</p>
      </div>

      <div className={styles.verifyCard}>
        <div className={styles.validHeader}>
          <div className={styles.iconSuccess}>✅</div>
          <h2>Verified Authentic</h2>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <label>Recipient Name</label>
            <p className={styles.detailValue}>{certData.recipientName}</p>
          </div>
          
          <div className={styles.detailItem}>
            <label>Achievement Title</label>
            <p className={styles.detailValue}>{certData.title}</p>
          </div>

          <div className={styles.detailItem}>
            <label>Issue Date</label>
            <p className={styles.detailValue}>{issueDateStr}</p>
          </div>

          <div className={styles.detailItem}>
            <label>Verification ID</label>
            <p className={styles.detailValueHash}>{certData.id}</p>
          </div>
        </div>

        {certData.pdfStorageUrl && (
          <div className={styles.actions}>
            <a 
              href={certData.pdfStorageUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.downloadBtn}
            >
              View Original Certificate (PDF)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
