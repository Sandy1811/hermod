import React from 'react';
import logo from './logo.svg';
import './App.css';
import HermodReactSatellite from './HermodReactSatellite.js'
function App() {
	return (
    <div className="App">
     	<HermodReactSatellite position="topright" mqttServer="ws://localhost:9001" siteId="default" subscribe="hermod/default/#" />
    </div>
  );
}

export default App;
