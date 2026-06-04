import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If AWS credentials are provided, upload to S3
    if (
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    ) {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      let ext = path.extname(file.name) || '.png';
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase())) {
        ext = '.png';
      }
      const key = `screenshot-${uniqueSuffix}${ext}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'image/png',
        },
      });

      await upload.done();
      const region = process.env.AWS_REGION || 'us-east-1';
      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
      return NextResponse.json({ url: fileUrl });
    }

    // Otherwise, fall back to local public/screenshots directory
    const uploadDir = path.join(process.cwd(), 'public', 'screenshots');
    await mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.name) || '.png';
    if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase())) {
      ext = '.png';
    }
    
    const filename = `screenshot-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const fileUrl = `/screenshots/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
