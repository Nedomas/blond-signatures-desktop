const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipcMain = electron.ipcMain;
const globalShortcut = electron.globalShortcut;
const clipboard = electron.clipboard;

const ApolloClient = require('apollo-client');
const ApolloLinkHttp = require('apollo-link-http');
const ApolloCacheInmemory = require('apollo-cache-inmemory');
const fetch = require('node-fetch');
const gql = require('graphql-tag');

const robot = require('robotjs');

const _ = require('lodash');

const client = new ApolloClient.ApolloClient({
  link: new ApolloLinkHttp.HttpLink({
    uri: 'http://localhost:4005/graphql',
    fetch,
  }),
  cache: new ApolloCacheInmemory.InMemoryCache(),
});

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  mainWindow.loadURL(startUrl);
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
      app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const clipboardFormats = [
  {
    key: 'text',
    write: 'writeText',
    read: 'readText',
  },
  {
    key: 'html',
    write: 'writeHTML',
    read: 'readHTML',
  },
  {
    key: 'rtf',
    write: 'writeRTF',
    read: 'readRTF',
  },
  {
    key: 'image',
    write: 'writeImage',
    read: 'readImage',
  },
];

const debugAlert = (what) => {
  mainWindow.webContents.send('debug-alert', what);
};

ipcMain.on('connect-signature-key', (e, config) => {
  const pasteSignature = () => {
    mainWindow.setProgressBar(0);

    const mutation = gql`
      mutation generateSignature {
        generateSignature
      }
    `;

    client.mutate({ mutation }).then((result) => {
      try {
        mainWindow.setProgressBar(0.5);

        const clipboardBackup = {};

        _.each(clipboardFormats, (format) => {
          clipboardBackup[format.key] = clipboard[format.read]();
        });

        clipboard.writeHtml(result.data.generateSignature);
        robot.keyTap('v', 'command');

        mainWindow.setProgressBar(1);
      }
      catch(e) {
        debugAlert(e.message + e.stack);
      }
      finally {
        _.each(clipboardFormats, (format) => {
          clipboard[format.write](clipboardBackup[format.key]);
        });

        mainWindow.setProgressBar(-1);
        setTimeout(() => {
          mainWindow.setProgressBar(-1);
        }, 1000);
      }
    });
  };

  globalShortcut.register('CmdOrCtrl+G', pasteSignature);
});
