import {
    CommonServiceIds,
    IExtensionDataService,
    IProjectPageService,
} from "azure-devops-extension-api"
import * as SDK from "azure-devops-extension-sdk"
import JSONEditor, { JSONEditorOptions } from "jsoneditor"
import { SettingsData } from "./SettingsData"
import schema from "./TemplateSchema.json"
import "jsoneditor/dist/jsoneditor.css"
import "./settings.scss"

class Program {
    public static initialized = false;
    public static settings: SettingsData
    private static editor: JSONEditor
    public static async run(): Promise<void> {
        SDK.init({
            applyTheme: true,
            loaded: false,
        })
        await SDK.ready()
        this.initSettings()
        SDK.notifyLoadSucceeded()
    }

    private static async initSettings(): Promise<void> {
        const extension: SDK.IExtensionContext = SDK.getExtensionContext()
        const projectService = await SDK.getService<IProjectPageService>(
            CommonServiceIds.ProjectPageService
        )
        const project = await projectService.getProject()
        if (project === undefined) {
            throw Error("No project defined.")
        }
        const dataService = await SDK.getService<IExtensionDataService>(
            CommonServiceIds.ExtensionDataService
        )
        this.settings = new SettingsData(
            await dataService.getExtensionDataManager(
                extension.id,
                await SDK.getAccessToken()
            ),
            project.id
        )
        await this.initForm()
    }
    private static getTasksTemplateField(): HTMLElement {
        const tasksTemplateId = "tasks-template"
        const element = document.getElementById(tasksTemplateId)
        if (!element) {
            throw Error(
                "The tasks template editor element(id=" +
                tasksTemplateId +
                ") not found."
            )
        }
        return element
    }
    
    /**
     * Ensures all field values are preserved as strings, regardless of locale
     */
    private static preserveFieldValues(data: any): any {
        if (data && data.templates) {
            data.templates.forEach((template: any) => {
                if (template.tasks) {
                    template.tasks.forEach((task: any) => {
                        if (task.fields) {
                            task.fields.forEach((field: any) => {
                                if (field.value !== undefined && field.value !== null) {
                                    // If it's a number, convert it back to locale-appropriate string
                                    if (typeof field.value === 'number') {
                                        // Check if the original intention was a decimal number
                                        // For French locale, we want to preserve comma notation
                                        const userLocale = navigator.language || 'en-US';
                                        if (userLocale.startsWith('fr') || userLocale.includes('-FR')) {
                                            // Convert back to French format
                                            field.value = field.value.toString().replace('.', ',');
                                        } else {
                                            // Keep as standard format
                                            field.value = field.value.toString();
                                        }
                                    } else {
                                        // Ensure it's a string
                                        field.value = String(field.value);
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
        return data;
    }
    
    private static async initForm(): Promise<void> {
        const tasksTemplateField = Program.getTasksTemplateField()
        const tasksTemplateValue = await Program.settings.getChildTasksTemplateSetup()
        
        // Preserve string values when loading
        const preservedValue = Program.preserveFieldValues(tasksTemplateValue);
        
        const options: JSONEditorOptions = {
            mode: "tree",
            modes: ["tree", "text"],
            schema: schema,
            // Disable automatic type conversion for field values
            onChangeText: (jsonString: string) => {
                // When in text mode, preserve the exact text
                return jsonString;
            },
            // Custom validation to ensure field values are strings
            onValidate: (json: any) => {
                const errors: any[] = [];
                
                if (json && json.templates) {
                    json.templates.forEach((template: any, tIndex: number) => {
                        if (template.tasks) {
                            template.tasks.forEach((task: any, taskIndex: number) => {
                                if (task.fields) {
                                    task.fields.forEach((field: any, fieldIndex: number) => {
                                        if (field.value !== undefined && field.value !== null && typeof field.value !== 'string') {
                                            errors.push({
                                                path: ['templates', tIndex, 'tasks', taskIndex, 'fields', fieldIndex, 'value'],
                                                message: 'Field value should be a string'
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                
                return errors;
            }
        }
        
        Program.editor = new JSONEditor(
            tasksTemplateField,
            options,
            preservedValue
        )

        const button = document.getElementById("child-tasks-template-button")
        if (button === null) {
            throw Error("The form element was not found.")
        }
        button.addEventListener("click", Program.saveEvent)
    }
    
    private static async saveEvent(e: Event): Promise<void> {
        e.preventDefault()
        if (Program.editor) {
            try {
                // Get the value as an object
                let value = Program.editor.get()
                
                // Preserve field values as strings
                value = Program.preserveFieldValues(value);
                
                // Log for debugging
                console.log("Saving template data:", value);
                
                // Convert to JSON string
                const jsonString = JSON.stringify(value)
                await Program.settings.setChildTasksTemplate(jsonString)
                
                // Show success message (optional)
                console.log("Template saved successfully");
                
            } catch (error) {
                console.error("Error while saving json template:", error)
                throw Error("Error while saving json template.")
            }
        } else {
            throw Error("JSON Editor object not defined.")
        }
    }
}
if (Program.initialized) {
    console.error("The application is already initialized.")
} else {
    Program.run().then(() => {
        console.info("Extension initialized.")
    })
}