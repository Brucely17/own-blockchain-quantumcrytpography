// import React, { useState } from 'react';


// import './LoginBox.css';
// import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
// import EmailIcon from '@mui/icons-material/Email';
// import LockIcon from '@mui/icons-material/Lock';
// import { useNavigate } from 'react-router-dom';


// function LoginBox() {
//   // const navigate = useNavigate();
//   const [isLoginActive, setIsLoginActive] = useState(true);
//   const [signupData, setSignupData] = useState({ username: '', password: '' });
//   const [loginData, setLoginData] = useState({ username: '', password: '' });

//   const handleSignupClick = () => {
//     setIsLoginActive(false);
//   };
// const handleLoginClick=()=>{
//   setIsLoginActive(true);
// };

//   const handleFormSubmit = (e) => {
//     e.preventDefault();

//     if (isLoginActive) {
//       // Perform login logic
//       console.log('Login data:', loginData);
//       // login();

//     } else {
//       // Perform signup logic
//       console.log('Signup data:', signupData);
//       // signup();
//     }
//   };

//   const handleInputChange = (e, formType) => {
//     const { name, value } = e.target;

//     if (formType === 'signup') {
//       setSignupData((prevData) => ({
//         ...prevData,
//         [name]: value,
//       }));
//     } else if (formType === 'login') {
//       setLoginData((prevData) => ({
//         ...prevData,
//         [name]: value,
//       }));
//     }
//   };

  
//   return (
//     <div className='wrapper'>
//       <div className={`form-box ${isLoginActive ? 'login' : 'register'}`}>
//         <h2>{isLoginActive ? 'Login' : 'Signup'}</h2>
//         <form onSubmit={handleFormSubmit}>
//           {!isLoginActive && (
//             <div className='input-box'>
//               <span className='icon'>
//                 <SupervisedUserCircleIcon />
//               </span>
//               <input
//                 type='text'
//                 name='username'
//                 value={signupData.username}
//                 onChange={(e) => handleInputChange(e, 'signup')}
//                 required
//               />
//               <label>Username</label>
//             </div>
//           )}
//           <div className='input-box'>
//             <span className='icon'>
//               <EmailIcon />
//             </span>
//             <input
//               type='email'
//               name='email'
//               value={isLoginActive ? loginData.email : signupData.email}
//               onChange={(e) => handleInputChange(e, isLoginActive ? 'login' : 'signup')}
//               required
//             />
//             <label>Email</label>
//           </div>
//           <div className='input-box'>
//             <span className='icon'>
//               <LockIcon />
//             </span>
//             <input
//               type='password'
//               name='password'
//               value={isLoginActive ? loginData.password : signupData.password}
//               onChange={(e) => handleInputChange(e, isLoginActive ? 'login' : 'signup')}
//               required
//             />
//             <label>Password</label>
//           </div>
//           <button type='submit' className='btn'>
//             {isLoginActive ? 'Login' : 'Signup'}
//           </button>
//           <div className='login-register'>
//             <p>
//               {isLoginActive ? "Don't have an account?" : 'Already have an account?'}
//               <button onClick={isLoginActive? handleSignupClick : handleLoginClick } className={isLoginActive ? 'register-link' : 'login-link'}>
//                 {isLoginActive ? 'Sign up' : 'Login'}
//               </button>
//             </p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default LoginBox;

import React, { useState } from 'react';
import './LoginBox.css';
import { withRouter } from 'react-router-dom';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
// import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
// import axios from 'axios';

function LoginBox({history}) {
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [signupData, setSignupData] = useState({ state :'signup',username: '', password: '' });
  const [loginData, setLoginData] = useState({ state:'login',username: '', password: '' });

  const handleSignupClick = () => {
    setIsLoginActive(false);
  };

  const handleLoginClick = () => {
    setIsLoginActive(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLoginActive) {
        // Perform login logic (dummy logic for demo)
        console.log('Login data:', loginData);
        console.log('Sending login data to backend...');
        const response = await fetch(`${document.location.origin}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });
        const data = await response.json();
        console.log('login  data to api :', data);
        if (data.status==true){
          console.log('yes its true')
          if (data.bank.length==0){

            history.push(`/bankaccount`);
          }
          else if (data.bank.length!=0){
            history.push(`/?name=${loginData.username}&accountNumber=${data.bank[0]}`);
            // history.push('/')
            history.push('/bankaccount');
          }
        }
        
        
        
      } else {
        // Perform signup logic (dummy logic for demo)
        console.log('Signup data:', signupData);
        
        
        console.log('Sending signup data to backend...');
        const response = await fetch(`${document.location.origin}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupData),
        });
        const data = await response.json();
        console.log('signup   data to api :', data);
        
       
        setIsLoginActive(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;

    if (formType === 'signup') {
      setSignupData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else if (formType === 'login') {
      setLoginData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  return (
    <div className='wrapper'>
      <div className={`form-box ${isLoginActive ? 'login' : 'register'}`}>
        <h2>{isLoginActive ? 'Login' : 'Signup'}</h2>
        <form onSubmit={handleFormSubmit}>
          
            {/* <div className='input-box'>
              <span className='icon'>
                <SupervisedUserCircleIcon />
              </span>
              <input
                type='text'
                name='username'
                value={signupData.username}
                onChange={(e) => handleInputChange(e, 'signup')}
                required
              />
              <label>Username</label>
            </div>
         */}
          <div className='input-box'>
            <span className='icon'>
            <SupervisedUserCircleIcon />
            </span>
            <input
              type='text'
              name='username'
              value={isLoginActive ? loginData.username : signupData.username}
              onChange={(e) => handleInputChange(e, isLoginActive ? 'login' : 'signup')}
              required
            />
            <label>Username</label>
          </div>
          <div className='input-box'>
            <span className='icon'>
              <LockIcon />
            </span>
            <input
              type='password'
              name='password'
              value={isLoginActive ? loginData.password : signupData.password}
              onChange={(e) => handleInputChange(e, isLoginActive ? 'login' : 'signup')}
              required
            />
            <label>Password</label>
          </div>
          <button type='submit' className='btn'>
            {isLoginActive ? 'Login' : 'Signup'}
          </button>
          <div className='login-register'>
            <p>
              {isLoginActive ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={isLoginActive ? handleSignupClick : handleLoginClick} className={isLoginActive ? 'register-link' : 'login-link'}>
                {isLoginActive ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginBox;
