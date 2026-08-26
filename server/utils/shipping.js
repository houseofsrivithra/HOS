/**
 * Calculates delivery/shipping charge based on delivery address:
 * - Inside Chennai: ₹99
 * - Outside Chennai (other districts in Tamil Nadu): ₹149
 * - Other states outside Tamil Nadu: ₹199
 *
 * @param {Object} address - { city, state, pincode, address }
 * @returns {number} Shipping charge in INR
 */
function calculateShipping(address = {}) {
  const city = (address.city || '').trim().toLowerCase();
  const state = (address.state || '').trim().toLowerCase();
  const pincode = (address.pincode || '').toString().trim();
  const addressText = (address.address || '').toLowerCase();

  // 1. Inside Chennai: ₹99
  // Check city name, address text, or Chennai PIN codes (600001 - 600132)
  const isChennai =
    city.includes('chennai') ||
    city.includes('madras') ||
    addressText.includes('chennai') ||
    addressText.includes('madras') ||
    /^600\d{3}$/.test(pincode);

  if (isChennai) {
    return 99;
  }

  // 2. Outside Chennai, but inside Tamil Nadu: ₹149
  // State name matching Tamil Nadu / TN, or Tamil Nadu postal circle PIN codes (601xxx - 643xxx)
  const isTamilNadu =
    state.includes('tamil') ||
    state.includes('nadu') ||
    state === 'tn' ||
    addressText.includes('tamil nadu') ||
    addressText.includes('tamilnadu') ||
    /^(60[1-9]|6[1-4]\d)\d{3}$/.test(pincode);

  if (isTamilNadu) {
    return 149;
  }

  // 3. Other states outside Tamil Nadu: ₹199
  return 199;
}

module.exports = { calculateShipping };
