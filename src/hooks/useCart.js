import { useState, useEffect, useCallback } from 'react';

const CART_KEY = 'pupuk_cart';

function getCartFromStorage() {
    try {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveCartToStorage(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function useCart() {
    const [items, setItems] = useState(getCartFromStorage);

    useEffect(() => {
        saveCartToStorage(items);
    }, [items]);

    const addItem = useCallback((product, qty = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.id === product.id
                        ? { ...i, quantity: i.quantity + qty }
                        : i
                );
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                image_url: product.image_url,
                selling_price: product.selling_price,
                unit: product.unit,
                quantity: qty,
            }];
        });
    }, []);

    const removeItem = useCallback((productId) => {
        setItems(prev => prev.filter(i => i.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity < 1) return;
        setItems(prev =>
            prev.map(i =>
                i.id === productId ? { ...i, quantity } : i
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items.reduce((sum, i) => sum + (i.selling_price * i.quantity), 0);

    return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount };
}
