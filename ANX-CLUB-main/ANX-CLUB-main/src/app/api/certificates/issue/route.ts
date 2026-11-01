import { NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import { authenticate } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request (Must be Admin)
    const userId = await authenticate(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.data()?.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, recipientName, title, templateType } = body;

    if (!memberId || !recipientName || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Generate Unique Verification Hash
    const rawData = `${memberId}-${title}-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(rawData).digest('hex').substring(0, 16).toUpperCase();
    const certId = `ANX-CERT-${hash}`;
    const verificationUrl = `https://anxplatform.com/verify/${certId}`;

    // 3. Generate QR Code using a public API (since qrcode package might not be installed)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
    const qrResponse = await fetch(qrApiUrl);
    const qrArrayBuffer = await qrResponse.arrayBuffer();
    const qrBuffer = Buffer.from(qrArrayBuffer);

    // 4. Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw basic certificate template
    page.drawText('A.N.X Platform', { x: 50, y: height - 100, size: 24, font, color: rgb(0.73, 0.52, 0.99) });
    page.drawText('Certificate of Achievement', { x: 50, y: height - 150, size: 40, font, color: rgb(0, 0, 0) });
    page.drawText('This certifies that', { x: 50, y: height - 220, size: 18, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(recipientName, { x: 50, y: height - 280, size: 36, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`has successfully completed: ${title}`, { x: 50, y: height - 340, size: 18, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Verification ID: ${certId}`, { x: 50, y: 50, size: 12, font: fontNormal, color: rgb(0.6, 0.6, 0.6) });
    page.drawText(`Verify at: ${verificationUrl}`, { x: 50, y: 35, size: 12, font: fontNormal, color: rgb(0.01, 0.85, 0.77) });

    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const qrDims = qrImage.scale(0.5);
    page.drawImage(qrImage, {
      x: width - 150,
      y: 50,
      width: qrDims.width,
      height: qrDims.height,
    });

    const pdfBytes = await pdfDoc.save();

    // 5. Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const file = bucket.file(`certificates/${certId}.pdf`);
    await file.save(pdfBytes, {
      metadata: { contentType: 'application/pdf' },
      public: true, // Make publicly readable
    });
    
    // Fallback URL if public URL is not easily accessible depending on bucket settings
    const pdfStorageUrl = `https://storage.googleapis.com/${bucket.name}/certificates/${certId}.pdf`;

    // 5. Save Metadata to Firestore
    const certData = {
      id: certId,
      memberId,
      recipientName,
      templateType: templateType || 'standard',
      title,
      issueDate: admin.firestore.FieldValue.serverTimestamp(),
      verificationUrl,
      pdfStorageUrl,
      isValid: true,
    };

    await adminDb.collection('certificates').doc(certId).set(certData);

    return NextResponse.json({ 
      success: true, 
      message: 'Certificate generated successfully',
      certificate: certData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
