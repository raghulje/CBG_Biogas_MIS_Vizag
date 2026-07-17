// Load .env before other modules so TZ (and DB) apply to schedulers and Date logic.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (process.env.TZ && String(process.env.TZ).trim()) {
    process.env.TZ = String(process.env.TZ).trim();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('./models');
const routes = require('./routes');
const schedulerService = require('./services/schedulerService');

// Global crash protection: log unhandled rejections and uncaught exceptions (do not exit)
process.on('unhandledRejection', (reason, promise) => {
    try {
        console.error('UNHANDLED REJECTION:', reason);
    } catch (e) {
        // swallow
    }
});

process.on('uncaughtException', (error) => {
    try {
        console.error('UNCAUGHT EXCEPTION:', error);
    } catch (e) {
        // swallow
    }
});

const app = express();
// Default production port set to 3015; can be overridden via server/.env
const PORT = process.env.PORT || 3015;
const HOST = process.env.HOST || '0.0.0.0';

const corsOptions = {
    // Allow CLIENT_ORIGIN (preferred) or FRONTEND_URL for backward compatibility.
    origin: process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || true,
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware (order: security → cors → compression → logging → body parsers → routes)
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}
app.use(bodyParser.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '2mb' }));

// Routes
// Health check (useful for load balancers / reverse proxies)
app.get('/api/health', (_req, res) => {
    const now = new Date();
    return res.json({
        status: 'ok',
        env: process.env.NODE_ENV || 'development',
        /** Helps verify Final MIS schedule vs India: set TZ=Asia/Kolkata in server/.env and restart. */
        tz: process.env.TZ || null,
        server_local_string: now.toString(),
        server_utc_iso: now.toISOString(),
    });
});

app.use('/api', routes);

// Only serve built client files if SERVE_CLIENT is explicitly set to 'true'
// When running separately, client will be on port 3000 (Vite dev server)
const shouldServeClient = process.env.SERVE_CLIENT === 'true';
const clientPath = path.join(__dirname, "../client/out");

if (shouldServeClient && fs.existsSync(clientPath)) {
    console.log('📦 Serving production client from:', clientPath);

    // Production mode: serve built client files with caching
    app.use(express.static(clientPath, {
        maxAge: '1y', // Cache for 1 year
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            const oneYear = 31536000; // 1 year in seconds

            // Cache static assets (JS, CSS, images, fonts) for 1 year
            if (['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
                res.setHeader('Cache-Control', `public, max-age=${oneYear}, immutable`);
            }
            // Don't cache HTML files (they might change)
            else if (ext === '.html') {
                res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            }
        }
    }));

    // Handle client-side routing - serve index.html for all non-API routes
    app.get("*", (req, res) => {
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            res.sendFile(path.join(clientPath, "index.html"));
        }
    });
} else {
    // Development mode - don't serve client, just API
    console.log('🔧 Development mode: Client should be running separately on port 5173 (Vite)');

    // Base Route
    app.get('/', (req, res) => {
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        res.json({
            message: 'Biogas MIS API is running',
            mode: process.env.NODE_ENV || 'development',
            apiUrl: `${baseUrl}/api`,
            clientUrl: process.env.FRONTEND_URL || `${protocol}://${host.split(':')[0]}:5173`,
            note: 'Set SERVE_CLIENT=true in .env to serve built client files'
        });
    });

    // Return helpful message for non-API routes
    app.get("*", (req, res) => {
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const host = req.get('host');
            const baseUrl = `${protocol}://${host}`;
            res.json({
                message: "API Server is running. Client should be running separately on port 5173.",
                apiUrl: `${baseUrl}/api`,
                clientUrl: process.env.FRONTEND_URL || `${protocol}://${host.split(':')[0]}:5173`,
                note: "Set SERVE_CLIENT=true in .env to serve built client files"
            });
        }
    });
}

// 404
app.use((req, res) => {
    res.status(404).json({ message: 'Not found', path: req.path });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Something went wrong!', error: err.message });
});

// Start Server — safe production-ready startup
async function startServer() {
    try {
        // Authenticate DB connection first
        await db.sequelize.authenticate();
        console.log('Database connection authenticated');

        // Ensure cron/scheduler starts — required for email reminders
        try {
            await schedulerService.init();
            console.log('Scheduler (cron) initialized');
        } catch (e) {
            console.error('Failed to init scheduler:', e);
        }

        // Attempt to listen; if port is in use, try next ports up to a limit.
        // IMPORTANT: ensure port increments numerically (avoid string concatenation like "3015" + 1 => "30151")
        const tryListen = (port, host = HOST, retries = 5) => {
            const startPort = Number(port);
            if (!Number.isFinite(startPort) || startPort < 0 || startPort >= 65536) {
                return Promise.reject(new RangeError(`Invalid PORT: ${port}`));
            }
            return new Promise((resolve, reject) => {
                const srv = app.listen(startPort, host);
                srv.on('listening', () => resolve(srv));
                srv.on('error', (err) => {
                    if (err && err.code === 'EADDRINUSE' && retries > 0) {
                        const nextPort = startPort + 1;
                        console.warn(`Port ${startPort} in use — retrying on port ${nextPort}...`);
                        setTimeout(() => {
                            tryListen(nextPort, host, retries - 1).then(resolve).catch(reject);
                        }, 200);
                    } else {
                        reject(err);
                    }
                });
            });
        };

        try {
            const server = await tryListen(PORT, HOST, 10);
            const address = server.address();
            const actualPort = address.port;
            const actualHost = address.address || HOST;
            console.log(`Server is running on http://${actualHost}:${actualPort}`);
        } catch (err) {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
    } catch (err) {
        console.error('Failed to initialize DB/migrations:', err);
        process.exit(1);
    }
}

startServer();
