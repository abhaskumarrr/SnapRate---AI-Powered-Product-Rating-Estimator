# SnapRate CI/CD Pipeline Documentation

This document describes the CI/CD pipeline setup for the SnapRate application.

## Overview

The SnapRate project uses GitHub Actions for continuous integration and deployment. The pipeline consists of three main workflows:

1. **Main CI/CD Pipeline** (`ci-cd.yml`) - Handles testing, building, and deployment
2. **Security and Maintenance** (`security-and-maintenance.yml`) - Automated security scans and dependency updates
3. **Release Management** (`release.yml`) - Manages versioned releases and production deployments

## Workflows

### 1. Main CI/CD Pipeline

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Jobs:**
- `frontend-test`: Runs frontend linting, tests, and coverage
- `frontend-build`: Builds production frontend assets
- `backend-test`: Runs backend linting, tests, and coverage
- `backend-build`: Builds and pushes Docker images
- `security-scan`: Runs vulnerability scans on pull requests
- `deploy-staging`: Deploys to staging environment (develop branch)
- `deploy-production`: Deploys to production environment (main branch)
- `lighthouse-audit`: Runs performance audits on staging

### 2. Security and Maintenance

**Triggers:**
- Daily schedule (2 AM UTC)
- Manual dispatch

**Jobs:**
- `dependency-audit`: Scans for security vulnerabilities in dependencies
- `docker-security-scan`: Scans Docker images for vulnerabilities
- `update-dependencies`: Creates PRs with dependency updates
- `health-check`: Monitors production application health

### 3. Release Management

**Triggers:**
- Git tags matching `v*` pattern
- Manual dispatch with version input

**Jobs:**
- `create-release`: Creates GitHub release with changelog
- `build-and-upload-assets`: Builds and uploads release artifacts
- `deploy-release`: Deploys release to production
- `post-release-tests`: Validates deployment with smoke tests

## Required Secrets

Configure the following secrets in your GitHub repository:

### Container Registry
- `CONTAINER_REGISTRY`: Container registry URL
- `CONTAINER_USERNAME`: Registry username
- `CONTAINER_PASSWORD`: Registry password/token

### Deployment
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Environment Variables
- `VITE_API_BASE_URL`: Production API base URL

### Notifications
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications

## Environment Configuration

### Staging Environment
- **Frontend**: Deployed to Vercel with staging domain
- **Backend**: Deployed to staging infrastructure
- **Database**: Staging database instance
- **Monitoring**: Basic monitoring and logging

### Production Environment
- **Frontend**: Deployed to Vercel with production domain
- **Backend**: Deployed to production infrastructure with load balancing
- **Database**: Production database with backups
- **Monitoring**: Full monitoring, alerting, and logging
- **Security**: Enhanced security measures and access controls

## Branch Strategy

- `main`: Production-ready code, triggers production deployment
- `develop`: Integration branch, triggers staging deployment
- `feature/*`: Feature branches, triggers tests only
- `hotfix/*`: Hotfix branches, can be deployed directly to production

## Deployment Process

### Staging Deployment
1. Push code to `develop` branch
2. CI/CD pipeline runs tests and builds
3. Automatic deployment to staging environment
4. Lighthouse audit runs for performance validation
5. Manual testing and validation

### Production Deployment
1. Merge `develop` to `main` branch (or create hotfix)
2. CI/CD pipeline runs full test suite
3. Security scans and vulnerability checks
4. Automatic deployment to production environment
5. Post-deployment smoke tests
6. Slack notification of deployment status

### Release Deployment
1. Create and push a git tag (e.g., `v1.0.0`)
2. Release workflow creates GitHub release
3. Builds and uploads release artifacts
4. Deploys to production environment
5. Runs post-release validation tests
6. Notifies team of successful release

## Monitoring and Alerts

### Health Checks
- Daily automated health checks for production
- Immediate Slack notifications on failures
- Endpoint monitoring for both frontend and backend

### Security Monitoring
- Daily dependency vulnerability scans
- Docker image security scanning
- Automated security issue creation
- Weekly dependency update PRs

### Performance Monitoring
- Lighthouse audits on staging deployments
- Performance regression detection
- Core Web Vitals tracking

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check test results and linting errors
   - Verify environment variables are set correctly
   - Ensure dependencies are up to date

2. **Deployment Failures**
   - Verify secrets are configured correctly
   - Check deployment logs in GitHub Actions
   - Validate environment-specific configurations

3. **Security Scan Failures**
   - Review vulnerability reports
   - Update affected dependencies
   - Apply security patches as needed

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Review the workflow files for configuration issues
- Contact the development team for deployment-related issues

## Best Practices

1. **Testing**
   - Maintain high test coverage (>80%)
   - Write meaningful test cases
   - Test both happy path and edge cases

2. **Security**
   - Regularly update dependencies
   - Review security scan results
   - Follow secure coding practices

3. **Deployment**
   - Test thoroughly in staging before production
   - Use feature flags for gradual rollouts
   - Monitor applications after deployment

4. **Documentation**
   - Keep deployment documentation up to date
   - Document any manual deployment steps
   - Maintain runbooks for common issues