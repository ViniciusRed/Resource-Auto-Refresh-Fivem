const chokidar = require('chokidar');

const resourceName = 'MCore'; //Your resource name
const resourcePath = `./resources/${resourceName}`; //The path to the resource

const watcher = chokidar.watch(resourcePath, {
  persistent: true,
  ignoreInitial: true,
});

const restartResource = async () => {
  console.log(`Changement détecté dans ${resourceName}, redémarrage en cours...`);
  try {
    ExecuteCommand("refresh")
    ExecuteCommand("restart " + resourceName)
    console.log(`Ressource ${resourceName} redémarrée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors du redémarrage de la ressource : ${error.message}`);
  }
};

watcher.on('all', (event, path) => {
  console.log(`Événement détecté : ${event} sur le fichier ${path}`);
  restartResource();
});

console.log(`Surveillance de la ressource ${resourceName} démarrée...`);
