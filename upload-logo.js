const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.S3_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
});

async function uploadLogo() {
    try {
        // Read the logo file
        const logoPath = path.join(__dirname, 'ff@1x.png');
        const fileContent = fs.readFileSync(logoPath);
        
        // Upload parameters
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'assets/nelink-logo.png', // Path in S3 bucket
            Body: fileContent,
            ContentType: 'image/png',
            ACL: 'public-read' // Make it publicly accessible
        };
        
        // Upload to S3
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        
        // Construct the public URL
        const logoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/assets/nelink-logo.png`;
        
        console.log('✅ Logo uploaded successfully!');
        console.log('📍 Logo URL:', logoUrl);
        console.log('\n🔧 Next step: Update utils/emailController.js');
        console.log('   Replace "YOUR_S3_LOGO_URL_HERE" with:');
        console.log(`   ${logoUrl}`);
        
        return logoUrl;
    } catch (error) {
        console.error('❌ Error uploading logo:', error);
        throw error;
    }
}

// Run the upload
uploadLogo();

// Made with Bob
