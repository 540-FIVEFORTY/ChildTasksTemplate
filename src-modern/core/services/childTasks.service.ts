/**
 * Child Tasks Service - Creates child work items using direct REST API calls
 * Bypasses AMD module issues by not using getClient from azure-devops-extension-api
 */
import pupa from "pupa"
import * as SDK from "azure-devops-extension-sdk"
import type { Task } from "@core/models/Task"
import type { Template } from "@core/models/Template"
import { resolveParentWorkItem } from "@core/utils/action-context"

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

export interface ChildTaskExecutionItem {
    templateName: string
    taskName: string
    workItemType: string
    status: "success" | "failed"
    workItemId?: number
    errorMessage?: string
}

export interface ChildTaskExecutionResult {
    status: "success" | "partial" | "failed"
    attemptedCount: number
    createdCount: number
    failedCount: number
    createdWorkItemIds: number[]
    items: ChildTaskExecutionItem[]
    errorMessage?: string
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

    /**
     * Azure DevOps rejects a patch that sets the same field twice (VS403691).
     * Default title comes from the interpolated task name; an explicit
     * System.Title field overrides it. Later fields win for duplicate names.
     */
    private buildPatchDocument(parent: WorkItem, task: Task): JsonPatchOperation[] {
        const patch: JsonPatchOperation[] = [this.newParentRelation(parent)]
        const fields = new Map<string, { name: string; value: unknown }>()

        const setField = (name: string, value: unknown) => {
            const trimmed = name.trim()
            if (!trimmed) {
                return
            }
            const key = trimmed.toLowerCase()
            const existing = fields.get(key)
            if (existing) {
                existing.value = value
                return
            }
            fields.set(key, { name: trimmed, value })
        }

        const titleFromName = ChildTasksService.interpolate(task.name, parent)
        if (titleFromName !== null) {
            setField("System.Title", titleFromName)
        }

        for (const field of task.fields ?? []) {
            if (!field?.name) {
                continue
            }
            const interpolatedValue = ChildTasksService.interpolate(field.value, parent)
            if (interpolatedValue !== null && interpolatedValue.trim() !== "") {
                setField(field.name, interpolatedValue)
            }
        }

        for (const field of fields.values()) {
            patch.push(this.newFieldOperation(field.name, field.value))
        }

        return patch
    }

    public async execute(context: any): Promise<ChildTaskExecutionResult> {
        console.log("[ChildTasksService] execute called with context:", context)

        if (!this.templates || this.templates.length === 0) {
            console.warn("[ChildTasksService] Template is undefined or has an incorrect format.")
            return ChildTasksService.createResult({
                errorMessage: "No templates were selected.",
            })
        }

        const parentRef = resolveParentWorkItem(context)
        if (!parentRef.ok) {
            console.warn("[ChildTasksService] No usable parent work item in context:", parentRef.error)
            return ChildTasksService.createResult({ errorMessage: parentRef.error })
        }

        // Board, backlog and query menus do not pass the project: use the page's.
        const projectId = parentRef.projectId ?? SDK.getWebContext()?.project?.id
        if (!projectId) {
            return ChildTasksService.createResult({
                errorMessage: "The current project could not be determined.",
            })
        }
        const workItemId = parentRef.workItemId
        const results: ChildTaskExecutionItem[] = []

        let parent: WorkItem

        try {
            console.log("[ChildTasksService] Getting parent work item:", workItemId)
            parent = await this.getWorkItem(projectId, workItemId)
            console.log("[ChildTasksService] Parent work item:", parent)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            console.error("[ChildTasksService] Failed to load parent work item:", error)
            return ChildTasksService.createResult({
                errorMessage: `Failed to load the parent work item: ${errorMessage}`,
            })
        }

        for (let t = 0; t < this.templates.length; t++) {
            const template = this.templates[t]
            console.info("[ChildTasksService] Creating tasks from template:", template.name)

            for (let i = 0; i < template.tasks.length; i++) {
                const task = template.tasks[i] as Task
                if (!task) {
                    continue
                }

                const workItemType = task.workItemType || "Task"

                try {
                    const patch = this.buildPatchDocument(parent, task)

                    console.info("[ChildTasksService] Creating work item:", task.name, "Type:", workItemType)
                    console.log("[ChildTasksService] Patch document:", JSON.stringify(patch, null, 2))

                    const workItem = await this.createWorkItem(projectId, workItemType, patch)
                    console.info("[ChildTasksService] Created work item", workItem.id, "Type:", workItemType)
                    results.push({
                        templateName: template.name,
                        taskName: task.name,
                        workItemType,
                        status: "success",
                        workItemId: workItem.id,
                    })
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : "Unknown error"
                    console.error("[ChildTasksService] Failed to create work item:", error)
                    results.push({
                        templateName: template.name,
                        taskName: task.name,
                        workItemType,
                        status: "failed",
                        errorMessage,
                    })
                }
            }
        }

        console.log("[ChildTasksService] All tasks created successfully")
        return ChildTasksService.createResult({
            items: results,
        })
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
        // Azure DevOps omits empty fields from the parent, so a placeholder such as
        // {System.AssignedTo.uniqueName} on an unassigned item resolves to "".
        return pupa(text, obj, { transform: ({ value }) => value ?? "" })
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

    private static createResult({
        items = [],
        errorMessage,
    }: {
        items?: ChildTaskExecutionItem[]
        errorMessage?: string
    }): ChildTaskExecutionResult {
        const createdWorkItemIds = items
            .filter((item) => item.status === "success" && item.workItemId !== undefined)
            .map((item) => item.workItemId as number)
        const failedCount = items.filter((item) => item.status === "failed").length
        const createdCount = createdWorkItemIds.length
        const attemptedCount = items.length

        if (errorMessage && attemptedCount === 0) {
            return {
                status: "failed",
                attemptedCount,
                createdCount,
                failedCount,
                createdWorkItemIds,
                items,
                errorMessage,
            }
        }

        if (failedCount === 0) {
            return {
                status: "success",
                attemptedCount,
                createdCount,
                failedCount,
                createdWorkItemIds,
                items,
            }
        }

        return {
            status: createdCount > 0 ? "partial" : "failed",
            attemptedCount,
            createdCount,
            failedCount,
            createdWorkItemIds,
            items,
            errorMessage,
        }
    }
}
