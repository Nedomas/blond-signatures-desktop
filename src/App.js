import React, { Component } from 'react';

const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

class App extends Component {
  componentDidMount() {
    ipcRenderer.on('debug-alert', function(e, data) { alert(JSON.stringify(data)) });
    ipcRenderer.send('connect-signature-key');
  }

  render() {
    return (
      <div>
        Command + G
      </div>
    );
  }
}

export default App;
