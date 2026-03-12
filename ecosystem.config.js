module.exports = {
    apps: [
        {
            name: 'otomuhasebe-api',
            script: 'dist/src/main.js',
            cwd: '/var/www/otomuhasebe/api-stage/server', // Sunucudaki gerçek dizine göre güncellenebilir
            instances: 2, // 4 Çekirdeğin 2'si Backend için
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M', // Node.js memory leak'i önleme
            env: {
                NODE_ENV: 'production',
                PORT: 3020
            },
            error_file: '/root/.pm2/logs/api-error.log',
            out_file: '/root/.pm2/logs/api-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        },
        {
            name: 'otomuhasebe-client',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            cwd: '/var/www/otomuhasebe/panel-stage/client', // Sunucudaki gerçek dizine göre güncellenebilir
            instances: 2, // 4 Çekirdeğin 2'si Frontend (SSR) için
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: 3010
            },
            error_file: '/root/.pm2/logs/client-error.log',
            out_file: '/root/.pm2/logs/client-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        }
    ]
};
