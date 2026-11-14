import { PAYMENTS } from '../config.js'

// Resolves when the purchase is confirmed, rejects otherwise.
// Demo mode confirms immediately and charges nothing.
//
// To take real money with Razorpay (UPI, cards, UPI AutoPay) you need a small server:
//   1. server creates a subscription/order with your secret key and returns its id
//   2. this function opens Razorpay Checkout with PAYMENTS.razorpayKey and that id
//   3. server verifies the payment signature, then marks the account as Plus
// Never unlock Plus from the client alone once real payments are on.
export async function purchase(plan) {
  if (PAYMENTS.mode === 'demo') return { plan: plan.id, demo: true }
  throw new Error('Payments are not configured')
}
