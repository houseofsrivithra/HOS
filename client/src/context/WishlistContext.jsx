import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const data = await apiGet('/wishlist');
      setWishlistItems(data.items || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!user) return false;
    try {
      const data = await apiPost('/wishlist', { product_id: productId });
      setWishlistItems(data.items || []);
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;
    try {
      const data = await apiDelete(`/wishlist/${productId}`);
      setWishlistItems(data.items || []);
      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      return false;
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    const isWished = wishlistItems.some(i => i.product_id === productId);
    if (isWished) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(i => i.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
