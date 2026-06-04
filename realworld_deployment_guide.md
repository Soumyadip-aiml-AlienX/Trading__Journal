# Maven Trading Journal - Production Deployment & Migration Guide

This guide details the architectural migrations and configuration steps required to deploy the local Maven Trading Journal application to a production web environment.

---

## 1. Database Migration: SQLite ➔ PostgreSQL
SQLite is file-based and unsuitable for concurrent web access or serverless deployments.

### Step 1: Update Prisma Configuration
Modify `prisma/schema.prisma` to change the database provider to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Set Environment Variables
Add the PostgreSQL connection string in your `.env.production` or cloud platform environment variable settings:
```env
DATABASE_URL="postgresql://username:password@hostname:5432/databasename?sslmode=require"
```

### Step 3: Run Database Migrations
Generate and apply migrations to your production database instance:
```bash
npx prisma migrate deploy
```

---

## 2. Cloud Storage: Local Uploads ➔ AWS S3 / Cloudinary
Next.js serverless functions do not persist local disk changes. Screenshots must be uploaded to object storage.

### Step 1: Install AWS SDK Clients
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### Step 2: Implement S3 Upload Ingestion API
Replace your upload API route (`src/app/api/upload/route.ts`) with an S3 upload handler:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const key = `${Date.now()}-${file.name}`;
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      },
    });

    await upload.done();
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

---

## 3. User Authentication
A production journal requires multi-tenant security so users only see their own trades.

### Step 1: Set Up Authentication (NextAuth.js)
```bash
npm install next-auth @prisma/adapter-next-auth
```

### Step 2: Protect API and DB Operations
Filter queries by the logged-in user:
```typescript
// Example: Get user trades
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const trades = await prisma.trade.findMany({
  where: { userId: session.user.id },
});
```

---

## 4. Hosting & CDN
- **Recommended Platform**: [Vercel](https://vercel.com) (native Next.js features, automated Brotli compression, edge caching).
- **Self-Hosting Docker Setup**: Use the configured `output: 'standalone'` mode in Next.js to containerize the app for AWS Fargate, Fly.io, or DigitalOcean.
