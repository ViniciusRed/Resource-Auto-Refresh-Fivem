const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const resourcesPath = './resources';
let knownResources = new Set();
let lastRestart = {};
const RESTART_DELAY = 3000; // 5 segundos de delay entre restarts

const getResources = () => {
    return fs.readdirSync(resourcesPath)
        .filter(file => fs.statSync(path.join(resourcesPath, file)).isDirectory());
};

knownResources = new Set(getResources());

const watcher = chokidar.watch(resourcesPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 500
    },
    interval: 1000,
    binaryInterval: 2000,
    usePolling: false,
    atomic: true
});

const canRestart = (resourceName) => {
    const now = Date.now();
    if (!lastRestart[resourceName] || (now - lastRestart[resourceName]) >= RESTART_DELAY) {
        lastRestart[resourceName] = now;
        return true;
    }
    return false;
};

const restartResource = async (resourceName) => {
    if (!canRestart(resourceName)) return;

    console.log(`Alteração detectada em ${resourceName}, reiniciando...`);
    try {
        emit('onResourceStop', resourceName);
        setTimeout(() => {
            emit('onResourceStart', resourceName);
            console.log(`Recurso ${resourceName} reiniciado com sucesso.`);
        }, 1000);
    } catch (error) {
        console.error(`Erro ao reiniciar o recurso: ${error.message}`);
    }
};

const startNewResource = async (resourceName) => {
    if (!canRestart(resourceName)) return;

    console.log(`Novo recurso detectado: ${resourceName}`);
    try {
        emit('onResourceStart', resourceName);
        knownResources.add(resourceName);
        console.log(`Novo recurso ${resourceName} iniciado com sucesso.`);
    } catch (error) {
        console.error(`Erro ao iniciar o novo recurso: ${error.message}`);
    }
};

watcher.on('all', (event, path) => {
    const resourcePath = path.split('/');
    const resourceName = resourcePath[2];

    if (knownResources.has(resourceName)) {
        restartResource(resourceName);
    }
});

watcher.on('addDir', (path) => {
    const resourcePath = path.split('/');
    if (resourcePath.length === 3) {
        const resourceName = resourcePath[2];
        if (!knownResources.has(resourceName)) {
            startNewResource(resourceName);
        }
    }
});

console.log(`Monitoramento iniciado para os recursos em: ${resourcesPath}`);