import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

import { App } from './App';
import store from './redux/store';
import '@/lang/i18n';
import '@/assets/styles/app.scss';

const rootElement = document.getElementById('root');
const persistor = persistStore(store);

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.Fragment>,
  rootElement
);
