import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getProducts = await AsyncStorage.getItem(
        '@goMarketplace:Cart:products',
      );
      if (getProducts) {
        setProducts(JSON.parse(getProducts) as Product[]);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@goMarketplace:Cart:products',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);


  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        const newProduct = { ...product };
        if (newProduct.id === id) newProduct.quantity += 1;
        return newProduct;
      });
      setProducts(newProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const hasProduct = products.find(p => p.id === product.id);
      if (hasProduct) {
        await increment(product.id);
      } else {
        const newProducts = [...products, { ...product, quantity: 1 }];
        setProducts(newProducts);
      }
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);
      if (product) {
        let newProducts: Product[];
        if (product.quantity === 1) {
          newProducts = products.filter(prod => prod.id !== id);
        } else {
          newProducts = products.map(prod => {
            const newProduct = { ...prod };
            if (newProduct.id === id) newProduct.quantity -= 1;
            return newProduct;
          });
        }
        setProducts(newProducts);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
