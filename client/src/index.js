import React from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';


import './index.css';



import Login from './frontend/Login';
import FarmerDashboard from './frontend/FarmerDashboard';
import ValidatorDashboard from './frontend/ValidatorDashboard';
import CustomerDashboard from './frontend/CustomerDashboard';

render(
  <Router history={history}>
    <Switch>
    {/* <Route exact path='/bankaccount' component={AccountData}/> */}
      {/* <Route exact path='/app' component={App} /> */}
      <Route exact path='/' component={Login} />
      <Route path='/farmer' component={FarmerDashboard} />
      <Route path='/validator' component={ValidatorDashboard} />
      <Route path='/customer' component={CustomerDashboard} />
      {/* <Route path='/blocks' component={Blocks} /> */}
      {/* <Route path='/conduct-transaction' component={ConductTransaction} />
      <Route path='/transaction-pool' component={TransactionPool} />
      <Route path="/merkletree" component={MerkleTreeVisualizer}/> */}
      
    </Switch>
  </Router>,
  document.getElementById('root')
);
