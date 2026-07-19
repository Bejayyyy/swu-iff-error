# Course Scheduling - Dynamic Sections Setup Guide

## 🎯 What Was Implemented

### 1. Dynamic Section Management
- **Before**: Sections were hardcoded (A, B, C, D for each year)
- **After**: Deans can create any section name (e.g., "1A", "BSIT-2", "Section Alpha")
- Sections are stored in Firestore per dean: `/users/{deanUid}/course_schedules/{sectionName}`

### 2. Enhanced UX for Deans
- **"My Course Schedule" Card**: Prominent card at the top of the sidebar (only for deans)
  - Quick access to their own schedule
  - "EDIT" badge to show it's editable
  - Dark red gradient design for emphasis
- **"YOU" Badge**: Their name in the dean list has a "YOU" badge
- **Visual Hierarchy**: Clear separation between their schedule and others they can only view

### 3. Loading & Notification Modals
- **Loading Modal**: Shows while creating/deleting sections
- **Success Notification**: Auto-closes after 3 seconds
- **Error Notification**: Requires manual close, shows detailed error message

### 4. Firestore Structure
```
/users/{deanUid}/
  └─ course_schedules/
      ├─ {sectionName}/          (e.g., "1A", "BSIT-2")
      │   ├─ sectionName: string
      │   ├─ yearLevel: string
      │   ├─ createdAt: timestamp
      │   └─ entries/
      │       └─ {entryId}/
      │           ├─ title: string
      │           ├─ courseCode: string
      │           ├─ instructor: string
      │           ├─ startHour: number
      │           ├─ endHour: number
      │           ├─ date: string
      │           ├─ semester: number
      │           └─ ...
```

## 🚀 Deployment Steps

### Step 1: Deploy Firestore Configuration

**Option A: Use Batch Files (Easiest)**
Double-click one of these files in your project folder:
- `deploy-firestore.bat` - Deploys both rules and indexes
- `deploy-rules.bat` - Only rules
- `deploy-indexes.bat` - Only indexes

**Option B: Manual Command Prompt**
1. Open **Command Prompt** (cmd.exe, NOT PowerShell)
2. Navigate to project:
   ```cmd
   cd "C:\Users\Day Care 3-Buaya\OneDrive\Desktop\SWU-IFSS"
   ```
3. Deploy:
   ```cmd
   node_modules\.bin\firebase deploy --only firestore
   ```

**Option C: Firebase Console (No command needed)**
1. Go to https://console.firebase.google.com
2. Select your project "swu-ifss"
3. **For Rules**:
   - Go to Firestore Database → Rules
   - Copy content from `firestore.rules` file
   - Paste and click "Publish"
4. **For Indexes**:
   - Go to Firestore Database → Indexes
   - Click "Create Index" for each missing index
   - Or follow the link provided when you get the error

### Step 2: Test the Feature

1. **Login as a Dean**
2. **Navigate to Course Scheduling**
3. **Verify UI**:
   - See "My Course Schedule" card at the top
   - See "YOU" badge next to your name in the list
4. **Add a Section**:
   - Click "Add Section" button
   - Enter section name (e.g., "1A")
   - Click "Add Section"
   - See loading modal → Success notification
5. **Plot Schedule**:
   - Select your section
   - Click/drag on the grid to add classes
6. **Delete Section** (optional):
   - Hover over section pill
   - Click trash icon
   - Confirm deletion

## 📊 Firestore Index Required

The system needs this composite index for querying schedule entries:

**Collection Group**: `entries`
**Fields**:
- `semester` (Ascending)
- `createdAt` (Descending)

This index is defined in `firestore.indexes.json` and will be created when you deploy.

## 🔒 Security Rules

Updated rules allow:
- **Deans**: Read/write their own `/users/{uid}/course_schedules` subcollection
- **Registrars**: Read all course schedules (view-only)
- **Other roles**: No access

## 🐛 Troubleshooting

### Error: "The query requires an index"
**Solution**: Deploy the indexes using one of the methods above, or click the link in the error message to create it via Firebase Console.

### Error: "Permission denied"
**Solution**: Deploy the Firestore rules. Make sure you're logged in as a dean.

### Error: "Cannot add section"
**Check**:
1. Are the Firestore rules deployed?
2. Are you logged in as a dean?
3. Check browser console (F12) for detailed error message
4. Is the section name not empty?

### PowerShell Execution Policy Error
**Solution**: Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Files Modified

- `src/pages/CourseSchedulingNew.jsx` - Main course scheduling page
- `src/services/plotScheduleService.js` - Added section management functions
- `firestore.rules` - Added course_schedules rules
- `firestore.indexes.json` - Added entries index
- `deploy-firestore.bat` - Helper script for deployment
- `deploy-rules.bat` - Helper script for rules only
- `deploy-indexes.bat` - Helper script for indexes only

## ✨ Features Summary

### For Deans
- ✅ Create custom section names
- ✅ Delete sections (with all schedules)
- ✅ Plot schedules for multiple sections
- ✅ Prominent "My Schedule" card for quick access
- ✅ Visual indicators (YOU badge, EDIT badge)
- ✅ Loading and success/error feedback

### For Registrars
- ✅ View all college schedules
- ✅ Browse by college and dean
- ✅ See all sections per dean
- ❌ Cannot create/edit/delete sections

## 🎨 UI Enhancements

1. **My Course Schedule Card** (Dean-only)
   - Gradient red background
   - Calendar icon
   - "EDIT" badge
   - Quick access button

2. **Section Pills**
   - Active section: Red background, white text
   - Inactive sections: White background, hover effects
   - Delete button appears on hover (for deans)

3. **Empty State**
   - "No sections added yet" message
   - "Add Your First Section" button

4. **Modals**
   - Add Section modal with name and year inputs
   - Loading modal with spinner
   - Success/error notification modals

## 🔄 Next Steps

1. Deploy Firestore rules and indexes (see Step 1 above)
2. Test as a dean user
3. Verify section creation/deletion works
4. Verify schedule plotting works per section
5. Test as registrar to ensure view-only access works

---

**Need Help?** Check the browser console (F12) for detailed error messages.
