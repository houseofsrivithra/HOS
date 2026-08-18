/**
 * Utility to dynamically load the Razorpay Checkout script if not already present.
 * @returns {Promise<boolean>} Resolves to true when loaded successfully, false on error.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // If already loaded in window
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag already exists in document
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    // Create and append script tag
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
