import React from 'react';
import { createRoot } from 'react-dom/client';
import CheckPage from './CheckPage';
import { MOCK } from './mock';
import 'tdesign-react/es/style/index.css';
import './styles.css';

const el = document.getElementById('root');
if (el) createRoot(el).render(<CheckPage data={MOCK} onSubmit={(p) => console.log('SUBMIT_PAYLOAD', JSON.stringify(p))} />);
