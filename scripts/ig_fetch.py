#!/usr/bin/env python3
"""Holt die Caption/Metadaten eines Instagram-Beitrags über eine angemeldete Session.

Modi:
  ig_fetch.py <instagram-url>   -> JSON {description,title,uploader,thumbnail,webpage_url}
  ig_fetch.py --login           -> nur einloggen und Session speichern (lokales Bootstrapping)

Eine bestehende Session wird wiederverwendet; ein echter Passwort-Login passiert nur, wenn
die Session ungültig ist UND der Throttle es zulässt — das minimiert Instagram-Sperren.
Der ERSTE Login sollte lokal (Heim-IP) per --login erfolgen; die erzeugte Session-Datei
dann auf den Server kopieren, damit der Server keine frischen Datacenter-Logins braucht.

Env: IG_USERNAME, IG_PASSWORD, optional IG_TOTP_SECRET, optional IG_SESSION_DIR.
"""
import json
import os
import re
import sys
import time
from pathlib import Path

SESSION_DIR = Path(os.environ.get("IG_SESSION_DIR", "/app/cookies"))
SESSION_FILE = SESSION_DIR / "ig_session"
LOCK = SESSION_DIR / ".ig_login.lock"
LOGIN_THROTTLE_S = 1800  # höchstens alle 30 min ein Passwort-Login


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj))


def die(msg: str, code: int) -> None:
    sys.stdout.write(json.dumps({"error": msg}))
    sys.exit(code)


def shortcode(url: str) -> str | None:
    m = re.search(r"/(?:reel|reels|p|tv)/([A-Za-z0-9_-]+)", url)
    return m.group(1) if m else None


def login_allowed() -> bool:
    try:
        return not (LOCK.exists() and time.time() - LOCK.stat().st_mtime < LOGIN_THROTTLE_S)
    except OSError:
        return True


def do_login(loader, user: str, pw: str, totp: str | None) -> bool:
    import instaloader

    if not login_allowed():
        return False
    try:
        SESSION_DIR.mkdir(parents=True, exist_ok=True)
        LOCK.write_text(str(time.time()))
    except OSError:
        pass
    try:
        loader.login(user, pw)
    except instaloader.exceptions.TwoFactorAuthRequiredException:
        if not totp:
            return False
        try:
            import pyotp
            loader.two_factor_login(pyotp.TOTP(totp).now())
        except Exception:  # noqa: BLE001
            return False
    except Exception:  # noqa: BLE001 — Checkpoint/Bad Credentials/Connection
        return False
    try:
        loader.save_session_to_file(str(SESSION_FILE))
    except OSError:
        pass
    return True


def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if not arg:
        die("keine URL", 2)

    user = os.environ.get("IG_USERNAME")
    pw = os.environ.get("IG_PASSWORD")
    totp = os.environ.get("IG_TOTP_SECRET")
    if not user or not pw:
        die("keine IG-Credentials konfiguriert", 3)

    try:
        import instaloader
    except ImportError:
        die("instaloader nicht installiert", 6)

    loader = instaloader.Instaloader(
        quiet=True,
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
    )
    if SESSION_FILE.exists():
        try:
            loader.load_session_from_file(user, str(SESSION_FILE))
        except Exception:  # noqa: BLE001 — kaputte Session ignorieren
            pass

    if arg == "--login":
        if do_login(loader, user, pw, totp):
            emit({"ok": True})
        else:
            die("Login fehlgeschlagen oder Throttle aktiv (evtl. Checkpoint/2FA)", 4)
        return

    code = shortcode(arg)
    if not code:
        die("Konnte den Beitrags-Code nicht aus der URL lesen", 2)

    def fetch():
        return instaloader.Post.from_shortcode(loader.context, code)

    try:
        post = fetch()
    except Exception:  # noqa: BLE001 — meist Session abgelaufen → einmal neu einloggen (throttled)
        if not do_login(loader, user, pw, totp):
            die("Instagram-Login nicht möglich (Session abgelaufen, gedrosselt oder Account gesperrt)", 4)
        try:
            post = fetch()
        except Exception as e:  # noqa: BLE001
            die(f"Beitrag nicht abrufbar: {e}", 5)

    cap = post.caption or ""
    emit({
        "description": cap,
        "title": cap[:80],
        "uploader": post.owner_username or "",
        "thumbnail": str(post.url) if getattr(post, "url", None) else "",
        "webpage_url": arg,
    })


if __name__ == "__main__":
    main()
