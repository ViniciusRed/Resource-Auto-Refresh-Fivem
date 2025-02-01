const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const resourcesPath = './resources';
let knownResources = new Set();

// Function to check if a directory contains an fxmanifest.lua file
const hasFxManifest = (dirPath) => {
    try {
        const files = fs.readdirSync(dirPath);
        return files.includes('fxmanifest.lua');
    } catch (error) {
        return false;
    }
};

// Recursively get all resources (folders) that contain an fxmanifest.lua file
const getResources = () => {
    const resources = [];
    const scanDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (hasFxManifest(fullPath)) {
                    resources.push(path.relative(resourcesPath, fullPath));
                }
                scanDirectory(fullPath); // Recursively scan subdirectories
            }
        }
    };
    scanDirectory(resourcesPath);
    return resources;
};

// Initialize known resources
knownResources = new Set(getResources());

const watcher = chokidar.watch(resourcesPath, {
    persistent: true,
    ignoreInitial: true,
    depth: 99, // Increase depth to monitor deeply nested directories
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    },
    followSymlinks: true
});

const restartResource = async (resourceName) => {
    console.log(`� Alteração detectada em ${resourceName}`);
    try {
        await ExecuteCommand(`refresh`);
        await ExecuteCommand(`restart ${resourceName}`);
        console.log(`✅ Recurso ${resourceName} reiniciado com sucesso.`);
    } catch (error) {
        console.error(`❌ Erro ao reiniciar o recurso: ${error.message}`);
    }
};

// Update the startNewResource function
const startNewResource = async (resourceName) => {
    console.log(`📦 Novo recurso detectado: ${resourceName}`);
    try {
        await ExecuteCommand(`refresh`);
        await ExecuteCommand(`start ${resourceName}`);
        knownResources.add(resourceName);
        console.log(`✅ Novo recurso ${resourceName} iniciado com sucesso.`);
    } catch (error) {
        console.error(`❌ Erro ao iniciar o novo recurso: ${error.message}`);
    }
};
const stopResource = async (resourceName) => {
    console.log(`🗑️ Recurso removido: ${resourceName}`);
    try {
        // Stop the resource
        await ExecuteCommand(`stop ${resourceName}`);
        knownResources.delete(resourceName);
        console.log(`✅ Recurso ${resourceName} parado e removido com sucesso.`);
    } catch (error) {
        console.error(`❌ Erro ao parar o recurso: ${error.message}`);
    }
};

// Enhanced event handler
watcher.on('all', (event, filePath) => {
    const relativePath = path.relative(resourcesPath, filePath);
    const pathSegments = relativePath.split(path.sep);
    let resourceName = null;
    let currentPath = resourcesPath;

    // Find the resource directory containing fxmanifest.lua
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath = path.join(currentPath, segment);
        
        if (hasFxManifest(currentPath)) {
            if (segment.startsWith('[') && i + 1 < pathSegments.length) {
                resourceName = pathSegments[i + 1];
            } else {
                resourceName = segment;
            }
            break;
        }
    }

    if (!resourceName) return;

    console.log(`🔍 Evento: ${event}, Caminho: ${filePath}, Recurso: ${resourceName}`);

    if (event === 'change') {
        restartResource(resourceName);
        return;
    }

    switch (event) {
        case 'add':
        case 'addDir':
            if (hasFxManifest(path.dirname(filePath)) && !knownResources.has(resourceName)) {
                startNewResource(resourceName);
            } else {
                restartResource(resourceName);
            }
            break;

        case 'unlink':
        case 'unlinkDir':
            if (knownResources.has(resourceName)) {
                const resourcePath = path.join(resourcesPath, resourceName);
                if (hasFxManifest(resourcePath)) {
                    restartResource(resourceName);
                } else {
                    stopResource(resourceName);
                }
            }
            break;
    }
});

// Initialize and log monitored resources
const initialResources = Array.from(knownResources).join(', ');
console.log(`🚀 Monitoramento iniciado em: ${resourcesPath}`);
console.log(`📋 Recursos monitorados: ${initialResources}`);