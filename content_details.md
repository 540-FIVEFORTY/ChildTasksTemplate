# Create linked child tasks from a template, in one click

Stop re-typing the same tasks on every user story. Define reusable templates of child work items for your project, then create them under any parent work item in one click — already linked to the parent, titled, estimated and placed in the right area and iteration.

![Add tasks from the work item menu](https://raw.githubusercontent.com/dbru540/ChildTasksTemplate/main/doc/add_child_tasks_screen.png)

## What you get

- **Add tasks** action on the work item form, on board and backlog cards, and in query results.
- **Several templates at once** — select one or more templates and every task they contain is created.
- **Parent values in children** — reuse the parent's title, ID, area, iteration, assignee or any other field.
- **Any child type** — create Tasks, Bugs or any other work item type allowed by your process.
- **Visual editor** — build templates with forms, or switch to JSON mode.
- **Smart field input** — field names are suggested from your project's process, with hints for drop-down values, dates and decimals.
- **Validation before save** — invalid fields and values are flagged in the editor instead of failing later.
- **Clear results** — see what was created and, if something failed, why.

## What's new in 3.0

Version 3 is a complete rewrite of the extension.

- New visual template editor, with a JSON mode and one-click JSON import and copy.
- Field auto-completion and value hints loaded from your project.
- Templates can create any work item type, not only Tasks.
- Field values are validated before the template is saved.
- A results summary after creation, including partial failures.
- Decimal estimates are handled correctly in every browser locale.

**Upgrading from 2.x is automatic.** Your existing templates are converted the first time they are loaded, and the **Add tasks** action and the extension's permissions are unchanged.

## 1. Set up your templates

Go to **Project settings → Extensions → Child Tasks Template**. A sample *Development* template is provided the first time so you have a starting point.

- **Add Template** creates a new template, **Add Task** adds a child work item to it, and **Add Field** sets a field on that child. Start typing a field name to get suggestions.
- **Add Template via JSON** imports a template you pasted.
- The **Visual / JSON** toggle shows the whole configuration as JSON. Use **Copy JSON** to reuse templates in another project.

Click **Save** when you are done. Templates are stored per project.

## 2. Create the child tasks

Open a parent work item — or right-click it on a board, backlog or query — and choose **Add tasks** from the `⋯` menu.

![Add tasks menu entry](https://raw.githubusercontent.com/dbru540/ChildTasksTemplate/main/doc/Add_tasks.png)

Select one or more templates and confirm. The child work items are created with a **Parent** link to the work item you started from.

## Reusing parent values

Put a parent field reference name between braces in a task name or a field value. It is replaced by the parent's value when the child is created.

| You write | You get |
|---|---|
| `Code review - {System.Title}` | `Code review - ` followed by the parent's title |
| `{System.IterationPath}` | The parent's iteration |
| `{System.AreaPath}` | The parent's area |
| `{System.AssignedTo.uniqueName}` | The parent's assignee (leave the parent unassigned and the child stays unassigned) |
| `#{id}` | The parent's ID |

Example of a template in JSON:

```json
{
  "version": 3,
  "templates": [
    {
      "name": "Development",
      "tasks": [
        {
          "name": "Design - {System.Title}",
          "workItemType": "Task",
          "fields": [
            { "name": "System.AreaPath", "value": "{System.AreaPath}" },
            { "name": "System.IterationPath", "value": "{System.IterationPath}" },
            { "name": "Microsoft.VSTS.Common.Activity", "value": "Design" },
            { "name": "Microsoft.VSTS.Scheduling.OriginalEstimate", "value": "2" }
          ]
        }
      ]
    }
  ]
}
```

More examples (Scrum, bug fix, Agile) and the full template reference are in the [documentation on GitHub](https://github.com/dbru540/ChildTasksTemplate#template-reference).

## Permissions and privacy

The extension requests **Work items (read and write)** so that it can read the parent work item and create its children. It acts as the signed-in user, stores templates in your Azure DevOps organization, and sends no data to any external service.

## Support

Found a bug or have an idea? [Open an issue on GitHub](https://github.com/dbru540/ChildTasksTemplate/issues) or email [dbru@fiveforty.fr](mailto:dbru@fiveforty.fr).
