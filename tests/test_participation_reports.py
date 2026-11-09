import unittest

from fastapi import HTTPException

from src.app import activities, get_activities


class ParticipationReportTests(unittest.TestCase):
    def test_activity_filter_returns_roster_and_capacity(self):
        report = get_activities(activity_name="Chess Club")

        self.assertEqual(list(report), ["Chess Club"])
        self.assertEqual(report["Chess Club"]["participants"], activities["Chess Club"]["participants"])
        self.assertEqual(report["Chess Club"]["participant_count"], 2)
        self.assertEqual(report["Chess Club"]["spots_remaining"], 10)

    def test_student_email_filter_finds_joined_activities_case_insensitively(self):
        report = get_activities(student_email="MICHAEL@mergington.edu")

        self.assertEqual(list(report), ["Chess Club"])

    def test_unknown_activity_returns_not_found(self):
        with self.assertRaises(HTTPException) as error:
            get_activities(activity_name="Unknown Club")

        self.assertEqual(error.exception.status_code, 404)

    def test_student_without_signups_gets_empty_report(self):
        self.assertEqual(get_activities(student_email="nobody@mergington.edu"), {})

    def test_activity_and_student_filters_can_be_combined(self):
        report = get_activities(
            activity_name="Chess Club",
            student_email="emma@mergington.edu",
        )

        self.assertEqual(report, {})


if __name__ == "__main__":
    unittest.main()