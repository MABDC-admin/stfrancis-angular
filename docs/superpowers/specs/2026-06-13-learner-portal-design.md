# Learner Portal Design

## Scope

Build a new Student/Learner portal inside the existing SFXSAI Angular/Nest/PostgreSQL app. The portal uses the `STUDENT` role and the test account `student1@sfxsai.com / 123456`.

## Architecture

- Frontend routes live under `/student/...`.
- A standalone Angular `StudentPortalComponent` renders route-specific portal views from route data.
- `StudentPortalService` owns local persisted state for learner profile, classes, attendance, grades, assignments, submissions, resources, announcements, messages, and settings.
- Shared pure utility functions cover general average, dashboard metrics, assignment completion, attendance percentage, performance labels, and resource filtering.
- Backend changes are limited to role seed and read/access permissions needed by the shared shell. Full backend persistence for LMS entities remains a later hardening phase.

## Modules

- Dashboard: profile summary, today's schedule, announcements, pending assignments, attendance, grade cards, quick actions.
- Student Profile: editable contact UI, adviser details, academic summary.
- My Classes and Class Workspace: subject cards, lessons, assignments, resources, announcements, discussion preview.
- Assignments and Submission Center: status filters, file/text upload UI, submission history, resubmission.
- Grades and Performance: quarterly subject grades, computed average, performance labels, visual bars.
- Attendance: summary cards and history by subject.
- Schedule: weekly timetable with current-class highlight.
- Resources: searchable/filterable materials list.
- Announcements: school and class notices with read/unread interaction.
- Messaging: learner-to-teacher/adviser chat UI.
- Settings: profile notification toggles, password validation UI, theme preview toggle.

## Verification

- TDD utility spec red/green.
- Angular build.
- NestJS build.
- WSL sync, seed, restart.
- Live login API check returns role `STUDENT`.
- `/student/dashboard` returns HTTP 200.
