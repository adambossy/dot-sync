# /triage - Triage a task from Apple Reminders into Linear and Notion

Take a task (by name or from the top of the list), research it, create a Linear ticket, add it to Notion, and remove it from Apple Reminders.

## Inputs

- **Optional argument**: A reminder name or index to triage. If omitted, read the current list and ask which item to triage.

## Workflow

### 1. Read the task from Apple Reminders

Read incomplete reminders from the "SPARA" list in Apple Reminders:

```javascript
// Use osascript -l JavaScript
const app = Application("Reminders");
const list = app.lists.byName("SPARA");
const names = list.reminders.name();
```

If the user specified a task, find the matching reminder. Otherwise, show the list and ask which item to triage.

### 2. Create a Linear ticket

Follow the `creating-linear-tickets` skill to research the codebase, ask clarifying questions, and create a well-detailed Linear ticket from the reminder text.

### 3. Add to Notion Tasks

Create a task in the Notion Tasks database using `mcp__notion__notion-create-pages`:

- **Parent data source**: `collection://f1446896-dceb-4915-877a-c29352a2cce4`
- **Properties**:
  - `Task`: The Linear ticket ID + short title (e.g., "SPA-5334: Rep profiler output files in workspace")
  - `Priority`: Map from Linear priority — Urgent/High → "High", Normal → "Medium", Low → "Low"
  - `Status`: Match the Linear ticket status — "To Do", "In Progress", or "Done"
- **Content**: The Linear ticket URL followed by a 1-2 sentence summary

### 4. Remove from Apple Reminders

Delete the reminder from the "SPARA" list:

```javascript
// Use osascript -l JavaScript — find by name, then delete
const app = Application("Reminders");
const list = app.lists.byName("SPARA");
const names = list.reminders.name();
for (let i = 0; i < names.length; i++) {
    if (names[i] === targetName) {
        list.reminders[i].delete();
        break;
    }
}
```

Note: Apple Reminders JXA can be slow. Use bulk property access (`list.reminders.name()`) rather than iterating with `whose` filters. Allow up to 30 seconds for operations.

### 5. Output

Report what was done:
- Linear ticket ID and URL
- Notion task created
- Reminder removed (or note if it wasn't found)
