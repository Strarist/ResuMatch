#!/usr/bin/env python3
import subprocess
import sys
import os
from datetime import datetime

def run_command(command):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def create_release_tag():
    """Create and push the v1-core-stable tag."""
    # Get current branch
    current_branch = run_command("git rev-parse --abbrev-ref HEAD")
    
    # Get current commit hash
    commit_hash = run_command("git rev-parse HEAD")
    
    # Get commit message
    commit_message = run_command("git log -1 --pretty=%B")
    
    # Create tag message
    tag_message = f"""ResuMatchAI v1 Core Stable Release

This tag marks the completion of the core matching functionality:
- Education matching with degree and field analysis
- Skill matching with semantic similarity
- Experience matching with role alignment
- Real-time updates via WebSocket
- Cache consistency with Redis pub/sub
- Comprehensive test coverage

Commit: {commit_hash}
Branch: {current_branch}
Date: {datetime.utcnow().isoformat()}

{commit_message}
"""
    
    # Create tag
    tag_name = "v1-core-stable"
    run_command(f'git tag -a {tag_name} -m "{tag_message}"')
    
    # Push tag
    run_command(f"git push origin {tag_name}")
    
    print(f"\nSuccessfully created and pushed tag: {tag_name}")
    print(f"Commit: {commit_hash}")
    print(f"Branch: {current_branch}")
    print("\nTag message:")
    print(tag_message)

def main():
    """Main function."""
    # Check if we're in a git repository
    if not os.path.exists(".git"):
        print("Error: Not in a git repository")
        sys.exit(1)
    
    # Check if there are uncommitted changes
    status = run_command("git status --porcelain")
    if status:
        print("Error: There are uncommitted changes")
        print("Please commit or stash them before creating a release tag")
        sys.exit(1)
    
    # Check if tag already exists
    tags = run_command("git tag")
    if "v1-core-stable" in tags.split("\n"):
        print("Error: Tag v1-core-stable already exists")
        sys.exit(1)
    
    # Create tag
    create_release_tag()

if __name__ == "__main__":
    main() 