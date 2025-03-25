// src/components/CSVUpload.js
import React, { useState } from 'react';
import Papa from 'papaparse';
import './CSVUpload.css';
const CSVUpload = ({ onDataParsed }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setError('');
  };

  const handleParse = () => {
    if (!csvFile) {
      setError('Please upload a CSV file.');
      return;
    }
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("Parsed CSV Data:", result.data);
        onDataParsed(result.data);
      },
      error: (err) => {
        setError('Error parsing CSV: ' + err.message);
      }
    });
  };

  return (
    <div className="csv-upload-container">
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleParse}>Parse CSV</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CSVUpload;
