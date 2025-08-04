# Deployment Setup Guide

**Last Updated:** January 8, 2025

## Overview

This guide provides step-by-step instructions for deploying the Maria AI Agent using our recommended architecture:

- **Frontend**: Vercel (React app)
- **Backend**: Fly.io (Python Flask API)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: AWS S3

## Prerequisites

1. **GitHub Account** with repository access
2. **Vercel Account** (free tier)
3. **Fly.io Account** (free tier)
4. **Supabase Account** (free tier)
5. **AWS Account** (for S3 bucket)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down: Project URL, Service Key, Anon Key

### 1.2 Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy and paste contents of `supabase_schema.sql`
3. Execute the schema

### 1.3 Get Connection Details

1. Go to Settings > Database
2. Copy the connection string (format: `postgresql://postgres.[PROJECT_ID]:[SERVICE_KEY]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`)

## Step 2: AWS S3 Setup

### 2.1 Create S3 Bucket

1. Go to AWS S3 Console
2. Create bucket: `maria-ai-agent-uploads`
3. Configure for private access
4. Enable CORS for file uploads

### 2.2 Create IAM User

1. Go to AWS IAM Console
2. Create user with S3 access
3. Generate access keys
4. Note down: Access Key ID, Secret Access Key

## Step 3: Fly.io Backend Setup

### 3.1 Install Fly.io CLI

```bash
# macOS
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

### 3.2 Login to Fly.io

```bash
flyctl auth login
```

### 3.3 Deploy Backend

```bash
cd backend
flyctl launch
# Follow prompts, use app name: maria-ai-agent-backend
```

### 3.4 Set Environment Variables

```bash
flyctl secrets set DATABASE_URL="your-supabase-connection-string"
flyctl secrets set AWS_ACCESS_KEY_ID="your-aws-access-key"
flyctl secrets set AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
flyctl secrets set AWS_REGION="us-east-1"
flyctl secrets set S3_BUCKET_NAME="maria-ai-agent-uploads"
flyctl secrets set ENVIRONMENT="production"
```

### 3.5 Deploy

```bash
flyctl deploy
```

## Step 4: Vercel Frontend Setup

### 4.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

### 4.2 Set Environment Variables

In Vercel dashboard, add:

```
REACT_APP_API_BASE_URL=https://maria-ai-agent-backend.fly.dev
```

### 4.3 Deploy

Vercel will automatically deploy on first setup.

## Step 5: GitHub Secrets Setup

### 5.1 Add Repository Secrets

Go to GitHub repository > Settings > Secrets and variables > Actions

Add these secrets:

```
FLY_API_TOKEN=your-fly-api-token
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
SUPABASE_DATABASE_URL=your-supabase-connection-string
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=maria-ai-agent-uploads
```

### 5.2 Get Fly.io API Token

```bash
flyctl auth token
```

### 5.3 Get Vercel Tokens

1. Go to Vercel dashboard > Settings > Tokens
2. Create new token
3. Get Org ID and Project ID from project settings

## Step 6: Test Deployment

### 6.1 Test Backend

```bash
curl https://maria-ai-agent-backend.fly.dev/api/v1/health
```

### 6.2 Test Frontend

Visit your Vercel URL and verify:

- React app loads
- Can connect to backend API
- File uploads work

## Step 7: Monitor and Scale

### 7.1 Monitor Costs

- **Vercel**: Free tier (100GB bandwidth)
- **Fly.io**: Free tier (3 shared VMs)
- **Supabase**: Free tier (500MB database)
- **AWS S3**: ~$1-5/month for file storage

### 7.2 Scale When Needed

- **Supabase**: Upgrade to Pro ($25/month) when database exceeds 500MB
- **Fly.io**: Upgrade to paid plan when traffic increases
- **Vercel**: Upgrade to Pro ($20/month) when bandwidth exceeds 100GB

## Troubleshooting

### Common Issues

1. **Backend Health Check Fails**

   - Verify environment variables are set
   - Check Fly.io logs: `flyctl logs`

2. **Frontend Can't Connect to Backend**

   - Verify CORS settings
   - Check API URL in Vercel environment variables

3. **File Uploads Fail**

   - Verify S3 bucket permissions
   - Check AWS credentials in Fly.io secrets

4. **Database Connection Issues**
   - Verify Supabase connection string
   - Check database schema is applied

### Useful Commands

```bash
# Check Fly.io app status
flyctl status

# View Fly.io logs
flyctl logs

# Redeploy backend
flyctl deploy

# Check Vercel deployment
vercel ls
```

## Next Steps

1. **Set up monitoring** with Sentry or similar
2. **Configure custom domains** for production
3. **Set up SSL certificates** (automatic with Vercel/Fly.io)
4. **Implement backup strategy** for database
5. **Set up CI/CD pipeline** (already configured in GitHub Actions)
