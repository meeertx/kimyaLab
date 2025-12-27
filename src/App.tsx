import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Core Components (Keep these for performance)
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop'
import SimpleAdminRoute from './components/SimpleAdminRoute'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem/NotificationSystem'
import { AuthProvider } from './contexts/AuthContext'

// Lazy loaded Pages - Only load when needed
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const Contact = lazy(() => import('./pages/Contact'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Auth = lazy(() => import('./pages/Auth'))

// Lazy loaded Admin Pages
const AdminAuth = lazy(() => import('./pages/Admin/AdminAuth'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/Admin/AdminProducts'))
const OptimizedAdminProductForm = lazy(() => import('./pages/Admin/OptimizedAdminProductForm'))
const AdminCategories = lazy(() => import('./pages/Admin/AdminCategories'))
const AdminInventory = lazy(() => import('./pages/Admin/AdminInventory'))

// Enhanced Loading components
const PageLoadingSpinner: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-scientific-blue-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-scientific-blue-200 border-t-scientific-blue-600 mb-6"></div>
        <div className="space-y-2">
          <p className="text-scientific-blue-700 font-semibold text-lg">KimyaLab</p>
          <p className="text-scientific-blue-500 text-sm">{t ? t('common.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    </div>
  )
}

const AdminLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-300 border-t-blue-600 mb-4"></div>
        <p className="text-blue-400 font-medium">Admin Panel Yükleniyor...</p>
      </div>
    </div>
  )
}

// Layout wrapper component for better performance
const PublicPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-scientific-blue-50">
    <Navbar />
    <main>{children}</main>
    <Footer />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes with Navbar & Footer */}
              <Route path="/" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Home /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/home" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Home /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/auth" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Auth /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/urunler" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Products /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/kategori/:categorySlug/:subcategorySlug" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><CategoryPage /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/kategori/:categorySlug" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><CategoryPage /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/urun/:productId" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><ProductDetail /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/arama" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><SearchResults /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/hakkimizda" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><About /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/hizmetler" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Services /></PublicPageLayout>
                </Suspense>
              } />
              <Route path="/iletisim" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Contact /></PublicPageLayout>
                </Suspense>
              } />
              
              {/* Admin Auth Route - No Protection Needed */}
              <Route path="/admin/auth" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <AdminAuth />
                </Suspense>
              } />
              
              {/* Protected Admin Routes without Navbar & Footer */}
              <Route path="/admin" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><AdminDashboard /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/dashboard" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><AdminDashboard /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/products" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><AdminProducts /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/products/add" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><OptimizedAdminProductForm /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/products/edit/:id" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><OptimizedAdminProductForm /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/categories" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><AdminCategories /></SimpleAdminRoute>
                </Suspense>
              } />
              <Route path="/admin/inventory" element={
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <SimpleAdminRoute><AdminInventory /></SimpleAdminRoute>
                </Suspense>
              } />
              
              <Route path="*" element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <PublicPageLayout><Home /></PublicPageLayout>
                </Suspense>
              } />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App