// Every environment variable the server reads, in one place.
//
// Values are read when the function is called (not when the file is
// imported), so scripts that load .env.local late still see them, and
// Next.js never bakes them into a build.
//
// Future variables (Razorpay keys, Cloudinary, WhatsApp) belong here too.
// Never prefix secrets with NEXT_PUBLIC_: that would send them to browsers.

export function serverEnv() {
  return {
    /** MongoDB Atlas connection string. Optional: without it the app runs on mock data. */
    mongodbUri: process.env.MONGODB_URI || undefined,
  };
}
