import { init as initPlausible } from '@plausible-analytics/tracker'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (bundled by Vite, never fetched from a CDN).
// Fraunces "full" includes the opsz, wght, SOFT and WONK variation axes.
import '@fontsource-variable/fraunces/full.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import './styles.css'
import { routeTree } from './routeTree.gen'

initPlausible({
  domain: 'isavaloniadry.gartz.dev',
  endpoint: 'https://apps.gartz.dev/api/event',
})

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, ''),
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
