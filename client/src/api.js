export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://house-of-srivithra-6yqw.onrender.com'
    : 'http://localhost:3001'
);
const API_BASE = `${API_URL}/api`;

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const sessionId = getSessionId();
  headers['X-Session-Id'] = sessionId;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the server is running.');
    }
    throw error;
  }
}

// Session ID for cart management
export function getSessionId() {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

// Convenience methods
export const apiGet = (endpoint) => api(endpoint, { method: 'GET' });

export const apiPost = (endpoint, data) => api(endpoint, {
  method: 'POST',
  body: data instanceof FormData ? data : JSON.stringify(data),
});

export const apiPut = (endpoint, data) => api(endpoint, {
  method: 'PUT',
  body: data instanceof FormData ? data : JSON.stringify(data),
});

export const apiDelete = (endpoint) => api(endpoint, { method: 'DELETE' });

export async function exportOrdersToExcel() {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/orders/export/excel`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to export orders (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  let filename = `fashion-store-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}


// Format currency for INR
export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Calculate discount percentage
export function getDiscount(original, current) {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

// Product image URL helper
export function getProductImage(images, index = 0) {
  if (!images || images.length === 0) {
    // Return category-based placeholder
    return '/images/products/saree.png';
  }
  const img = images[index] || images[0];
  if (img.startsWith('http') || img.startsWith('/images')) return img;
  return `${API_URL}${img}`;
}

// Category image mapping
export const CATEGORY_IMAGES = {
  'Sarees': '/images/products/saree.png',
  'Kurtas & Suits': '/images/products/kurta.png',
  'Lehengas': '/images/products/lehenga.png',
  'Dresses': '/images/products/kurta.png',
  'Men Ethnic': '/images/products/mens_ethnic.png',
  'Sherwani': '/images/products/sherwani.png',
  'Accessories': '/images/products/saree.png',
};

export default api;
