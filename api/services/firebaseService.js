const admin = require("firebase-admin");
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const multer = require('multer');
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}
admin.appCheck().verifyToken;

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024
    },
});

const uploadFileToFirebase = async (file) => {
    if (!file) {
      throw new Error('No file uploaded');
    }
  
    try {
      const originalFileName = file.originalname;
      const uniqueFileName = `audio/${Date.now()}_${originalFileName}`;
  
      const fileUpload = bucket.file(uniqueFileName);
  
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });
  
      return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            const [url] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-09-2491',
            });
  
            resolve({
              url: url,
              fileName: uniqueFileName,
            });
          } catch (error) {
            console.error('Error generating signed URL:', error);
            reject(new Error('Error generating signed URL'));
          }
        });
  
        stream.on('error', (error) => {
          console.error('Error during upload:', error);
          reject(new Error('Error during upload to Firebase Storage'));
        });
  
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload file to Firebase');
    }
  };

const uploadPost = async (file, destinationPath) => {
    if (!file) {
        throw new Error('No file uploaded');
    }

    try {
        const originalFileName = file.originalname;
        const uniqueFileName = `${destinationPath}`;

        const fileUpload = bucket.file(uniqueFileName);

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        const buffer = Buffer.from(file.buffer);

        return new Promise((resolve, reject) => {
            stream.on('finish', async () => {
                try {
                    const [url] = await fileUpload.getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491',
                    });

                    resolve({
                        url: url,
                        fileName: uniqueFileName,
                    });
                } catch (error) {
                    console.error('Error generating signed URL:', error);
                    reject(new Error('Error generating signed URL'));
                }
            });

            stream.on('error', (error) => {
                console.error('Error during upload:', error);
                reject(new Error('Error during upload to Firebase Storage'));
            });

            stream.end(buffer);
        });
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload file to Firebase');
    }
};

const uploadImageToFirebase = async (file) => {
    if (!file) {
        throw new Error('No file uploaded');
    }

    try {
        const originalFileName = file.originalname;
        const uniqueFileName = `avatar/${Date.now()}_${originalFileName}`;

        const fileUpload = bucket.file(uniqueFileName);

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        return new Promise((resolve, reject) => {
            stream.on('finish', async () => {
                try {
                    const [url] = await fileUpload.getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491',
                    });

                    resolve({
                        url: url,
                        fileName: uniqueFileName,
                    });
                } catch (error) {
                    console.error('Error generating signed URL:', error);
                    reject(new Error('Error generating signed URL'));
                }
            });

            stream.on('error', (error) => {
                console.error('Error during upload:', error);
                reject(new Error('Error during upload to Firebase Storage'));
            });

            stream.end(file.buffer);
        });
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload file to Firebase');
    }
};

module.exports = {
    admin,
    database: admin.database(),
    uploadFileToFirebase,
    upload,
    uploadImageToFirebase,
    uploadPost,
};