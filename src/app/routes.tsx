import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import { Loading } from '../shared/components'

// Lazy load heavy components for better initial load time
const UploadPage = lazy(() => import('../features/upload/components').then(m => ({ default: m.UploadPage })))
const MapPage = lazy(() => import('../features/map/components/MapPage').then(m => ({ default: m.MapPage })))
const EventsPage = lazy(() => import('../features/events/components').then(m => ({ default: m.EventsPage })))
const ImportEvent = lazy(() => import('../features/events/components').then(m => ({ default: m.ImportEvent })))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EventsPage />
          </Suspense>
        ),
      },
      {
        path: 'import',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ImportEvent />
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UploadPage />
          </Suspense>
        ),
      },
      {
        path: 'map/:eventId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MapPage />
          </Suspense>
        ),
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
})
