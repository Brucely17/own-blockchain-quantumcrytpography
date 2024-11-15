// import React, { Component,useState } from 'react';
// import { Link } from 'react-router-dom';
// import logo from '../assets/logo.png';
// import AccountData from './AccountData' 
// class App extends Component {
//   state = { walletInfo: {} };

//   componentDidMount() {
//     fetch(`${document.location.origin}/api/wallet-info`)
//       .then(response => response.json())
//       .then(json => this.setState({ walletInfo: json }));
//   }

//   render() {
//     const { address, balance } = this.state.walletInfo;

//     return (
//       <div className="App">
//         <img className='logo' src={logo}></img>
//         <br />
        
        
//         <div>Welcome to the blockchain...</div>
//         <br />
//         <button><Link to ='/bankaccount'>Create Account</Link></button>
//         <div><Link to='/blocks'>Blocks</Link></div>
//         <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
//         <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
//         <button><Link to ='/login'> Login</Link></button>
//         <br />
//         <div className='WalletInfo'>
//           <div>Address: {address}</div>
//           <div>Balance: {balance}</div>
//         </div>
//       </div>
//     );
//   }
// }

// export default App;
// import React, { Component,useState } from 'react';
// import { Modal, Card } from 'antd';
// import { Link } from 'react-router-dom';
// import logo from '../assets/logo.png';
// import AccountData from './AccountData' 
// class App extends Component {
//   state = { walletInfo: {} };

//   componentDidMount() {
//     fetch(`${document.location.origin}/api/wallet-info`)
//       .then(response => response.json())
//       .then(json => this.setState({ walletInfo: json }));
//   }

//   render() {
//     const { address, balance } = this.state.walletInfo;

//     return (
//       <div className="App">
//         <img className='logo' src={logo}></img>
//         <br />
        
        
//         <div>Welcome to the blockchain...</div>
//         <br />
//         <button><Link to ='/bankaccount'>Create Account</Link></button>
//         <div><Link to='/blocks'>Blocks</Link></div>
//         <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
//         <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
//         <button><Link to ='/login'> Login</Link></button>
//         <br />
//         <div className='WalletInfo'>
//           <div>Address: {address}</div>
//           <div>Balance: {balance}</div>
//         </div>
//       </div>
//     );
//   }
// }

// export default App;
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Card } from 'antd';
import logo from '../assets/logo.png';
import ClipBoardCopy from './ClipBoardCopy';
import AccountData from './AccountData';

class App extends Component {
  state = { walletInfo: {}, selectedLink: null, modalVisible: false };

  componentDidMount() {
    fetch(`${document.location.origin}/api/wallet-info`)
      .then(response => response.json())
      .then(json => this.setState({ walletInfo: json }));
  }

  openModal = (selectedLink) => {
    this.setState({ selectedLink, modalVisible: true });
  };

  closeModal = () => {
    this.setState({ modalVisible: false });
  };

  render() {
    const { address, balance } = this.state.walletInfo;
    const { selectedLink, modalVisible } = this.state;

    const cardLinks = [
      { title: 'Create Account', to: '/bankaccount' },
      { title: 'Blocks', to: '/blocks' },
      {title:"MerkleTree",to:"/merkletree"},
      { title: 'Conduct a Transaction', to: '/conduct-transaction' },
      { title: 'Transaction Pool', to: '/transaction-pool' },
      { title: 'Login', to: '/login' },
    ];

    return (
      <div className="App">
        <img className="logo" src={logo} alt="logo" />
        
<<<<<<< HEAD
        <div className="card-container">
          {cardLinks.map((link, index) => (
            <Card
              key={index}
              title={link.title}
              onClick={() => this.openModal(link)}
              style={{ width: 300, margin: '10px', cursor: 'pointer' }}
            >
              <Link to={link.to}>Details</Link>
            </Card>
          ))}
        </div>

=======
        
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
>>>>>>> 151f5aa205b7a3a77b32b69d432fd2d8543d4f83
        <div className='WalletInfo'>
        <>
          <div>Address: {address}</div>

          <ClipBoardCopy text={address} />
        </>
          <div>Balance: {balance}</div>
        </div>

        <Modal
          title={selectedLink ? selectedLink.title : ''}
          visible={modalVisible}
          onCancel={this.closeModal}
        >
          {selectedLink && (
            <div>
              You selected: <strong>{selectedLink.title}</strong>
              
              
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default App;
// import React, { Component } from 'react';
// import { Modal, Card } from 'antd';
// import logo from '../assets/logo.png';
// import AccountData from './AccountData';
// import Blocks from './Blocks'
// import ConductTransaction from './ConductTransaction';
// import TransactionPool from './TransactionPool';
// import LoginMain from '../LoginBoxfile/LoginMain';
// class App extends Component {
//   state = {
//     walletInfo: {},
//     selectedComponent: null,
//     modalVisible: false,
//   };

//   componentDidMount() {
//     const urlParams = new URLSearchParams(window.location.search);
//   const username = urlParams.get('name');
//   const accountNumber = urlParams.get('accountNumber');
//     fetch(`${document.location.origin}/api/wallet-info`,{
//       method:'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       // You can send any necessary data in the request body, if needed
//       body: JSON.stringify( {bankAccountId:accountNumber} ),
//     })
//       .then((response) => response.json())
//       .then((json) => this.setState({ walletInfo: json }));
//   }

//   openModal = (selectedComponent) => {
//     this.setState({ selectedComponent, modalVisible: true });
//   };

//   closeModal = () => {
//     this.setState({ modalVisible: false });
//   };

//   render() {
//     const { name,address, balance } = this.state.walletInfo;
//     const { selectedComponent, modalVisible } = this.state;

//     const components = [
//       {
//         title: 'Create Account',
//         content: <AccountData />, // Replace with your component content
//       },
//       {
//         title: 'Blocks',
//         content: <Blocks/>, // Replace with your component content
//       },
//       {
//         title: 'Conduct a Transaction',
//         content: <ConductTransaction/>, // Replace with your component content
//       },
//       {
//         title: 'Transaction Pool',
//         content: <TransactionPool/>, // Replace with your component content
//       },
//       {
//         title: 'Login',
//         content: <LoginMain/>, // Replace with your component content
//       },
//     ];

//     return (
//       <div className="App">
//         <img className="logo" src={logo} alt="logo" />
//         <br />
//         <div>Welcome to the blockchain...</div>
//         <br />
//         <div className="component-cards">
//           {components.map((component, index) => (
//             <Card
//               key={index}
//               title={component.title}
//               onClick={() => this.openModal(component)}
//               style={{ cursor: 'pointer', margin: '10px', width: 300 }}
//             >

//               Preview
//             </Card>
//           ))}
//         </div>

//         <div className="WalletInfo">
//         <div>Name:{name}</div>
//           <div>Address:{address.slice(0, 4)}...{address.slice(38)}</div>
//           <div>Balance: {balance}</div>
//         </div>

//         <Modal
//           title={selectedComponent ? selectedComponent.title : ''}
//           visible={modalVisible}
//           onCancel={this.closeModal}
//         >
//           {selectedComponent && selectedComponent.content}
//         </Modal>
//       </div>
//     );
//   }
// }

// export default App;
