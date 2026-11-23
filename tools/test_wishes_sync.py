# SPDX-License-Identifier: LicenseRef-AllRightsReserved
# SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
"""Offline tests for the parts of wishes_sync.py that decide what reaches the issue tracker.
Run: python3 tools/test_wishes_sync.py"""
import sys, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wishes_sync as ws

NOW = 1_800_000_000
DAY = 24 * 3600


def wish(i, votes=3, age=2 * DAY, status="open", body=""):
    return {"id": i, "title": f"Wish {i}", "body": body, "votes": votes, "created": NOW - age, "status": status}


class ToFile(unittest.TestCase):
    def test_filters(self):
        wishes = [wish(1), wish(2, votes=1), wish(3, age=3600), wish(4, status="planned"), wish(5)]
        self.assertEqual([w["id"] for w in ws.to_file(wishes, linked={5}, now=NOW)], [1])

    def test_cap(self):
        wishes = [wish(i) for i in range(1, 20)]
        self.assertEqual(len(ws.to_file(wishes, set(), now=NOW)), ws.MAX_PER_RUN)


class Body(unittest.TestCase):
    def test_defang(self):
        self.assertEqual(ws.defang("ping @elija and see #12, mail a@b.c, url/#3"),
                         "ping @​elija and see #​12, mail a@​b.c, url/#3")

    def test_marker_and_quote(self):
        b = ws.issue_body(wish(7, body="line one\n\n@someone"))
        self.assertIn("> line one\n>\n> @​someone", b)
        self.assertEqual(ws.MARKER.search(b).group(1), "7")


class Combine(unittest.TestCase):
    def test_states(self):
        self.assertEqual(ws.combine([]), "open")
        self.assertEqual(ws.combine(["done", "done"]), "done")
        self.assertEqual(ws.combine(["done", "open"]), "doing")
        self.assertEqual(ws.combine(["planned", None]), "planned")


if __name__ == "__main__":
    unittest.main()
