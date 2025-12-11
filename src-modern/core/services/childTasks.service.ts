/**
 * Child Tasks Service - Creates child work items using direct REST API calls
 * Bypasses AMD module issues by not using getClient from azure-devops-extension-api
 */
import pupa from "pupa"
import * as SDK from "azure-devops-extension-sdk"
import type { Task } from "@core/models/Task"
import type { Field } from "@core/models/Field"
import type { Template } from "@core/models/Template"

interface WorkItem {
    id: number
    rev: number
    url: string
    fields: Record<string, any>
}

interface JsonPatchOperation {
    op: "add" | "remove" | "replace" | "copy" | "move" | "test"
    path: string
    value?: any
    from?: string
}

export class ChildTasksService {
    templates: Template[]
    private baseUrl: string = ""
    private accessToken: string = ""

    constructor(templates: Template[]) {
        this.templates = templates
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.baseUrl || !this.accessToken) {
            const host = SDK.getHost()
            this.baseUrl = `https://dev.azure.com/${host.name}`
            this.accessToken = await SDK.getAccessToken()
        }
    }

    private async apiRequest<T>(
        method: string,
        url: string,
        body?: any,
        contentType: string = "application/json"
    ): Promise<T> {
        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": contentType,
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return response.json()
    }

    private async getWorkItem(projectId: string, workItemId: number): Promise<WorkItem> {
        await this.ensureInitialized()
        const url = `${this.baseUrl}/${projectId}/_apis/wit/workitems/${workItemId}?api-version=7.1`
        return this.apiRequest<WorkItem>("GET", url)
    }

    private async createWorkItem(
        projectId: string,
        workItemType: string,
        patchDocument: JsonPatchOperation[]
    ): Promise<WorkItem> {
        await this.ensureInitialized()
        const url = `${this.baseUrl}/${projectId}/_apis/wit/workitems/$${workItemType}?api-version=7.1`
        return this.apiRequest<WorkItem>(
            "POST",
            url,
            patchDocument,
            "application/json-patch+json"
        )
    }

    private newFieldOperation(field: string, value: any): JsonPatchOperation {
        return {
            op: "add",
            path: "/fields/" + field,
            value: ChildTasksService.normalizeValue(field, value),
        }
    }

    /**
     * Normalize numeric values - converts comma decimal separator to period
     * and converts string numbers to actual numbers for numeric fields
     */
    private static normalizeValue(fieldName: string, value: any): any {
        if (value === null || value === undefined) {
            return value
        }

        // List of known numeric fields in Azure DevOps
        const numericFields = [
            "Microsoft.VSTS.Scheduling.RemainingWork",
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            "Microsoft.VSTS.Scheduling.CompletedWork",
            "Microsoft.VSTS.Scheduling.StoryPoints",
            "Microsoft.VSTS.Scheduling.Effort",
            "Microsoft.VSTS.Scheduling.Size",
            "Microsoft.VSTS.Common.Priority",
            "Microsoft.VSTS.Common.StackRank",
            "Microsoft.VSTS.Common.BusinessValue",
            "Microsoft.VSTS.Common.TimeCriticality",
        ]

        const isNumericField = numericFields.some(f =>
            fieldName.toLowerCase() === f.toLowerCase()
        )

        if (typeof value === "string") {
            // Normalize comma to period for decimal values
            const normalized = value.replace(",", ".")

            // For numeric fields, convert to number
            if (isNumericField) {
                const num = parseFloat(normalized)
                if (!isNaN(num)) {
                    return num
                }
            }

            // For other fields, just return normalized string if it looks like a number
            // This handles cases where other numeric fields might exist
            if (/^-?\d+([.,]\d+)?$/.test(value)) {
                return normalized
            }
        }

        return value
    }

    private newParentRelation(parent: WorkItem): JsonPatchOperation {
        return {
            op: "add",
            path: "/relations/-",
            value: {
                rel: "System.LinkTypes.Hierarchy-Reverse",
                url: parent.url,
            },
        }
    }

    public async execute(context: any): Promise<void> {
        console.log("[ChildTasksService] execute called with context:", context)

        if (!this.templates) {
            console.warn("[ChildTasksService] Template is undefined or has an incorrect format.")
            return
        }

        if (!context.workItemAvailable) {
            console.warn("[ChildTasksService] Work item not available in context")
            return
        }

        const projectId = context.currentProjectGuid
        const workItemId = context.workItemId

        console.log("[ChildTasksService] Getting parent work item:", workItemId)
        const parent = await this.getWorkItem(projectId, workItemId)
        console.log("[ChildTasksService] Parent work item:", parent)

        for (let t = 0; t < this.templates.length; t++) {
            const template = this.templates[t]
            console.info("[ChildTasksService] Creating tasks from template:", template.name)

            for (let i = 0; i < template.tasks.length; i++) {
                const patch: JsonPatchOperation[] = []

                // Add parent relation
                patch.push(this.newParentRelation(parent))

                // Add title field (required)
                const task = template.tasks[i] as Task
                if (!task) {
                    continue
                }

                // Add System.Title from task name
                patch.push(this.newFieldOperation("System.Title", task.name))

                // Add other fields
                for (let j = 0; j < task.fields.length; j++) {
                    const field = task.fields[j] as Field
                    if (!field) {
                        continue
                    }
                    const interpolatedValue = ChildTasksService.interpolate(field.value, parent)
                    if (interpolatedValue !== null) {
                        patch.push(this.newFieldOperation(field.name, interpolatedValue))
                    }
                }

                console.info("[ChildTasksService] Creating task:", task.name)
                console.log("[ChildTasksService] Patch document:", JSON.stringify(patch, null, 2))

                try {
                    const workItem = await this.createWorkItem(projectId, "Task", patch)
                    console.info("[ChildTasksService] Created task", workItem.id)
                } catch (error) {
                    console.error("[ChildTasksService] Failed to create task:", error)
                    throw error
                }
            }
        }

        console.log("[ChildTasksService] All tasks created successfully")
    }

    private static interpolate(text: string | null | undefined, parent: WorkItem): string | null {
        if (!text) {
            return null
        }
        const obj: Record<string, any> = {}
        const keys = Object.keys(parent.fields)
        for (const key of keys) {
            try {
                ChildTasksService.setFieldValue(obj, key, parent.fields[key])
            } catch (error: any) {
                console.error(
                    "[ChildTasksService] Error setting field value. Name '" +
                        key +
                        "'; Value '" +
                        parent.fields[key] +
                        "'." +
                        error.message
                )
            }
        }
        obj["id"] = parent.id
        obj["rev"] = parent.rev
        obj["url"] = parent.url
        return pupa(text, obj)
    }

    private static setFieldValue(obj: Record<string, any>, fieldName: string, value: any) {
        const parts: string[] = fieldName.split(".", 2)
        if (parts.length == 2) {
            if (obj[parts[0]] === undefined) {
                obj[parts[0]] = {}
            }
            this.setFieldValue(
                obj[parts[0]],
                fieldName.substring(parts[0].length + 1),
                value
            )
        } else {
            obj[fieldName] = value
        }
    }
}
