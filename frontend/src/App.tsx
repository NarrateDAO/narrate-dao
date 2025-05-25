import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { Web3Provider } from './context/Web3Context';
import theme from './theme';

// 页面组件
import HomePage from './pages/HomePage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import ProposalsListPage from './pages/ProposalsListPage';
import CreateProposalPage from './pages/CreateProposalPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// 布局组件
import Layout from './components/Layout';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Web3Provider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/proposals" element={<ProposalsListPage />} />
              <Route path="/proposals/:id" element={<ProposalDetailPage />} />
              <Route path="/create" element={<CreateProposalPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </Router>
      </Web3Provider>
    </ChakraProvider>
  );
}

export default App;
