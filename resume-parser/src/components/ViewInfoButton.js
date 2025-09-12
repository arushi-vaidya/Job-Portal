import React from 'react';

const ViewInfoButton = ({ onOpen }) => (
  <div className="view-info">
    <button className="view-info-button" onClick={onOpen}>View Data</button>
  </div>
);

export default ViewInfoButton;
