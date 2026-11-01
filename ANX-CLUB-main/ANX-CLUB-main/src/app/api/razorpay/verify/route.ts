import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {adminDb} from '@/lib/firebase/admin';
const db = adminDb;
import { sendEmail } from '@/lib/resend';
import { paymentConfirmationEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      userEmail,
      amount = 0,
      paymentType = 'Unknown'
    } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });
    }

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    const expectedBuf = Buffer.from(digest, 'hex');
    const actualBuf = Buffer.from(razorpay_signature || '', 'hex');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return NextResponse.json({ error: 'Transaction not legit!' }, { status: 400 });
    }

    const paymentRef = db.collection('payments').doc(razorpay_payment_id);
    let userUpdated = false;

    await db.runTransaction(async (transaction) => {
      const paymentDoc = await transaction.get(paymentRef);

      if (!paymentDoc.exists) {
        // 2. Log Payment Record in Firestore
        const paymentRecord = {
          userId: userId || 'anonymous',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount,
          paymentType,
          status: 'success',
          timestamp: new Date().toISOString(),
          clientProcessed: true
        };
        transaction.set(paymentRef, paymentRecord);

        // 3. Update User Membership and persist to memberships collection (Dual-write atomic transaction)
        if (userId && paymentType.includes('Premium')) {
          const startDate = new Date();
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          const userRef = db.collection('users').doc(userId);
          const membershipRef = db.collection('memberships').doc();

          transaction.update(userRef, {
            membershipType: 'Premium',
            membershipExpiry: expiryDate.toISOString(),
          });

          transaction.set(membershipRef, {
            id: membershipRef.id,
            userId,
            plan: 'Premium',
            status: 'active',
            startDate: startDate.toISOString(),
            endDate: expiryDate.toISOString(),
            razorpayPaymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: amount,
            createdAt: startDate.toISOString()
          });

          userUpdated = true;
        }
      }
    });

    // 4. Send Confirmation Email (if email provided)
    // We do this outside the transaction because we don't want to email repeatedly if the transaction retries.
    // However, if the transaction succeeds but email fails, it's better than vice-versa. Ideally we use pub/sub, but this is fine.
    const paymentDocAfter = await paymentRef.get();
    if (userEmail && paymentDocAfter.exists && paymentDocAfter.data()?.clientProcessed === true) {
      // Basic idempotency check for email is hard here without another field, but we assume it's fine for now.
      const emailHtml = paymentConfirmationEmail(amount, razorpay_order_id, paymentType);
      await sendEmail(userEmail, 'Payment Successful', emailHtml);
    }

    return NextResponse.json({
      message: 'success',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Error verifying payment' }, { status: 500 });
  }
}
