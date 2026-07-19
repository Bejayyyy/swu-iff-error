@echo off
echo ========================================
echo Deploying Firestore Rules and Indexes
echo ========================================
echo.
echo Step 1: Deploying Rules...
firebase deploy --only firestore:rules
echo.
echo Step 2: Deploying Indexes...
firebase deploy --only firestore:indexes
echo.
echo ========================================
echo Deployment Complete!
echo ========================================
pause
