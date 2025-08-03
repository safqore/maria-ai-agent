# Email Verification Monitoring

## Overview

The `monitor_email_verification.py` script provides comprehensive monitoring of the email verification system to ensure all components are working correctly in production.

## Features

The monitoring script performs 5 critical checks:

1. **SMTP Configuration** - Verifies Gmail SMTP settings are properly configured
2. **Verification Service** - Tests code generation and email validation
3. **Rate Limiting** - Confirms rate limiting configuration is correct
4. **Database Cleanup** - Checks for expired verification codes
5. **Cleanup Process** - Tests the 24-hour auto-cleanup functionality

## Usage

### Prerequisites

- Conda environment 'maria-ai-agent' activated
- PostgreSQL database running
- Gmail SMTP credentials configured in `.env`
- `python-dotenv` package installed

### Running the Monitor

```bash
# Activate the conda environment
conda activate maria-ai-agent

# Navigate to backend directory
cd backend

# Run the monitoring script
python monitor_email_verification.py
```

### Output

The script provides:
- **Console output** with detailed status for each check
- **Log file** at `logs/email_verification_monitor.log`
- **Exit code** 0 for success, 1 for issues found

### Example Output

```
INFO:__main__:Starting Email Verification System Monitor
INFO:__main__:==================================================
INFO:__main__:Running SMTP Configuration check...
INFO:__main__:SMTP Configuration: ✅ PASSED
INFO:__main__:Running Verification Service check...
INFO:__main__:Verification Service: ✅ PASSED
INFO:__main__:Running Rate Limiting check...
INFO:__main__:Rate Limiting: ✅ PASSED
INFO:__main__:Running Database Cleanup check...
INFO:__main__:Database Cleanup: ✅ PASSED
INFO:__main__:Running Cleanup Process Test check...
INFO:__main__:Cleanup Process Test: ✅ PASSED
INFO:__main__:Overall Status: 5/5 checks passed
INFO:__main__:🎉 All email verification systems are working correctly!
```

## Production Integration

### Scheduled Monitoring

Add to crontab for daily monitoring:
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/maria-ai-agent/backend && conda activate maria-ai-agent && python monitor_email_verification.py
```

### CI/CD Integration

Add to deployment pipelines to verify system health:
```yaml
- name: Monitor Email Verification
  run: |
    cd backend
    python monitor_email_verification.py
```

### Alerting

The script exits with code 1 if any issues are found, making it suitable for alerting systems.

## Troubleshooting

### Common Issues

1. **SMTP Configuration Failed**
   - Check `.env` file has correct Gmail SMTP credentials
   - Verify `SMTP_SERVER`, `SMTP_PORT`, `SENDER_EMAIL`, `SMTP_USERNAME` are set

2. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check database connection settings

3. **Cleanup Test Failed**
   - Verify database permissions
   - Check if test data cleanup is working

### Logs

Check the log file for detailed error information:
```bash
tail -f logs/email_verification_monitor.log
```

## Security Notes

- The monitoring script creates temporary test data that is automatically cleaned up
- No sensitive data is logged
- All database operations use parameterized queries for security

## Maintenance

- Update the script when new verification features are added
- Review and update monitoring checks as needed
- Ensure the script runs successfully after deployments 