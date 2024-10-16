// functions/src/backup.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { FirestoreDataExporter } = require('firestore-data-export');

admin.initializeApp();
const firestore = admin.firestore();
const storage = new Storage();

const exporter = new FirestoreDataExporter(firestore, storage, 'backups');

exports.scheduledFirestoreExport = functions.pubsub
  .schedule('every 30 days')
  .onRun(async (context) => {
    try {
      const timestamp = new Date().toISOString();
      const backupPath = `firestore-backups/${timestamp}`;
      await exporter.exportCollectionGroup('employees', `${backupPath}/employees.json`);
      await exporter.exportCollectionGroup('expenses', `${backupPath}/expenses.json`);
      await exporter.exportCollectionGroup('projects', `${backupPath}/projects.json`);
      // Add other collections as needed
      console.log('Firestore backup completed successfully.');
    } catch (error) {
      console.error('Error during Firestore backup:', error);
    }
  });
