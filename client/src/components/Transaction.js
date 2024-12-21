// import React from 'react';

// const Transaction = ({ transaction }) => {
//   const { input, outputMap } = transaction;
//   const recipients = Object.keys(outputMap);
// // const recbal=
//   return (
//     <div className='Transaction'>
//       <div>From: {`${input.address.substring(0, 20)}...`} | Balance: {input.amount}</div>
//       {
//         recipients.map(recipient => (
//           <div key={recipient}>
//             To: {`${recipient.substring(0, 20)}...`} | Sent  {outputMap[recipient]}|balance:{1755}
            
            

//           </div>

//         ))
//       }
//     </div>
//   );
// }

// export default Transaction;
import React from 'react';
import './Trans.css';
const Transaction = ({ transaction }) => {
  const { input, outputMap } = transaction;
  const recipients = Object.keys(outputMap);

  return (
   
    <div className="Transaction">
      <div className='transtop'>
        From: <span className="balance">{`${input.address.substring(0, 20)}...`}</span> 
        | Balance: <span className="balance">{input.amount}</span>
      </div>
      {
        recipients.map(recipient => (
          <div key={recipient} className='transtop'>
            To: <span className="recipient">{`${recipient.substring(0, 20)}...`}</span> 
            | Sent: {outputMap[recipient]} 
            | Balance: <span className="balance">{recipient.balance}</span>
          </div>
        ))
      }
    </div>
    
  );
}

export default Transaction;
