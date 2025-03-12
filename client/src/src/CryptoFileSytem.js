import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import { useState, useEffect } from "react";
import React from 'react';
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";
import "./CryptFS.css";
import CopyToClipboardButton from "./components/CopyToClipboardButton";

const CryptoFileSystem=()=> {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    

    
    
    // const provider = new ethers.BrowserProvider(window.ethereum);
    
// It will prompt user for account connections if it isnt connected

    const loadProvider = async () => {
      if (provider) {
        // to open metamsk automatically
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
//changing window while changing metamask
        window.ethereum.on("accountsChanged", () => {
          window.location.reload();
        });

        await provider.send("eth_requestAccounts",[]);
        //to sign a contract 
        const signer = provider.getSigner();

        //current account address
        const address =await signer.getAddress();
        console.log("Account:", address);
        setAccount(address);
        //deployed address
        let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

        const contract = new ethers.Contract(
          contractAddress,
          //upload.json consists of abi of smart contract
          Upload.abi,
          signer
        );
        console.log(contract);
        setContract(contract);
        setProvider(provider);
      } else {
        console.error("Metamask is not installed");
      }
    };
    provider && loadProvider();
  
  }, []);
  return (
    <>
      {!modalOpen && (
        <button className="share" onClick={() => setModalOpen(true)}>
          Share
        </button>
      )}
      {modalOpen && (
        <Modal setModalOpen={setModalOpen} contract={contract}></Modal>
      )}

      <div className="crypt">
        <h1 ><strong className='str'>Agrichain</strong></h1>
        <h1><strong className="str">File</strong> System</h1>
        {/* <div className="bg"></div>
        <div className="bg bg2"></div>
        <div className="bg bg3"></div> */}

        <p className="account">
          Account : {account ? account : "Not connected"}
          
      {/* <textarea readOnly value={textToCopy} /> */}
      <CopyToClipboardButton text={`${account}`} />
   
        </p>
        <FileUpload
          account={account}
          provider={provider}
          contract={contract}
        ></FileUpload>
        <Display contract={contract} account={account}></Display>
      </div>
    </>
  );
}

export default CryptoFileSystem;
