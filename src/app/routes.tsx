import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import App from './App'
import { UploadPage } from '../features/upload/components'
import { MapPage } from '../features/map/components/MapPage'

// Placeholder components - will be implemented in later phases
const EventsPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Events</h1>
    <p className="text-gray-600">Event list will be implemented in Phase 6</p>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'upload',
        element: <UploadPage />,
      },
      {
        path: 'map/:eventId',
        element: <MapPage />,
      },
    ],
  },
])
