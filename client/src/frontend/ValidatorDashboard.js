// src/components/ValidatorDashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ValidatorDashboard.css";
import WalletInfo from "./Wallet";

const TransactionCard = ({ tx, validatorId, handleValidation, handleFileChange }) => {
  const [showIotData, setShowIotData] = useState(false);
  const [iotData, setIotData] = useState(null);

  // Fetch IoT data from IPFS if it's a hash string
  useEffect(() => {
    if (typeof tx.iotData === 'string') {
      fetch(`${document.location.origin}/api/ipfs/${tx.iotData}`)
        .then((res) => res.json())
        .then((data) => setIotData(data))
        .catch((err) => console.error("Error retrieving IoT data:", err));
    } else {
      setIotData(tx.iotData);
    }
  }, [tx.iotData]);

  const toggleIotData = () => setShowIotData(!showIotData);

  return (
    <div className="transaction-card">
      <h3>Transaction ID: {tx.id}</h3>
      <p>
        <strong>Farmer ID:</strong> {tx.input.address}
      </p>
      <p>
        <strong>Price per Kg:</strong> ${tx.pricePerKg} |{" "}
        <strong>Quantity:</strong> {tx.quantity} kg
      </p>
      <div className="iot-data-section">
        <button onClick={toggleIotData} className="toggle-btn">
          {showIotData ? "Hide IoT Data" : "Show IoT Data"}
        </button>
        {showIotData && (
          <div className="iot-data">
            {iotData ? (
              <pre>{JSON.stringify(iotData, null, 2)}</pre>
            ) : (
              <p>Loading IoT data...</p>
            )}
          </div>
        )}
      </div>
      <div className="csv-upload-section">
        <p>Upload CSV file with physical sample data:</p>
        <label htmlFor={`csvInput-${tx.id}`} className="file-label">
          Choose CSV File
        </label>
        <input
          id={`csvInput-${tx.id}`}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>
      <div className="validation-buttons">
        <button onClick={() => handleValidation(tx.id, "APPROVED")}>
          Approve
        </button>
        <button onClick={() => handleValidation(tx.id, "REJECTED")}>
          Reject
        </button>
      </div>
    </div>
  );
};

const ValidatorDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [sampleData, setSampleData] = useState(null); // Parsed CSV data for physical samples
  const [validatorId, setValidatorId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [walletInfo, setWalletInfo] = useState({});

  // Fetch validator's wallet info on mount
  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const res = await fetch(`${document.location.origin}/api/wallet-info`);
        const data = await res.json();
        setValidatorId(data.address);
        setWalletInfo(data);
      } catch (error) {
        console.error("Error fetching wallet info:", error);
      }
    };
    fetchWalletInfo();
  }, []);

  // Fetch transactions assigned to this validator
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${document.location.origin}/api/transaction-pool-map`);
        const data = await res.json();
        // Filter transactions that include the validator's public key in assignedValidators.
        const txList = Object.values(data).filter(
          (tx) =>
            tx.assignedValidators &&
            tx.assignedValidators.includes(validatorId)
        );
        setTransactions(txList);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };
    if (validatorId) {
      const interval = setInterval(fetchTransactions, 5000);
      return () => clearInterval(interval);
    }
  }, [validatorId]);

  // Handle CSV file selection for physical sample data
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Parse CSV function (assumes first row headers, second row data)
  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) return null;
    const headers = lines[0].split(",").map((h) => h.trim());
    const values = lines[1].split(",").map((v) => v.trim());
    let dataObj = {};
    headers.forEach((header, index) => {
      dataObj[header] = isNaN(values[index]) ? values[index] : Number(values[index]);
    });
    return dataObj;
  };

  // Handle transaction validation (approve/reject)
  const handleValidation = async (transactionId, approval) => {
    if (!selectedFile) {
      alert("Please upload sample CSV data before validation.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target.result;
      const parsedSampleData = parseCSV(csvText);
      if (!parsedSampleData) {
        setResponseMessage("Invalid CSV format for sample data.");
        return;
      }
      setSampleData(parsedSampleData);
      const payload = {
        validatorId,
        transactionId,
        sampleData: parsedSampleData,
        approval,
      };
      try {
        const response = await fetch(`${document.location.origin}/api/validate-produce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        setResponseMessage(`Transaction ${transactionId} has been ${approval}.`);
      } catch (error) {
        setResponseMessage("Error validating transaction: " + error.message);
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="validator-container">
      <h1>Validator Dashboard</h1>
      <WalletInfo
        address={walletInfo.address}
        balance={walletInfo.balance}
        staked={walletInfo.staked}
      />
      <p>Validator ID: {validatorId || "Fetching..."}</p>
      <p>Review and validate produce transactions.</p>
      
      <div className="transactions">
        {transactions.length === 0 ? (
          <p>No pending transactions.</p>
        ) : (
          transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
              validatorId={validatorId}
              handleValidation={handleValidation}
              handleFileChange={handleFileChange}
            />
          ))
        )}
      </div>
      {responseMessage && <p className="response">{responseMessage}</p>}
      <div>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default ValidatorDashboard;


// // src/components/ValidatorDashboard.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// // import './Dashboard.css'; // Adjust if you have a separate CSS file for dashboards
// import WalletInfo from './Wallet';
// import './ValidatorDashBoard.css';
// import CSVUpload from './CSVUpload';

// const ValidatorDashboard = () => {
//   const [transactions, setTransactions] = useState([]);
//   const [sampleData, setSampleData] = useState(null);
//   const [responseMessage, setResponseMessage] = useState('');
//   const [validatorAddress, setValidatorAddress] = useState('');
//    const [walletInfo, setWalletInfo] = useState({});

//   // Fetch wallet info on mount to get validatorAddress
//   useEffect(() => {
//     const fetchWalletInfo = async () => {
//       try {
//         const res = await fetch(`${document.location.origin}/api/wallet-info`);
//         const data = await res.json();
//         setValidatorAddress(data.address);
//         setWalletInfo(data);
//       } catch (err) {
//         console.error("Error fetching wallet info:", err);
//       }
//     };
//     fetchWalletInfo();
//   }, []);

//   // Fetch transactions assigned to this validator, once validatorAddress is available.
//   useEffect(() => {
//     const fetchTransactions = async () => {
//       try {
//         const res = await fetch(`${document.location.origin}/api/transaction-pool-map`);
//         const data = await res.json();
//         // Filter transactions that include the validator's public key in assignedValidators.
//         const txList = Object.values(data).filter(
//           tx => tx.assignedValidators && tx.assignedValidators.includes(validatorAddress)
//         );
//         setTransactions(txList);
//       } catch (err) {
//         console.error("Error fetching transactions:", err);
//       }
//     };
//     if (validatorAddress) {
//       const interval = setInterval(fetchTransactions, 5000);
//       return () => clearInterval(interval);
//     }
//   }, [validatorAddress]);

//   const handleValidate = async (transactionId, approval) => {
//     setResponseMessage('');
//     const payload = {
//       validatorId: validatorAddress,
//       transactionId,
//       sampleData,
//       approval
//     };
//     console.log(payload);
//     try {
//       const res = await fetch(`${document.location.origin}/api/validate-produce`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       const data = await res.json();
//       setResponseMessage(`Validation successful for transaction ${transactionId}`);
//       console.log('Validation response:', data);
//     } catch (err) {
//       setResponseMessage('Validation failed: ' + err.message);
//     }
//   };

//   return (
//     <div className="dashboard-container">
//       <h2>Validator Dashboard</h2>
//       <WalletInfo
//         address={walletInfo.address}
//         balance={walletInfo.balance}
//         staked={walletInfo.staked}
//       />
      
//       {responseMessage && <p>{responseMessage}</p>}
//       <h3>Pending Transactions for Validation</h3>
//       {transactions.length === 0 ? (
//         <p>No transactions assigned for validation.</p>
//       ) : (
//         <ul>
//           {transactions.map(tx => (
//             <li key={tx.id}>
//               <p>Transaction ID: {tx.id}</p>
//               <p>IoT Data: {tx.iotData}</p>
//               <div>
//               <h3>Upload Physical Sample Data (CSV)</h3>
//       <CSVUpload onDataParsed={data => setSampleData(data)} />
//       {sampleData && (
//         <div>
//           <h4>Parsed Data:</h4>
//           <pre>{JSON.stringify(sampleData, null, 2)}</pre>
//         </div>
//       )}
//                 <button onClick={() => handleValidate(tx.id, "APPROVED")}>Approve</button>
//                 <button onClick={() => handleValidate(tx.id, "REJECTED")}>Reject</button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//       <div>
//         <Link to="/">Back to Home</Link>
//       </div>
//     </div>
//   );
// };

// export default ValidatorDashboard;
