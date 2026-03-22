#!/usr/bin/env python3
"""
Native messaging host for Send to Claude Code.
Receives JSON from Chrome, writes to /tmp/claude-page.json.
"""

import json
import struct
import sys


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


def main():
    msg = read_message()
    if not msg:
        return

    with open("/tmp/claude-page.json", "w") as f:
        json.dump(msg, f, indent=2)

    send_message({"status": "ok"})


if __name__ == "__main__":
    main()
