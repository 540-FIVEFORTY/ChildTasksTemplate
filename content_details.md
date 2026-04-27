# Create linked child tasks from a parent work item

Use this extension to generate child work items from reusable project templates. The extension creates the linked sub tasks under the parent work item and fills the configured fields automatically.

## General information

There are two things to know to use this extension comfortably.

- How to set up a template of tasks

- How to create the linked child tasks

### How to setup a template of tasks

Go to the extension settings for your project. The modern settings page supports both a visual editor and direct JSON editing. You can also add a new template by pasting JSON into the dedicated import action in the editor.

![Settings screen](https://github.com/dbru540/ChildTasksTemplate/raw/main/doc/project_setup.png)

You can set up parent-field interpolation in child tasks. For example, the generated task can reuse the parent title, ID, URL, area path, or iteration path. The settings page also loads field suggestions from your Azure DevOps project metadata for the selected work item type.

### How to create the linked sub tasks

When you are on a work item, open the action menu and click `Add tasks` as shown below. You can select one or more templates, and the child tasks are created with the proper parent link automatically.

![Settings screen](https://github.com/dbru540/ChildTasksTemplate/raw/main/doc/Add_tasks.png)
