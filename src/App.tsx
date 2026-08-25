import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { FeedPage } from './pages/FeedPage'
import { ListPage } from './pages/ListPage'
import { HistoryPage } from './pages/HistoryPage'
import { NewListPage } from './pages/NewListPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AuthoringSignInPage } from './pages/AuthoringSignInPage'

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <FeedPage /> },
        { path: '/lists/:id', element: <ListPage /> },
        { path: '/lists/:id/history', element: <HistoryPage /> },
        { path: '/new', element: <NewListPage /> },
        { path: '/authoring', element: <AuthoringSignInPage /> },
        { path: '/404', element: <NotFoundPage /> },
        { path: '*', element: <Navigate to="/404" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)

export default function App() {
  return <RouterProvider router={router} />
}
