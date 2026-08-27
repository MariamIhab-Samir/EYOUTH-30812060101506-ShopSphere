**Reviews and Notifications extracted as microservices.**
- No dependency on the checkout path
- Different load profile — read-heavy/event-triggered, independent of purchase volume
- Notifications specifically: owns its own persistent state (the Notification table) driven by events from the main app, rather than being a stateless pass-through action
- Only seams where splitting cost < staying-together cost

**Why stock-low and order-created stayed in the monolith, not extracted:**
- Both are stateless, single-action webhooks — receive an event, send one email, done
- No persistent state of their own to justify a separate database
- Extracting them adds a network hop and a second deployable to redeploy/monitor, with no load-pattern or release-cadence benefit over keeping them in the monolith
- They already fully satisfy the serverless/event-driven requirement (Task 4) regardless of which codebase they live in — extraction is an architecture decision (Task 3), not a Task 4 requirement