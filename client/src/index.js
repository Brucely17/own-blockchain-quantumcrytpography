import React from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';
import App from './components/App';
import Blocks from './components/Blocks';
import ConductTransaction from './components/ConductTransaction';
import TransactionPool from './components/TransactionPool';
import LoginMain from './LoginBoxfile/LoginMain';
import AccountData from './components/AccountData';
<<<<<<< HEAD
import MerkleTreeVisualizer from './components/MerkleTreeVisualizer';
=======
>>>>>>> 151f5aa205b7a3a77b32b69d432fd2d8543d4f83
import './index.css';

render(
  <Router history={history}>
    <Switch>
    <Route exact path='/bankaccount' component={AccountData}/>
      <Route exact path='/' component={App} />
      <Route exact path='/login' component={LoginMain}/>
      <Route path='/blocks' component={Blocks} />
      <Route path='/conduct-transaction' component={ConductTransaction} />
      <Route path='/transaction-pool' component={TransactionPool} />
      <Route path="/merkletree" component={MerkleTreeVisualizer}/>
    </Switch>
  </Router>,
  document.getElementById('root')
);
