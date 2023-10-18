import React from 'react'
import { Link,withRouter } from 'react-router-dom';
// import HouseIcon from '@mui/icons-material/House';

import LoginBox from './LoginBox';
import './LoginMain.css'

const LoginWithRouter = withRouter(LoginBox);
function LoginMain() {
//   const navigate=useNavigate();
//     const home =()=>{
//   navigate("/home");
//     }
  return (
    <div className="loginmain">
     
    
    {/* <HouseIcon  /> */}
    {/* <button class='Header__button' onClick={}>Home</button> */}
    {/* <button class='Header__button'><Link to ='/'> Home</Link></button> */}
   
    
    
       
      <LoginWithRouter />
    {/* <AuthDetails /> */}
    </div>
  )
}

export default LoginMain;
