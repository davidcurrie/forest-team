import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import App from './App'
import { UploadPage } from '../features/upload/components'
import { MapPage } from '../features/map/components/MapPage'
import { EventsPage } from '../features/events/components'

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
