import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, getSessionId } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        itemCount: (action.payload.items || []).reduce((sum, item) => sum + item.quantity, 0),
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const sessionId = getSessionId();
      const data = await apiGet(`/cart?session_id=${sessionId}`);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1, size = '', color = '') => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const sessionId = getSessionId();
      const data = await apiPost('/cart', {
        session_id: sessionId,
        product_id: productId,
        quantity,
        size,
        color,
      });
      dispatch({ type: 'SET_CART', payload: data });
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return false;
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const sessionId = getSessionId();
      const data = await apiPut(`/cart/${itemId}?session_id=${sessionId}`, { quantity });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      await apiDelete(`/cart/${itemId}`);
      await fetchCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      await apiDelete(`/cart?session_id=${sessionId}`);
      dispatch({ type: 'CLEAR_CART' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  return (
    <CartContext.Provider value={{
      ...state,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
