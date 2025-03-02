/* eslint-disable max-len */
import * as firestore from "@google-cloud/firestore";
import * as storage from "@google-cloud/storage";

// Define the Cloud Storage bucket where backups will be stored
const BUCKET_NAME = "nosco-app-backups"; // Change to your actual backup bucket name

// Firestore Admin Client for exports
const firestoreClient = new firestore.v1.FirestoreAdminClient();

// Storage client for checking existing backups
const storageClient = new storage.Storage();

/**
 * Backup types - used to differentiate between auto and manual backups
 */
export enum BackupType {
  AUTO = "auto",
  MANUAL = "manual"
}

/**
 * Perform a Firestore export to Cloud Storage
 * @param {string} type The backup type (auto or manual)
 * @returns {Promise<string>} The backup path
 */
export async function backupFirestore(type: BackupType): Promise<string> {
  try {
    // Get the project ID from the FIREBASE_CONFIG env variable
    const projectId = process.env.GCLOUD_PROJECT || "nosco-app-b5be4"; // Fallback to your project ID
    const databaseName = firestoreClient.databasePath(projectId, "(default)");
    
    // Create a date-based folder name for this backup
    const date = new Date();
    const folderName = `${type}_backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    
    // Define the output URI
    const outputUri = `gs://${BUCKET_NAME}/backups/${folderName}/`;
    
    console.log(`Starting Firestore backup to ${outputUri}`);
    
    // Start the export - excluding the notifications collection
    const [response] = await firestoreClient.exportDocuments({
      name: databaseName,
      outputUriPrefix: outputUri,
      // Include all collections except notifications
      collectionIds: [
        "expense",
        "expenseTypes", 
        "feedback",
        "payments",
        "projectInvitations",
        "projects",
        "settings",
        "users",
        "workHours"
        // Add any other collections you want to back up
      ],
    });
    
    console.log(`Backup operation started: ${response.name}`);
    return outputUri;
  } catch (error) {
    console.error(`Backup failed (${type}):`, error);
    throw error;
  }
}

/**
 * Check if we can create a manual backup
 * Rules:
 * - If there are fewer than 2 backups in the last 7 days, we can create a new one
 * - If there are already 2 backups (1 auto + 1 manual), we overwrite the manual one
 * @returns {Promise<{canCreate: boolean, existingManualBackup?: string}>}
 */
export async function canCreateManualBackup(): Promise<{canCreate: boolean, existingManualBackup?: string}> {
  try {
    // Get all backups from the last 7 days
    const bucket = storageClient.bucket(BUCKET_NAME);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // List all backups
    const [files] = await bucket.getFiles({ prefix: "backups/" });
    
    // Filter to get only folders created in the last 7 days
    // For each folder, determine if it's auto or manual
    let autoBackupCount = 0;
    let manualBackupCount = 0;
    let existingManualBackup: string | undefined;
    
    // Group files by folder
    const folderMap = new Map<string, { name: string, type: string, createdAt: Date }>();
    
    // Process files to extract folder metadata
    for (const file of files) {
      // Skip files not in "backups/" prefix
      if (!file.name.startsWith("backups/")) continue;
      
      // Get the folder name (first part of path after backups/)
      const folderPathParts = file.name.split("/");
      if (folderPathParts.length < 3) continue; // Skip if not in a subfolder
      
      const folderName = folderPathParts[1];
      
      // Skip if we've already seen this folder
      if (folderMap.has(folderName)) continue;
      
      // Get metadata (creation time)
      const [metadata] = await file.getMetadata();
      const createdAt = metadata.timeCreated ? new Date(metadata.timeCreated) : new Date();
      
      // Skip if older than 7 days
      if (createdAt < sevenDaysAgo) continue;
      
      // Determine if auto or manual backup
      const isAuto = folderName.startsWith("auto_backup");
      const type = isAuto ? "auto" : "manual";
      
      // Add to folder map
      folderMap.set(folderName, { 
        name: folderName,
        type,
        createdAt
      });
      
      // Track counts
      if (isAuto) {
        autoBackupCount++;
      } else {
        manualBackupCount++;
        // Keep track of the most recent manual backup
        existingManualBackup = `gs://${BUCKET_NAME}/backups/${folderName}/`;
      }
    }
    
    console.log(`Found ${autoBackupCount} auto and ${manualBackupCount} manual backups in the last 7 days`);
    
    // Decision logic
    const totalBackups = autoBackupCount + manualBackupCount;
    
    // Case 1: Less than 2 total backups - can create a new one
    if (totalBackups < 2) {
      return { canCreate: true };
    }
    
    // Case 2: Already have 2 backups, but we can overwrite the manual one
    if (totalBackups >= 2 && manualBackupCount > 0) {
      return { 
        canCreate: true, 
        existingManualBackup
      };
    }
    
    // Case 3: Already have 2 auto backups - cannot create a new one
    return { canCreate: false };
    
  } catch (error) {
    console.error("Error checking backup status:", error);
    // On error, we'll be conservative and not allow a new backup
    return { canCreate: false };
  }
}

/**
 * Create a manual backup, respecting the constraint of max 2 backups per week
 * @returns {Promise<{success: boolean, message: string, backupPath?: string}>}
 */
export async function createManualBackup(): Promise<{success: boolean, message: string, backupPath?: string}> {
  try {
    // First check if we can create a manual backup
    const { canCreate, existingManualBackup } = await canCreateManualBackup();
    
    if (!canCreate) {
      return { 
        success: false, 
        message: "Cannot create manual backup: already have 2 backups in the last 7 days."
      };
    }
    
    // If we have an existing manual backup, we need to delete it first
    if (existingManualBackup) {
      console.log(`Deleting existing manual backup: ${existingManualBackup}`);
      
      // Remove gs:// prefix and get bucket+path
      const path = existingManualBackup.replace("gs://", "");
      const bucketName = path.split("/")[0];
      const prefix = path.substring(bucketName.length + 1);
      
      // Delete all files in this folder
      const bucket = storageClient.bucket(bucketName);
      const [files] = await bucket.getFiles({ prefix });
      
      for (const file of files) {
        await file.delete();
      }
      
      console.log(`Deleted existing manual backup`);
    }
    
    // Create the new manual backup
    const backupPath = await backupFirestore(BackupType.MANUAL);
    
    return {
      success: true,
      message: "Manual backup created successfully",
      backupPath
    };
  } catch (error) {
    console.error("Manual backup failed:", error);
    return {
      success: false,
      message: `Manual backup failed: ${error instanceof Error ? error.message : String(error) || "Unknown error"}`
    };
  }
}