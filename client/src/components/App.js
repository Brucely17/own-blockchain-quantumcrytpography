import React, { Component,useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import AccountData from './AccountData' 
class App extends Component {
  state = { walletInfo: {} };

  componentDidMount() {
    fetch(`${document.location.origin}/api/wallet-info`)
      .then(response => response.json())
      .then(json => this.setState({ walletInfo: json }));
  }

  render() {
    const { address, balance } = this.state.walletInfo;

    return (
      <div className="App">
        <img className='logo' src={logo}></img>
        <br />
        
        
        <div>Welcome to the blockchain...</div>
        <br />
<<<<<<< HEAD
        <button><Link to ='/bankaccount'>Create Account</Link></button>
=======
        <AccountData/>
>>>>>>> origin/main
        <div><Link to='/blocks'>Blocks</Link></div>
        <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
        <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
        <button><Link to ='/login'> Login</Link></button>
        <br />
        <div className='WalletInfo'>
          <div>Address: {address}</div>
          <div>Balance: {balance}</div>
        </div>
      </div>
    );
  }
}

export default App;
