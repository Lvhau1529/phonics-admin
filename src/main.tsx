import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
// antd 5 chính thức hỗ trợ React 16–18; patch này cho React 19 (https://u.ant.design/v5-for-19)
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
