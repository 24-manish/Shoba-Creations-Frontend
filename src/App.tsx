import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './components/RequireAdmin'
import { RequireCustomer } from './components/RequireCustomer'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CommerceUIProvider } from './context/CommerceUIContext'
import { WishlistProvider } from './context/WishlistContext'
import { AdminLayout } from './layouts/AdminLayout'
import { StoreLayout } from './layouts/StoreLayout'
import { AdminHomePage } from './pages/AdminHomePage'
import { AdminInventoryPage } from './pages/AdminInventoryPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminOrdersPage } from './pages/AdminOrdersPage'
import { AdminProductsPage } from './pages/AdminProductsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CustomerOrdersPage } from './pages/CustomerOrdersPage'
import { JournalStoryPage } from './pages/JournalStoryPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductListPage } from './pages/ProductListPage'
import { StoreHomePage } from './pages/StoreHomePage'
import { StoreLoginPage } from './pages/StoreLoginPage'
import { StoreRegisterPage } from './pages/StoreRegisterPage'
import { WishlistPage } from './pages/WishlistPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommerceUIProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/store" replace />} />
                <Route path="/store" element={<StoreLayout />}>
                  <Route index element={<StoreHomePage />} />
                  <Route path="shop" element={<ProductListPage />} />
                  <Route path="shop/:category" element={<ProductListPage />} />
                  <Route path="product/:slug" element={<ProductDetailPage />} />
                  <Route path="journal/:slug" element={<JournalStoryPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="login" element={<StoreLoginPage />} />
                  <Route path="register" element={<StoreRegisterPage />} />
                  {/* Only an account can own an order, so these are behind the guard. */}
                  <Route element={<RequireCustomer />}>
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="orders" element={<CustomerOrdersPage />} />
                  </Route>
                </Route>
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminHomePage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="inventory" element={<AdminInventoryPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </CommerceUIProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
