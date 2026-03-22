#!/usr/bin/python3
"""
Native messaging host for Send to Claude Code.

Handles two actions:
  {"action": "list"}
    → scans ~/.claude/projects/ for recently active projects
    → returns {"projects": [{"name": "brain", "ago": "2m ago"}, ...]}

  {"action": "send", "project": "brain", "url": "...", "title": "...", "text": "...", "type": "..."}
    → writes to /tmp/claude-page-{project}.json
    → returns {"status": "ok", "file": "/tmp/claude-page-brain.json"}
"""

import json
import os
import struct
import sys
from datetime import datetime
from pathlib import Path


def read_message():
    raw = sys.stdin.buffer.read(4)
    if not raw:
        return None
    length = struct.unpack("@I", raw)[0]
    return json.loads(sys.stdin.buffer.read(length))


def send_message(msg):
    encoded = json.dumps(msg).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("@I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def resolve_project_name(dir_name):
    """Resolve the real project name from a Claude projects directory name.

    Claude encodes paths like /Volumes/TheVault/Projects/invoice-final as
    -Volumes-TheVault-Projects-invoice-final. Hyphens in original directory
    names are indistinguishable from path separators, so we walk the tree
    and test which segments actually exist on disk.
    """
    raw = dir_name.lstrip("-")
    parts = raw.split("-")

    def find_path(idx, current):
        if idx >= len(parts):
            return current if os.path.isdir(current) else None
        # Try joining 1..N remaining parts as a single directory name
        # Check longest candidates first (greedy — prefers "invoice-final" over "invoice")
        for end in range(len(parts), idx, -1):
            segment = "-".join(parts[idx:end])
            candidate = current + "/" + segment
            if os.path.isdir(candidate):
                if end == len(parts):
                    return candidate
                result = find_path(end, candidate)
                if result:
                    return result
        return None

    resolved = find_path(0, "")
    if resolved:
        return os.path.basename(resolved), resolved

    # Fallback: best guess
    fallback = "/" + "/".join(parts)
    return parts[-1] if parts else dir_name, fallback


def list_projects():
    """Scan ~/.claude/projects/ for recently active Claude Code projects."""
    projects_dir = Path.home() / ".claude" / "projects"
    if not projects_dir.exists():
        return []

    entries = []
    now = datetime.now()

    for d in projects_dir.iterdir():
        if not d.is_dir():
            continue

        # Get most recent session file modification time
        try:
            jsonl_files = list(d.glob("*.jsonl"))
            if not jsonl_files:
                mtime = d.stat().st_mtime
            else:
                mtime = max(f.stat().st_mtime for f in jsonl_files)
        except OSError:
            continue

        dt = datetime.fromtimestamp(mtime)
        diff_mins = int((now - dt).total_seconds() / 60)

        # Only show projects active in the last 7 days
        if diff_mins > 7 * 24 * 60:
            continue

        name, original_path = resolve_project_name(d.name)

        if diff_mins < 1:
            ago = "just now"
        elif diff_mins < 60:
            ago = f"{diff_mins}m ago"
        elif diff_mins < 24 * 60:
            ago = f"{diff_mins // 60}h ago"
        else:
            ago = f"{diff_mins // (24 * 60)}d ago"

        entries.append({
            "name": name,
            "path": original_path,
            "ago": ago,
            "mtime": mtime,
        })

    # Sort by most recent first, deduplicate by name (keep most recent)
    entries.sort(key=lambda x: x["mtime"], reverse=True)
    seen = set()
    unique = []
    for e in entries:
        if e["name"] not in seen:
            seen.add(e["name"])
            del e["mtime"]  # don't send internal field
            unique.append(e)

    return unique[:15]  # cap at 15


def send_page(data):
    """Write page data to /tmp/claude-page-{project}.json"""
    project = data.get("project", "default")
    payload = {
        "url": data.get("url", ""),
        "title": data.get("title", ""),
        "text": data.get("text", ""),
        "timestamp": data.get("timestamp", datetime.now().isoformat()),
        "type": data.get("type", "full_page"),
        "project": project,
    }

    filepath = f"/tmp/claude-page-{project}.json"
    with open(filepath, "w") as f:
        json.dump(payload, f, indent=2)

    # Also write to generic path
    with open("/tmp/claude-page.json", "w") as f:
        json.dump(payload, f, indent=2)

    return {"status": "ok", "file": filepath}


def main():
    msg = read_message()
    if not msg:
        return

    action = msg.get("action", "")

    if action == "list":
        projects = list_projects()
        send_message({"projects": projects})
    elif action == "send":
        result = send_page(msg)
        send_message(result)
    else:
        send_message({"error": f"unknown action: {action}"})


if __name__ == "__main__":
    main()
