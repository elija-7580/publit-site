# SPDX-License-Identifier: LicenseRef-AllRightsReserved
# SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
"""Offline tests for wishes_sync.py.
Run: python3 tools/test_wishes_sync.py"""
import sys, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wishes_sync as ws

class Markers(unittest.TestCase):
    def test_marker_links(self):
        issues = [{"number": 140, "body": "> x\n\n<!-- publit-wish:15 -->\n"},
                  {"number": 141, "body": "<!-- publit-wish:15 -->"},            # double: first one wins
                  {"number": 142, "body": "<!-- publit-wish:4 -->", "pull_request": {}},
                  {"number": 143, "body": None}]
        self.assertEqual(ws.marker_links(issues), {15: 140})


class Refs(unittest.TestCase):
    def test_only_own_repositories(self):
        text = "see elija-7580/Publit#88, https://github.com/Elija-7580/Publit-Android/issues/3 and evil/repo#1 https://github.com/evil/repo/issues/2"
        self.assertEqual(sorted(ws.refs(text)), [("elija-7580/publit", 88), ("elija-7580/publit-android", 3)])


class Combine(unittest.TestCase):
    def test_states(self):
        self.assertEqual(ws.combine([]), "open")
        self.assertEqual(ws.combine(["done", "done"]), "done")
        self.assertEqual(ws.combine(["done", "open"]), "doing")
        self.assertEqual(ws.combine(["planned", None]), "planned")


if __name__ == "__main__":
    unittest.main()
