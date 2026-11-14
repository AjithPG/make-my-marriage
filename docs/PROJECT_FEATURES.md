# Make My Marriage — Project Features Document

**Document version:** 1.0  
**Status:** Draft  
**Document type:** Product planning / planned features  
**Product:** Make My Marriage

---

## 1. Product Overview

Make My Marriage is a web platform for creating a beautiful, shareable wedding experience for Indian weddings. Brides, grooms, and authorized family members can organize wedding information and share it with guests through a personalized wedding website.

The guest experience is the primary focus: guests should be able to view wedding details, event schedules, invitations, photos, and a live stream from a simple link without needing to install an application.

## 2. Product Goals

- Make wedding information easy to create, update, and share.
- Give guests a polished, mobile-friendly wedding website.
- Help the bride, groom, and authorized family members keep wedding information organized.
- Protect private wedding details and media through appropriate access controls.
- Keep the first release focused and feasible to build.

## 3. Target Users

### Primary users
- **Bride and groom:** Create and manage their wedding experience.
- **Authorized family members:** Help manage wedding details, events, and photos.

### Guest users
- View the wedding website and event information.
- Open digital invitations shared with them.
- View authorized photos and the wedding live stream.

## 4. Planned Features — MVP

### 4.1 Wedding Setup

Users can create a wedding workspace and configure the main wedding information.

**Planned capabilities**
- Add bride and groom details.
- Add wedding title, dates, and important information.
- Add venue names, addresses, and map links.
- Create and manage multiple events, such as engagement, mehendi, haldi, wedding ceremony, and reception.
- Set event dates, times, locations, and descriptions.
- Invite authorized family members and assign appropriate access permissions.

### 4.2 Guest Management

Users can organize guest information for wedding events.

**Planned capabilities**
- Add, edit, and remove guest details.
- Organize guests by family or group.
- Assign guests to relevant wedding events.
- Import guest details where practical.
- Restrict guest information to authorized users.

**Out of scope**
- Tracking invitation status.
- Collecting RSVP responses.
- Tracking attendance responses.
- Sending RSVP reminders.

### 4.3 Digital Invitations

Users can create and share digital wedding invitations.

**Planned capabilities**
- Create an invitation using available designs.
- Display couple details and relevant event information.
- Preview the invitation before publishing or sharing.
- Generate a shareable invitation or wedding website link.
- Provide a **Share on WhatsApp** option using a prefilled message and link.
- Allow users to copy the link for sharing through other channels.

**Note:** WhatsApp sharing should open the user's sharing flow; the app should not send messages automatically without an appropriate integration and authorization.

### 4.4 Wedding Website

Each wedding can have a personalized, shareable website.

**Planned capabilities**
- Display bride and groom details.
- Show wedding events, dates, times, and venues.
- Present invitation details and important guest information.
- Include a photo gallery and live-stream section when available.
- Provide a mobile-friendly public guest view.
- Let authorized users preview, publish, update, and unpublish the website.
- Avoid requiring guests to create an account for information intended to be public.

### 4.5 Photo Gallery

Authorized people can upload and organize wedding photos.

**Planned capabilities**
- Upload photos to the appropriate wedding or event gallery.
- Allow only users with the required permission to upload or manage photos.
- Organize photos by event.
- Display photos on the wedding website according to the configured privacy settings.
- Allow authorized users to remove inappropriate or unwanted uploads.
- Provide clear loading, upload-progress, and error states.

**Privacy note:** Public visibility should be an explicit choice. Private galleries must not be exposed through guessable links or client-side checks alone.

### 4.6 Live Wedding Through YouTube

The platform will use a YouTube live-stream link instead of building its own streaming infrastructure.

**Planned capabilities**
- Allow an authorized organizer to add or update a YouTube live-stream URL for an event.
- Validate the link and show an embedded player when supported.
- Display the stream on the wedding website.
- Provide an option to open the stream directly on YouTube.
- Show a useful fallback when the stream is unavailable or has ended.

**Privacy note:** An unlisted YouTube stream can be watched by anyone who obtains its link. Do not describe an unlisted stream as fully private or password-protected.

### 4.7 In-app Notifications and Reminders

Notifications and reminders are for the bride, groom, and authorized wedding collaborators—not for guests.

**Planned capabilities**
- Provide an in-app notification center.
- Notify users about relevant wedding-planning activity.
- Create reminders for upcoming events and task deadlines.
- Show notifications as read or unread.
- Link a notification to its related event or task.
- Avoid duplicate reminders where practical.
- Allow users to configure basic reminder preferences.

**Example notifications**
- “Your wedding ceremony is in 3 days.”
- “Your invitation design task is due tomorrow.”
- “A wedding event has been updated.”
- “New photos have been uploaded to your gallery.”

**Scope clarification**
- In-app notifications are visible inside the application.
- Reminders can be scheduled and shown in the notification center.
- Browser push notifications, email notifications, SMS, and automated WhatsApp notifications are not included in the initial scope unless separately approved.

## 5. Cross-cutting Requirements

These requirements apply throughout the MVP and are not optional standalone features.

### 5.1 Data Privacy and Security
- Enforce authorization on the server and data-storage layer.
- Separate data by wedding workspace.
- Restrict wedding editing to authorized users.
- Protect guest contact information and private media.
- Use secure authentication and session handling.
- Avoid exposing secrets or privileged keys in client-side code.
- Provide appropriate controls for publishing, unpublishing, and deleting wedding content.
- Define data retention and deletion behavior before launch.

### 5.2 Accessibility
- Aim to conform to WCAG 2.2 Level AA where applicable.
- Support keyboard navigation and visible focus states.
- Use readable text, sufficient color contrast, and accessible form labels.
- Provide meaningful alternative text for informative images.
- Ensure dialogs, menus, and notifications are accessible to assistive technologies.

### 5.3 Mobile Usability
- Support common mobile, tablet, and desktop screen sizes.
- Make invitations and wedding websites easy to read on phones.
- Use touch-friendly controls.
- Optimize images and page loading for mobile networks.
- Test key guest journeys on mobile browsers.

### 5.4 Reliability and Usability
- Show loading, empty, success, and error states.
- Provide confirmation for destructive actions.
- Handle invalid or unavailable YouTube links gracefully.
- Ensure published wedding information updates correctly when authorized users make changes.

## 6. Features Planned After MVP — Version 1.1+

### 6.1 Wedding Budget and Expense Tracking
- Set an overall wedding budget.
- Organize expenses by category or event.
- Track estimated and actual expenses.
- Record payment status and upcoming payment deadlines.

### 6.2 Vendor Management
- Store vendor names and contact details.
- Record quotations and booking details.
- Track contracts, payment deadlines, and booking status.
- Associate vendors with relevant wedding events.

### 6.3 WhatsApp-friendly Communication Enhancements
- Improve ready-to-share messages for events and updates.
- Explore approved integrations for automated messaging.
- Evaluate provider requirements, user consent, delivery costs, and message templates before implementation.

**MVP distinction:** Manual WhatsApp sharing for digital invitations is included in the MVP. Automated WhatsApp messaging is a later enhancement.

### 6.4 Regional Languages and Cultural Templates
- Add regional-language support.
- Provide culturally relevant invitation designs and event templates.
- Support localized text, dates, and content presentation.
- Validate templates with users from the intended communities.

## 7. Explicitly Out of Scope for MVP

- RSVP collection and attendance tracking.
- Guest RSVP reminders.
- Automated guest notifications.
- Building a custom live-video streaming service.
- Wedding budget and expense tracking.
- Vendor booking or marketplace functionality.
- Automated WhatsApp messaging.
- A dedicated native mobile application.
- Advanced AI wedding-planning features.

These items can be reconsidered after validating user needs and MVP usage.

## 8. High-level User Journeys

### Journey A: Create and publish a wedding
1. Bride or groom signs in.
2. Creates a wedding workspace.
3. Adds couple details, dates, locations, and events.
4. Invites authorized family collaborators.
5. Creates a digital invitation and wedding website.
6. Previews and publishes the website.
7. Shares the link with guests.

### Journey B: Guest views the wedding
1. Guest receives a shared link.
2. Opens the wedding website on a phone or computer.
3. Views the couple's details and event schedule.
4. Opens venue directions if provided.
5. Views available photos or the YouTube live stream.

### Journey C: Authorized person uploads photos
1. Authorized user signs in.
2. Selects the wedding or event gallery.
3. Uploads photos.
4. Reviews the upload result.
5. Photos appear according to gallery permissions and publication settings.

### Journey D: Couple receives an in-app reminder
1. A relevant event date or task deadline is configured.
2. The system schedules or generates a reminder.
3. The reminder appears in the user's notification center.
4. The user opens the related event or task.
5. The user can mark the notification as read.

## 9. Initial Success Metrics

Measure these during MVP testing; set numeric targets after establishing a baseline.

- Percentage of users who complete wedding setup.
- Percentage of created weddings that publish a website.
- Time required to publish the first wedding website.
- Number of invitation links shared.
- Guest website visits and mobile usability.
- Successful photo-upload rate.
- Successful YouTube embed rate for supported links.
- Percentage of reminders opened or marked as read.
- Number of access-control or privacy issues reported.
- User satisfaction from couples and guests.

## 10. Suggested Release Order

1. Wedding setup and multiple events.
2. Authorization and wedding-level data separation.
3. Wedding website and guest-facing event details.
4. Digital invitations and WhatsApp link sharing.
5. Guest management.
6. Authorized photo gallery.
7. YouTube live-stream embedding.
8. In-app notifications and scheduled reminders.
9. Accessibility, responsive design, security, and end-to-end testing across all journeys.

Privacy, accessibility, and mobile usability should be addressed throughout development rather than postponed until the end.

## 11. Open Product Decisions

Confirm these before implementation:
- Which wedding information should be public by default, and which should require restricted access?
- Can family collaborators edit all wedding details, or should permissions be configurable?
- Should photo galleries be public, private, or configurable per event?
- Should reminders be based on fixed defaults or user-configurable schedules?
- What image-storage limits and retention rules should apply?
- Should a wedding website remain accessible after the wedding, and for how long?

## 12. Status and Change Management

This document records the planned feature scope, not a claim that features have already been implemented.

- **Current status:** Planning / draft.
- Update this document when product scope or release priorities change.
- Record significant decisions and reasons for changes.
- Validate proposed features with real users before expanding the MVP.
