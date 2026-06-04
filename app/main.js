const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

let mainWindow;
let loadingWindow;
let nextServer;

// Get a free port programmatically
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
}

// Create Loading Splash Screen
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: rgba(10, 10, 12, 0.95);
          color: #ffffff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .status {
          margin-top: 15px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="logo">MAVEN TRADING JOURNAL</div>
      <div class="spinner"></div>
      <div class="status">STARTING LOCAL JOURNAL SERVER...</div>
    </body>
    </html>
  `;

  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
}

// Create Main Application Window
function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0a0a0c',
  });

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize SQLite database path in user data folder
function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dev.db');
  
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    // Copy bundled template DB
    const sourceDbPath = path.join(__dirname, 'prisma', 'dev.db');
    if (fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, dbPath);
      console.log('Database seeded in UserData directory.');
    } else {
      console.error('Source seed database not found at:', sourceDbPath);
    }
  }
  
  // Set environment variable so Next.js prisma reads this database
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('Prisma Database Path set to:', process.env.DATABASE_URL);
}

// Start programmatic Next.js server in production
async function startNextProductionServer(port) {
  const next = require('next');
  const nextApp = next({
    dev: false,
    dir: __dirname,
  });
  
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  nextServer = http.createServer((req, res) => {
    handle(req, res);
  });

  return new Promise((resolve) => {
    nextServer.listen(port, '127.0.0.1', () => {
      console.log(`Next.js production server running on http://127.0.0.1:${port}`);
      resolve();
    });
  });
}

// App Ready listener
app.whenReady().then(async () => {
  createLoadingWindow();

  // Setup dynamic writeable DB
  initDatabase();

  const isDev = !app.isPackaged;
  let serverPort = 3000;

  try {
    if (isDev) {
      console.log('Running in Development mode. Pointing to http://localhost:3000');
      // Wait a moment for dev server to be ready (assuming user ran npm run dev)
      setTimeout(() => {
        createMainWindow('http://localhost:3000');
      }, 1500);
    } else {
      serverPort = await getFreePort();
      console.log(`Starting Next.js in production on port ${serverPort}...`);
      await startNextProductionServer(serverPort);
      createMainWindow(`http://127.0.0.1:${serverPort}`);
    }
  } catch (error) {
    console.error('Failed to initialize app server:', error);
    app.quit();
  }
});

// App Window closing controls
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    // If windows are closed but process is active (macOS behavior)
    const isDev = !app.isPackaged;
    if (isDev) {
      createMainWindow('http://localhost:3000');
    } else {
      // Find port if server is running, otherwise quit
      if (nextServer && nextServer.address()) {
        createMainWindow(`http://127.0.0.1:${nextServer.address().port}`);
      } else {
        app.quit();
      }
    }
  }
});
