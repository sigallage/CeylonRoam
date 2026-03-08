// In-memory OTP storage
// Structure: { email: { otp, expiresAt } }
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with 10 minutes expiration
const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, { otp, expiresAt });
  
  console.log('\n📥 STORING OTP:');
  console.log('  Email:', email);
  console.log('  OTP:', otp);
  console.log('  OTP Type:', typeof otp);
  console.log('  Expires At:', new Date(expiresAt).toISOString());
  console.log('  Current Store Size:', otpStore.size);
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    otpStore.delete(email);
  }, 10 * 60 * 1000);
};

// Verify OTP
const verifyOTP = (email, otp) => {
  console.log('\n🔍 VERIFYING OTP:');
  console.log('  Email from request:', email);
  console.log('  OTP from request:', otp);
  console.log('  OTP Type from request:', typeof otp);
  console.log('  Store Size:', otpStore.size);
  console.log('  All stored emails:', Array.from(otpStore.keys()));
  
  const stored = otpStore.get(email);
  
  console.log('  Found stored data:', stored ? 'YES' : 'NO');
  if (stored) {
    console.log('  Stored OTP:', stored.otp);
    console.log('  Stored OTP Type:', typeof stored.otp);
    console.log('  OTP Match:', stored.otp === otp);
    console.log('  OTP Match (string):', stored.otp === String(otp));
    console.log('  Is Expired:', Date.now() > stored.expiresAt);
  }
  
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP is valid, remove it from store
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP for an email
const clearOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  clearOTP,
};
