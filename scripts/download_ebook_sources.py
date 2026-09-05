import os
import subprocess
import json

# Master List of all 93 Launch Catalog Repositories
ALL_REPOS = [
    # Initial 5 Core Classics
    "lewis-carroll_through-the-looking-glass_john-tenniel",
    "robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde",
    "lewis-carroll_alices-adventures-in-wonderland_john-tenniel",
    "mary-shelley_frankenstein",
    "bram-stoker_dracula",

    # Popular Short Masterworks & Novellas
    "oscar-wilde_the-picture-of-dorian-gray",
    "robert-louis-stevenson_treasure-island",
    "arthur-conan-doyle_the-adventures-of-sherlock-holmes",
    "jane-austen_pride-and-prejudice",
    "f-scott-fitzgerald_the-great-gatsby",
    "jack-london_the-call-of-the-wild",
    "h-g-wells_the-time-machine",
    "charles-dickens_a-christmas-carol",
    "h-g-wells_the-invisible-man",
    "h-g-wells_the-island-of-doctor-moreau",
    "hermann-hesse_siddhartha_various-translators",
    "h-g-wells_the-war-of-the-worlds",

    # Top 100 Launch Catalog
    "charlotte-perkins-gilman_short-fiction",
    "charlotte-bronte_jane-eyre",
    "emily-bronte_wuthering-heights",
    "gaston-leroux_the-phantom-of-the-opera_alexander-teixeira-de-mattos",
    "washington-irving_the-legend-of-sleepy-hollow",
    "sheridan-le-fanu_carmilla",
    "henry-james_the-turn-of-the-screw",
    "nathaniel-hawthorne_the-house-of-the-seven-gables",
    "charlotte-bronte_villette",
    "anne-bronte_the-tenant-of-wildfell-hall",
    "jules-verne_twenty-thousand-leagues-under-the-seas_f-p-walter",
    "jules-verne_around-the-world-in-eighty-days_george-makepeace-towle",
    "jules-verne_journey-to-the-center-of-the-earth_f-p-walter",
    "edgar-rice-burroughs_a-princess-of-mars",
    "edgar-rice-burroughs_the-gods-of-mars",
    "h-g-wells_the-first-men-in-the-moon",
    "edward-bellamy_looking-backward-2000-1887",
    "william-morris_news-from-nowhere",
    "h-g-wells_the-food-of-the-gods-and-how-it-came-to-earth",
    "charlotte-perkins-gilman_herland",
    "edwin-a-abbott_flatland",
    "arthur-conan-doyle_the-hound-of-the-baskervilles",
    "arthur-conan-doyle_a-study-in-scarlet",
    "arthur-conan-doyle_the-sign-of-the-four",
    "arthur-conan-doyle_the-memoirs-of-sherlock-holmes",
    "arthur-conan-doyle_the-return-of-sherlock-holmes",
    "wilkie-collins_the-moonstone",
    "wilkie-collins_the-woman-in-white",
    "charles-dickens_the-mystery-of-edwin-drood",
    "maurice-leblanc_the-extraordinary-adventures-of-arsene-lupin-gentleman-burglar_george-morehead",
    "g-k-chesterton_the-innocence-of-father-brown",
    "g-k-chesterton_the-wisdom-of-father-brown",
    "erskine-childers_the-riddle-of-the-sands",
    "john-buchan_the-thirty-nine-steps",
    "jack-london_white-fang",
    "herman-melville_moby-dick",
    "alexandre-dumas_the-count-of-monte-cristo_anonymous",
    "alexandre-dumas_the-three-musketeers_ediam-robson",
    "alexandre-dumas_twenty-years-after",
    "mark-twain_the-adventures-of-tom-sawyer",
    "mark-twain_the-adventures-of-huckleberry-finn",
    "daniel-defoe_the-life-and-adventures-of-robinson-crusoe",
    "h-rider-haggard_king-solomons-mines",
    "h-rider-haggard_she",
    "edgar-rice-burroughs_tarzan-of-the-apes",
    "jack-london_the-sea-wolf",
    "robert-louis-stevenson_kidnapped",
    "jane-austen_sense-and-sensibility",
    "jane-austen_emma",
    "jane-austen_mansfield-park",
    "jane-austen_northanger-abbey",
    "jane-austen_persuasion",
    "louisa-may-alcott_little-women",
    "leo-tolstoy_anna-karenina_constance-garnett",
    "gustave-flaubert_madame-bovary_eleanor-marx-aveling",
    "edith-wharton_the-age-of-innocence",
    "edith-wharton_the-house-of-mirth",
    "thomas-hardy_far-from-the-madding-crowd",
    "thomas-hardy_tess-of-the-durbervilles",
    "nathaniel-hawthorne_the-scarlet-letter",
    "franz-kafka_the-metamorphosis_david-wyllie",
    "fyodor-dostoevsky_crime-and-punishment_constance-garnett",
    "fyodor-dostoevsky_the-brothers-karamazov_constance-garnett",
    "victor-hugo_les-miserables_isabel-f-hapgood",
    "charles-dickens_a-tale-of-two-cities",
    "charles-dickens_great-expectations",
    "homer_the-odyssey_samuel-butler",
    "homer_the-iliad_samuel-butler",
    "marcus-aurelius_meditations_george-long",
    "plato_the-republic_benjamin-jowett",
    "friedrich-nietzsche_beyond-good-and-evil_helen-zimmern",
    "sun-tzu_the-art-of-war_lionel-giles",
    "niccolo-machiavelli_the-prince_w-k-marriott",
    "joseph-conrad_heart-of-darkness",
    "l-frank-baum_the-wonderful-wizard-of-oz",
    "j-m-barrie_peter-and-wendy",
    "frances-hodgson-burnett_the-secret-garden",
    "frances-hodgson-burnett_a-little-princess",
    "kenneth-grahame_the-wind-in-the-willows",
    "brothers-grimm_grimms-fairy-tales_edgar-taylor_marian-edwardes",
    "hans-christian-andersen_fairy-tales_h-p-paull"
]

TARGET_DIR = "/Users/humayunrashid/multicamp/liiro-ebook/ebook-contents"

def download_ebook_sources():
    os.makedirs(TARGET_DIR, exist_ok=True)
    print("=======================================================================")
    print(f"📥 DOWNLOADING EBOOK SOURCES FOR LOCAL CUSTOMIZATION & PUSHING")
    print(f"   Target Directory: {TARGET_DIR}")
    print(f"   Total Unique Repositories: {len(ALL_REPOS)}")
    print("=======================================================================\n")

    cloned = 0
    updated = 0
    failed = 0

    for idx, repo in enumerate(ALL_REPOS, 1):
        repo_dir = os.path.join(TARGET_DIR, repo)
        repo_url = f"https://github.com/standardebooks/{repo}.git"

        print(f"[{idx}/{len(ALL_REPOS)}] 📚 Repository: {repo}")

        if os.path.exists(repo_dir) and os.path.exists(os.path.join(repo_dir, ".git")):
            print(f"   🔄 Local repository exists. Resetting & running git pull...")
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
    print("🎉 LOCAL EBOOK-CONTENTS DOWNLOAD COMPLETE!")
    print(f"   Newly Cloned: {cloned} Books")
    print(f"   Updated/Existing: {updated} Books")
    print(f"   Failed/Notice: {failed} Books")
    print("=======================================================================")

if __name__ == "__main__":
    download_ebook_sources()
