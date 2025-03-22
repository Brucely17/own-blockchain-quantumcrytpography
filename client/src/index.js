import React from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';
import App from './components/App';
import Blocks from './components/Blocks';
import ConductTransaction from './components/ConductTransaction';
import TransactionPool from './components/TransactionPool';

import AccountData from './components/AccountData';

import MerkleTreeVisualizer from './components/MerkleTreeVisualizer';
import Login from './components/Login';
import './index.css';
import CryptoFileSystem from './src/CryptoFileSytem';

render(
  <Router history={history}>
    <Switch>
    <Route exact path='/bankaccount' component={AccountData}/>
      <Route exact path='/' component={App} />
      <Route path='/login' component={Login} />
      <Route path='/blocks' component={Blocks} />
      <Route path='/conduct-transaction' component={ConductTransaction} />
      <Route path='/transaction-pool' component={TransactionPool} />
      <Route path="/merkletree" component={MerkleTreeVisualizer}/>
      <Route path='/filesys' component={CryptoFileSystem}/>
    </Switch>
  </Router>,
  document.getElementById('root')
);
