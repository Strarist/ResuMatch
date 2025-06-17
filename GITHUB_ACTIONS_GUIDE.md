# GitHub Actions Guide for Beginners 🚀

## 🔧 **What We Just Fixed**

### **The Problem**
You were getting this error:
```
Error: Both a base ref and head ref must be provided, either via the base_ref/head_ref config options, base-ref/head-ref workflow action options, or by running a pull_request/pull_request_target/merge_group workflow.
```

### **Why This Happened**
The `actions/dependency-review-action@v4` is designed to **only work on pull requests** because it needs to compare two different versions of your code:
- **Base ref**: The original code (usually `main` branch)
- **Head ref**: Your changes (your feature branch)

When you try to run it on a regular push or manual trigger, GitHub doesn't know what to compare against!

## ✅ **How We Fixed It**

### **Step 1: Separated the Workflows**
We created **two separate workflow files**:

1. **`.github/workflows/dependency-review.yml`** - Only runs on pull requests
2. **`.github/workflows/ci-cd.yml`** - Runs on push, pull requests, and manual triggers

### **Step 2: Fixed Job Dependencies**
We removed the dependency review job from the main CI/CD workflow so it doesn't block other jobs.

## 📋 **How GitHub Actions Work (Simple Explanation)**

### **What are GitHub Actions?**
Think of GitHub Actions as **automated robots** that do tasks for you when you push code or create pull requests.

### **Workflow Triggers**
```yaml
on:
  push:           # Runs when you push code to a branch
  pull_request:   # Runs when someone creates/updates a pull request
  workflow_dispatch:  # Runs when you manually trigger it
```

### **Jobs and Steps**
```yaml
jobs:
  my-job:                    # A job is like a task
    runs-on: ubuntu-latest   # What computer to run on
    steps:                   # Steps are like instructions
      - name: Step 1         # Each step does something
        run: echo "Hello"
      - name: Step 2
        run: echo "World"
```

## 🎯 **What Happens Now**

### **When You Push Code:**
1. ✅ **CI/CD Pipeline** runs (tests, builds, deploys)
2. ❌ **Dependency Review** does NOT run (because it's not a pull request)

### **When You Create a Pull Request:**
1. ✅ **Dependency Review** runs (checks for security issues)
2. ✅ **CI/CD Pipeline** runs (tests, builds, deploys)

## 🛠️ **How to Test This**

### **Test 1: Push to Main Branch**
```bash
git add .
git commit -m "Test push workflow"
git push origin main
```
**Expected**: CI/CD pipeline runs, dependency review does NOT run

### **Test 2: Create a Pull Request**
1. Create a new branch: `git checkout -b test-pr`
2. Make a change: `echo "# Test" >> README.md`
3. Commit and push: `git add . && git commit -m "Test PR" && git push origin test-pr`
4. Go to GitHub and create a pull request
**Expected**: Both dependency review AND CI/CD pipeline run

## 📚 **Common GitHub Actions Concepts**

### **Conditions (`if` statements)**
```yaml
jobs:
  my-job:
    if: github.event_name == 'pull_request'  # Only run on PRs
    runs-on: ubuntu-latest
```

### **Job Dependencies (`needs`)**
```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job 1"
  
  job2:
    needs: job1  # Job 2 waits for Job 1 to finish
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job 2"
```

### **Environment Variables**
```yaml
env:
  MY_VAR: "Hello World"

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - run: echo ${{ env.MY_VAR }}
```

## 🔍 **How to Check if It's Working**

### **1. Go to Your Repository on GitHub**
- Click on the **"Actions"** tab
- You'll see your workflows listed

### **2. Check Recent Runs**
- Green checkmark ✅ = Success
- Red X ❌ = Failed
- Yellow dot 🟡 = Running

### **3. View Logs**
- Click on any workflow run
- Click on a job to see detailed logs
- Look for any error messages

## 🚨 **Troubleshooting**

### **If Workflows Don't Run:**
1. Check if the workflow file is in `.github/workflows/`
2. Make sure the file has `.yml` or `.yaml` extension
3. Check the `on:` section for correct triggers

### **If Jobs Fail:**
1. Click on the failed job
2. Look at the error messages
3. Check if all required secrets are set up

### **If Dependencies Are Missing:**
1. Check the `needs:` section
2. Make sure all required jobs exist
3. Check if job names match exactly

## 🎉 **You're All Set!**

Your GitHub Actions are now properly configured:
- ✅ Dependency review runs only on pull requests
- ✅ CI/CD pipeline runs on all events
- ✅ No more confusing error messages

**Next time you push code or create a pull request, everything should work smoothly!** 🚀 