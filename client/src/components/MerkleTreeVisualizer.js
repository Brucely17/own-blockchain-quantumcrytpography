import React, { useEffect, useState } from 'react';
import './MerkleTree.css';

const MerkleTreeVisualizer = () => {
  const [merkleTreeData, setMerkleTreeData] = useState(null);

  useEffect(() => {
    // Fetch Merkle Tree data from the server
    fetch('/api/merkle-tree')
      .then(response => response.json())
      .then(data => setMerkleTreeData(data))
      .catch(error => console.error("Error fetching Merkle Tree data:", error));
  }, []);

  if (!merkleTreeData) {
    return <div className="loading">Loading Merkle Tree...</div>;
  }

  const renderTree = (levels) => {
    return levels.map((level, index) => (
      <div key={index} style={{ margin: '20px 0' }}>
        <h4 className="levelHeader">Level {index}</h4>
        <div className="levelContainer">
          {level.map((hash, idx) => (
            <div
              key={idx}
              className="node"
              style={{ backgroundColor: `hsl(${index * 60}, 80%, 80%)` }}
            >
              <code>{hash}</code>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="container">
      <h2 className="header">Merkle Tree Visualization</h2>
      <div className="merkleRoot">
        <strong>Merkle Root:</strong> {merkleTreeData.merkleRoot}
      </div>
      <div className="treeContainer">
        {renderTree(merkleTreeData.levels)}
      </div>
    </div>
  );
};

export default MerkleTreeVisualizer;
