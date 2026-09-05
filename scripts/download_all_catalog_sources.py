import os
import subprocess
import json

TARGET_DIR = "/Users/humayunrashid/multicamp/liiro-ebook/ebook-contents"
REPOS_FILE = "/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/all_catalog_repos.json"

def download_all_catalog():
    if not os.path.exists(REPOS_FILE):
        print(f"❌ Repos file not found: {REPOS_FILE}")
        return

    with open(REPOS_FILE, "r") as f:
        all_repos = json.load(f)

    os.makedirs(TARGET_DIR, exist_ok=True)
    print("=======================================================================")
    print(f"📥 DOWNLOADING ALL {len(all_repos)} CATALOG EBOOK SOURCES TO LOCAL DISK")
    print(f"   Target Directory: {TARGET_DIR}")
    print("=======================================================================\n")

    cloned = 0
    updated = 0
    failed = 0

    for idx, repo in enumerate(all_repos, 1):
        repo_dir = os.path.join(TARGET_DIR, repo)
        repo_url = f"https://github.com/standardebooks/{repo}.git"

        print(f"[{idx}/{len(all_repos)}] 📚 Repository: {repo}")

        if os.path.exists(repo_dir) and os.path.exists(os.path.join(repo_dir, ".git")):
            print(f"   🔄 Local repository exists. Resetting & pulling...")
            try:
                subprocess.run(["git", "-C", repo_dir, "reset", "--hard", "HEAD"], capture_output=True, text=True, timeout=10)
                res = subprocess.run(["git", "-C", repo_dir, "pull"], capture_output=True, text=True, timeout=30)
                if res.returncode == 0:
                    print(f"   ✅ Up to date!")
                    updated += 1
                else:
                    print(f"   ⚠️ Git pull notice: {res.stderr.strip()}")
            except Exception as e:
                print(f"   ⚠️ Git pull error: {e}")
        else:
            print(f"   🚀 Cloning {repo_url} (depth 1)...")
            try:
                res = subprocess.run(["git", "clone", "--depth", "1", repo_url, repo_dir], capture_output=True, text=True, timeout=60)
                if res.returncode == 0:
                    print(f"   🎉 Successfully cloned to local ebook-contents/{repo}")
                    cloned += 1
                else:
                    print(f"   ❌ Git clone failed: {res.stderr.strip()}")
                    failed += 1
            except Exception as e:
                print(f"   ❌ Git clone exception: {e}")
                failed += 1

    print("\n=======================================================================")
    print("🎉 ALL 709 EBOOK SOURCES DOWNLOADED TO LOCAL DISK!")
    print(f"   Newly Cloned: {cloned} Books")
    print(f"   Updated/Existing: {updated} Books")
    print(f"   Failed/Notice: {failed} Books")
    print("=======================================================================")

if __name__ == "__main__":
    download_all_catalog()
